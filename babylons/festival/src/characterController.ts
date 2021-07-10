/**
 * characterController.ts is going to contain all of the
 * logic relating to our player and the player's movements.
 */
/*  */
import {
  AbstractMesh,
  ActionManager,
  AnimationGroup,
  Color3,
  Color4,
  ExecuteCodeAction,
  Mesh,
  Observable,
  ParticleSystem,
  Quaternion,
  Ray,
  Scene,
  ShadowGenerator,
  Sound,
  SphereParticleEmitter,
  Texture,
  TransformNode,
  UniversalCamera,
  Vector3,
} from '@babylonjs/core';
import { NUM_LANTERNS } from './constants';
import { PlayerInput } from './inputController';
import { noop } from './utils';

export type PlayerAssets = {
  mesh: Mesh;
  animationGroups: AnimationGroup[];
};

function meshPredicate(mesh: AbstractMesh) {
  return mesh.isPickable && mesh.isEnabled();
}

export class Player extends TransformNode {
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(
    0.5934119456780721,
    0,
    0
  );
  private static readonly DOWN_TILT: Vector3 = new Vector3(
    0.8290313946973066,
    0,
    0
  );
  private static readonly PLAYER_SPEED: number = 0.45;
  private static readonly JUMP_FORCE: number = 0.8;
  private static readonly GRAVITY: number = -2.8;
  private static DASH_FACTOR: number = 2.5;
  private static DASH_TIME: number = 10;

  public win: boolean = false;

  // Camera
  public camera: UniversalCamera;
  private _camRoot: TransformNode;
  private _yTilt: TransformNode;

  // animations
  private _runAG: AnimationGroup;
  private _idleAG: AnimationGroup;
  private _jumpAG: AnimationGroup;
  private _landAG: AnimationGroup;
  private _dashAG: AnimationGroup;

  // animation trackers
  private _currentAnim: AnimationGroup;
  private _prevAnim: AnimationGroup;
  // animation flag
  private _isFalling: boolean = false;
  private _jumped: boolean = false;

  // sfx, sound effects
  public lightSfx: Sound;
  public sparkResetSfx: Sound;
  private _dashingSfx: Sound;
  private _resetSfx: Sound;
  private _walkingSfx: Sound;
  private _jumpingSfx: Sound;
  /**
   * Player
   * outer collisionbox of player
   */
  public mesh: Mesh;

  // sparkler
  sparkler: ParticleSystem; // sparkler particle system
  public sparkLit: boolean;
  public sparkReset: boolean;
  public lanternsLit: number = 1;

  public onRun = new Observable<boolean>();

  private _inputAmt: number;
  private _input: PlayerInput;

  // player movements
  public dashTime: number = 0;
  private _deltaTime: number;
  private _h: number;
  private _v: number;
  private _moveDirection: Vector3 = new Vector3();

  // dashing
  private _dashPressed: boolean;
  private _canDash: boolean;

  // gravity, grounde detection, jumping
  private _gravity: Vector3 = new Vector3();
  private _lastGroundPos: Vector3 = Vector3.Zero();
  private _grounded: boolean;
  private _jumpCount: number = 1;

  // moving platforms
  public _raisePlatform: boolean;

  public tutorial_move: boolean = false;
  public tutorial_jump: boolean = false;
  public tutorial_dash: boolean = false;

  constructor(
    assets: PlayerAssets,
    scene: Scene,
    shadowGenerator: ShadowGenerator,
    input: PlayerInput
  ) {
    super('player', scene);
    this._scene = scene;

    // setup sfx
    this._loadSounds(scene);
    // camera
    this._setupPlayerCamera();
    this.mesh = assets.mesh;
    this.mesh.parent = this;

    this._scene.getLightByName('sparklight')!.parent =
      this._scene.getTransformNodeByName('Empty');

    this._dashAG = assets.animationGroups[0];
    this._idleAG = assets.animationGroups[1];
    this._jumpAG = assets.animationGroups[2];
    this._landAG = assets.animationGroups[3];
    this._runAG = assets.animationGroups[4];

    // -- COLLISSIONS--
    const actionManager = new ActionManager(this._scene);

    actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: this._scene.getMeshByName('destination'),
        },
        () => {
          if (this.lanternsLit === NUM_LANTERNS) {
            this.win = true;
            // tilt camera to look at where the fireworks will be displayed
            this._yTilt.rotation = new Vector3(
              5.689773361501514,
              0.23736477827122882,
              0
            );
            this._yTilt.position = new Vector3(0, 6, 0);
            this.camera.position.y = 17;
          }
        }
      )
    );
    actionManager.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnIntersectionEnterTrigger,
          parameter: this._scene.getMeshByName('ground'),
        },
        () => {
          // reset the position
          this.mesh.position.copyFrom(this._lastGroundPos); // need to use copy or else they will be both pointing at the same thing & update together
          // --SOUNDS--
          this._resetSfx.play();
        }
      )
    );
    this.mesh.actionManager = actionManager;

    //--SOUNDS--
    //observable for when to play the walking sfx
    this.onRun.add((play) => {
      if (play && !this._walkingSfx.isPlaying) {
        this._walkingSfx.play();
      } else if (!play && this._walkingSfx.isPlaying) {
        this._walkingSfx.stop();
        this._walkingSfx.isPlaying = false; // make sure that walkingsfx.stop is called only once
      }
    });

    this._createSparkles();
    this._setupAnimations();
    // this player mesh will cast shadows
    shadowGenerator.addShadowCaster(assets.mesh);

    // inputs from inputController.ts
    this._input = input;
  }
  private _updateFromControl(): void {
    this._deltaTime = this._scene.getEngine().getDeltaTime() / 1000.0;
    this._moveDirection = Vector3.Zero();
    // right, z
    this._h = this._input.horizontal;
    // forward, z
    this._v = this._input.vertical;

    // tutorial, if the player moves for the first time
    if ((this._h !== 0 || this._v !== 0) && !this.tutorial_move) {
      this.tutorial_move = true;
    }

    // --DASHING--
    // limit dash to once per ground/platform touch
    // can only dash when in the air
    if (
      this._input.dashing &&
      !this._dashPressed &&
      this._canDash &&
      !this._grounded
    ) {
      this._canDash = false;
      this._dashPressed = true;

      // sfx and animations
      this._currentAnim = this._dashAG;
      this._dashingSfx.play();

      // tutorial, if the player dashes for the first time
      if (!this.tutorial_dash) {
        this.tutorial_dash = true;
      }
    }

    let dashFactor = 1;
    // already dashing, scale movement
    if (this._dashPressed) {
      if (this.dashTime > Player.DASH_TIME) {
        this.dashTime = 0;
        this._dashPressed = false;
      } else {
        dashFactor = Player.DASH_FACTOR;
      }
      this.dashTime += 1;
    }

    // --MOVEMENTS BASED ON CAMERA (as it rotates)--
    const fwd = this._camRoot.forward;
    const right = this._camRoot.right;
    const correctedVertical = fwd.scaleInPlace(this._v);
    const correctedHorizontal = right.scaleInPlace(this._h);

    // movement based off of camera's view
    const move = correctedHorizontal.addInPlace(correctedVertical);

    // clear y so that the character doesnt
    // fly up, normalize for next step,
    // taking into account whether we've DASHED or not
    this._moveDirection = new Vector3(
      move.normalize().x * dashFactor,
      0,
      move.normalize().z * dashFactor
    );
    // clamp the input value so that diagonal
    // movement isn't twice as fast
    const inputMag = Math.abs(this._h) + Math.abs(this._v);
    this._inputAmt = Math.min(1, Math.max(0, inputMag));

    // final movement that takes into consideration the inputs
    this._moveDirection = this._moveDirection.scaleInPlace(
      this._inputAmt * Player.PLAYER_SPEED
    );

    // check if there is movement to determine if rotation is needed
    const input = new Vector3(
      this._input.horizontalAxis,
      0,
      this._input.verticalAxis
    ); // along which axis is the direction

    if (input.length() == 0) {
      // if there's no input detected, prevent rotation and keep player in same rotation
      return;
    }

    // rotation based on input & the camera angle
    const angle =
      Math.atan2(this._input.horizontalAxis, this._input.verticalAxis) +
      this._camRoot.rotation.y;
    const targ = Quaternion.FromEulerAngles(0, angle, 0);
    this.mesh.rotationQuaternion = Quaternion.Slerp(
      this.mesh.rotationQuaternion!,
      targ,
      10 * this._deltaTime
    );
  }

  private _setupAnimations() {
    this._scene.stopAllAnimations();
    this._runAG.loopAnimation = true;
    this._idleAG.loopAnimation = true;

    // initialize current and previous
    this._currentAnim = this._idleAG;
    this._prevAnim = this._landAG;
  }

  private _animatePlayer(): void {
    if (
      !this._dashPressed &&
      !this._isFalling &&
      !this._jumped &&
      (this._input.inputMap['ArrowUp'] ||
        this._input.mobileUp ||
        this._input.inputMap['ArrowDown'] ||
        this._input.mobileDown ||
        this._input.inputMap['ArrowLeft'] ||
        this._input.mobileLeft ||
        this._input.inputMap['ArrowRight'] ||
        this._input.mobileRight)
    ) {
      this._currentAnim = this._runAG;
      this.onRun.notifyObservers(true);
    } else if (this._jumped && !this._isFalling && !this._dashPressed) {
      this._currentAnim = this._jumpAG;
    } else if (!this._isFalling && this._grounded) {
      this._currentAnim = this._idleAG;
      // only notify observer if it's playing
      if (this._scene.getSoundByName('walking')?.isPlaying) {
        this.onRun.notifyObservers(false);
      }
    } else if (this._isFalling) {
      this._currentAnim = this._landAG;
    }

    // Animations
    if (this._currentAnim !== null && this._prevAnim !== this._currentAnim) {
      this._prevAnim.stop();
      this._currentAnim.play(this._currentAnim.loopAnimation);
      this._prevAnim = this._currentAnim;
    }
  }

  // --GROUND DETECTION--
  // Send raycast to the floor to detect if there are any hits with meshes below the character
  private _floorRaycast(
    offsetx: number,
    offsetz: number,
    raycastlen: number
  ): Vector3 {
    const raycastFloorPos = new Vector3(
      this.mesh.position.x + offsetx,
      this.mesh.position.y + 0.5,
      this.mesh.position.z + offsetz
    );
    const ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

    // defined which type of meshes should be pickable

    const pick = this._scene.pickWithRay(ray, meshPredicate);

    if (pick && pick.hit) {
      // grounded
      return pick.pickedPoint!;
    } else {
      // not grounded
      return Vector3.Zero();
    }
  }

  // raycast from the center of the player to check whether player is grounded
  private _isGrounded(): boolean {
    if (this._floorRaycast(0, 0, 0.6).equals(Vector3.Zero())) {
      return false;
    }

    return true;
  }

  // https://www.babylonjs-playground.com/#FUK3S#8
  // https://www.html5gamedevs.com/topic/7709-scenepick-a-mesh-that-is-enabled-but-not-visible/
  // check whether a mesh is sloping based on the normal
  private _checkSlop(): boolean {
    // only check meshes that are pickable and enabled (specific for collision meshes that are invisible)

    const raycastPoints = [
      new Vector3(
        this.mesh.position.x,
        this.mesh.position.y + 0.5,
        this.mesh.position.z + 0.25
      ),
      new Vector3(
        this.mesh.position.x,
        this.mesh.position.y + 0.5,
        this.mesh.position.z - 0.25
      ),
      new Vector3(
        this.mesh.position.x + 0.25,
        this.mesh.position.y + 0.5,
        this.mesh.position.z
      ),
      new Vector3(
        this.mesh.position.x - 0.25,
        this.mesh.position.y + 0.5,
        this.mesh.position.z
      ),
    ];
    const vector3down = Vector3.Up().scale(-1);
    const pickPoints = raycastPoints.map((raycast) => {
      const ray = new Ray(raycast, vector3down, 1.5);
      return this._scene.pickWithRay(ray, meshPredicate);
    });
    return pickPoints.some(
      (pick) =>
        pick &&
        pick.hit &&
        !pick.getNormal()?.equals(Vector3.Up()) &&
        pick.pickedMesh?.name.includes('stair')
    );
  }
  private _updateGroundDetection() {
    this._deltaTime = this._scene.getEngine().getDeltaTime() / 1000.0;

    if (this._isGrounded()) {
      // if grounded
      this._gravity.y = 0;
      this._grounded = true;
      // keep track of last known ground position
      this._lastGroundPos.copyFrom(this.mesh.position);
      this._jumpCount = 1; // allow for jumping
      // reset dasing
      this._canDash = true;

      // reset sequence(needed if we collide with the groud BEFORE actually completing the dash duration)
      this.dashTime = 0;
      this._dashPressed = false;

      // jump & falling animation flags
      this._jumped = false;
      this._isFalling = false;
    } else {
      // if the body isn't grounded, check if it's on a slope and is either falling or walking onto it
      if (this._checkSlop() && this._gravity.y <= 0) {
        console.log('slope');
        // if you're considered on a slope,
        // you're able to jump and gravity wont affect you
        this._gravity.y = 0;
        this._jumpCount = 1;
        this._grounded = true;
      } else {
        // keep applying gravity
        this._gravity = this._gravity.addInPlace(
          Vector3.Up().scale(this._deltaTime * Player.GRAVITY)
        );
        this._grounded = false;
      }
    }

    // limit the speed of gravity to the negative of the jump power
    if (this._gravity.y < -Player.JUMP_FORCE) {
      this._gravity.y = -Player.JUMP_FORCE;
    }

    // cue falling animation once gravity starts pushing down
    if (this._gravity.y < 0 && this._jumped) {
      /**
       * MAYBE TTMAY
       * play a falling animation if not grounded but not on a slope
       */
      this._isFalling = true;
    }

    // update the movement to account for jumping
    this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));

    // jump detection
    if (this._input?.jumpKeyDown && this._jumpCount > 0) {
      this._gravity.y = Player.JUMP_FORCE;
      this._jumpCount--;

      //jumping and falling animation flags
      this._jumped = true;
      this._isFalling = false;
      this._jumpingSfx.play();

      // tutorial, if the player jumps for the first time
      if (!this.tutorial_jump) {
        this.tutorial_jump = true;
      }
    }
  }
  /**
   * third person camera that would follow the character,
   *
   * hierarchy for the camera system:
   * _camRoot: {TransformNode} handles the overall positioning of the camera
   *      _yTilt: {TransformNode} rotation along the x-axis of our camera
   *          camera: {UniversalCamera} actual camera object
   *
   *
   */
  private _setupPlayerCamera(): UniversalCamera {
    // root camera parent
    // handles positioning of the camera to follow the player
    this._camRoot = new TransformNode('root');
    // initialized at (0,0,0)
    this._camRoot.position = new Vector3(0, 0, 0);
    // to face the player from behind (180 degrees)
    this._camRoot.rotation = new Vector3(0, Math.PI, 0);

    // rotations along the x-axis (up/down tilting)
    const yTilt = new TransformNode('ytilt');
    yTilt.rotation = Player.ORIGINAL_TILT;
    this._yTilt = yTilt;
    yTilt.parent = this._camRoot;

    // actual camera that's pointing at the root's position
    this.camera = new UniversalCamera(
      'cam',
      new Vector3(0, 0, -30),
      this._scene
    );
    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.47350045992678597;
    this.camera.parent = yTilt;

    this._scene.activeCamera = this.camera;
    return this.camera;
  }

  private _createSparkles(): void {
    const sphere = Mesh.CreateSphere('sparkles', 4, 1, this._scene);
    sphere.isVisible = false;
    sphere.position = new Vector3(0, 0, 0);
    // playce the particle system at the tip of the sparkler on the player mesh
    sphere.parent = this._scene.getTransformNodeByName('Empty');

    const particleSystem = new ParticleSystem('sparkles', 1000, this._scene);
    particleSystem.particleTexture = new Texture(
      'textures/flwr.png',
      this._scene
    );

    particleSystem.emitter = sphere;
    particleSystem.particleEmitterType = new SphereParticleEmitter(0);

    particleSystem.updateSpeed = 0.014;
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = 360;
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;

    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 2;
    particleSystem.minScaleX = 0.5;
    particleSystem.minScaleY = 0.5;
    particleSystem.color1 = new Color4(0.8, 0.8549019607843137, 1, 1);
    particleSystem.color2 = new Color4(
      0.8509803921568627,
      0.7647058823529411,
      1,
      1
    );

    particleSystem.addRampGradient(0, Color3.White());
    particleSystem.addRampGradient(1, Color3.Black());
    particleSystem.getRampGradients()![0].color =
      Color3.FromHexString('#BBC1FF');
    particleSystem.getRampGradients()![1].color =
      Color3.FromHexString('#FFFFFF');
    particleSystem.maxAngularSpeed = 0;
    particleSystem.maxInitialRotation = 360;
    particleSystem.minAngularSpeed = -10;
    particleSystem.maxAngularSpeed = 10;

    particleSystem.start();

    this.sparkler = particleSystem;
  }

  activatePlayerCamera(): UniversalCamera {
    this._scene.registerBeforeRender(() => {
      this._beforeRenderUpdate();
      this._updateCamera();
    });
    return this.camera;
  }

  // --CAMERA--
  private _updateCamera(): void {
    // trigger areas for rotating camera view
    if (this.mesh.intersectsMesh(this._scene.getMeshByName('cornerTrigger')!)) {
      const horizontalAxis = this._input.horizontalAxis;
      if (horizontalAxis !== 0) {
        const targetVector3 = new Vector3(
          this._camRoot.rotation.x,
          horizontalAxis > 0 ? Math.PI / 2 : Math.PI,
          this._camRoot.rotation.z
        );
        // Math.PI/2 -> rotates to the left
        // Math.PI -> rotates to the right
        this._camRoot.rotation = Vector3.Lerp(
          this._camRoot.rotation,
          targetVector3,
          0.4
        );
      }
    }

    // rotates the camera to point down at the player when they enter the area, and returns it back to normal when they exit
    if (
      this.mesh.intersectsMesh(this._scene.getMeshByName('festivalTrigger')!)
    ) {
      const verticalAxis = this._input.verticalAxis;
      if (verticalAxis !== 0) {
        this._yTilt.rotation = Vector3.Lerp(
          this._yTilt.rotation,
          verticalAxis > 0 ? Player.DOWN_TILT : Player.ORIGINAL_TILT,
          0.4
        );
      }
    }
    // once you've reached the destination area, return back to the original orientation, if they leave rotate it to the previous orientation
    if (
      this.mesh.intersectsMesh(this._scene.getMeshByName('destinationTrigger')!)
    ) {
      const verticalAxis = this._input.verticalAxis;
      if (verticalAxis !== 0) {
        this._yTilt.rotation = Vector3.Lerp(
          this._yTilt.rotation,
          verticalAxis > 0 ? Player.ORIGINAL_TILT : Player.DOWN_TILT,
          0.4
        );
      }
    }

    // update camera position up/down movement
    const centerPlayer = this.mesh.position.y + 2;
    this._camRoot.position = Vector3.Lerp(
      this._camRoot.position,
      new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z),
      0.4
    );
  }

  // --GAME UPDATES--
  private _beforeRenderUpdate() {
    this._updateFromControl();
    this._updateGroundDetection();
    this._animatePlayer();
  }
  private _loadSounds(scene: Scene) {
    this.lightSfx = new Sound('light', './sounds/Rise03.mp3', scene, noop);

    this.sparkResetSfx = new Sound(
      'sparkReset',
      './sounds/Rise04.mp3',
      scene,
      noop
    );

    this._jumpingSfx = new Sound(
      'jumping',
      './sounds/187024__lloydevans09__jump2.wav',
      scene,
      noop,
      {
        volume: 0.25,
      }
    );

    this._dashingSfx = new Sound(
      'dashing',
      './sounds/194081__potentjello__woosh-noise-1.wav',
      scene,
      noop
    );

    this._walkingSfx = new Sound(
      'walking',
      './sounds/Concrete_2.wav',
      scene,
      noop,
      {
        loop: true,
        volume: 0.2,
        playbackRate: 0.6,
      }
    );

    this._resetSfx = new Sound(
      'reset',
      './sounds/Retro_Magic_Protection_25.wav',
      scene,
      noop,
      {
        volume: 0.25,
      }
    );
  }
}
