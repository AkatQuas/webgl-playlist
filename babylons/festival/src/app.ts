import {
  Color3,
  Color4,
  CubeTexture,
  Effect,
  Engine,
  EngineFactory,
  FreeCamera,
  GlowLayer,
  Matrix,
  Mesh,
  MeshBuilder,
  PointLight,
  PostProcess,
  Quaternion,
  Scene,
  SceneLoader,
  ShadowGenerator,
  Sound,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/core/Debug/debugLayer';
import {
  AdvancedDynamicTexture,
  Button,
  Control,
  Image,
  Rectangle,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui';
import '@babylonjs/inspector';
import '@babylonjs/loaders/glTF';
import { Player, PlayerAssets } from './characterController';
import { NUM_LANTERNS, State } from './constants';
import { Environment } from './environment';
import { PlayerInput } from './inputController';
import { Hud } from './ui';
import { isMobileBrowser, noop, setupDebugLayer } from './utils';

/**
 * App class is our entire game Application
 */
class App {
  private activeScene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;

  public assets: PlayerAssets;
  private _ui: Hud;
  private player: Player;
  private _input: PlayerInput;
  private _environment: Environment;
  private _transition: boolean;

  private state: State = State.IDLE;

  private cutScene: Scene;
  private gameScene: Scene;

  public gameSound: Sound;
  public endSound: Sound;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;

    // initialize babylon scene and engine
    (
      EngineFactory.CreateAsync(this._canvas, undefined) as Promise<Engine>
    ).then((e: Engine) => {
      this._engine = e;
      this.activeScene = new Scene(this._engine);

      setupDebugLayer(this.activeScene);

      window.addEventListener('resize', () => {
        this._engine.resize();
      });
      this.main();
    });
  }
  /**
   * MAIN loop
   */
  private async main() {
    await this.goStart();
    this._engine.runRenderLoop(() => {
      switch (this.state) {
        case State.IDLE:
          this.activeScene.render();
          break;
        case State.READY:
          this.activeScene.render();
          break;
        case State.CUTSCENE:
          this.activeScene.render();
          break;
        case State.GAMING:
          // if 240seconds/ 4mins have have passed,
          // go to the lose state
          if (this._ui.time >= 240 && !this.player.win) {
            this.goLoss();
            this._ui.stopTimer();
          }

          if (this._ui.quit) {
            this.goStart();
            this._ui.quit = false;
          }
          this.activeScene.render();
          break;
        case State.LOSS:
          this.activeScene.render();
          break;
        default:
          break;
      }
    });
  }

  /**
   * start scene
   */
  private async goStart() {
    this._engine.displayLoadingUI();

    // --SCENE SETUP--
    // dont detect any inputs from this ui while the game is loading
    this.activeScene.detachControl();

    const scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    // creates and positions a free camera
    const camera = new FreeCamera('camera', new Vector3(0, 0, 0), scene);
    // targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // --SOUNDS--
    new Sound('startSong', './sounds/copycat(revised).mp3', scene, noop, {
      volume: 0.25,
      loop: true,
      autoplay: true,
    });
    const sfx = new Sound(
      'selection',
      './sounds/vgmenuselect.wav',
      scene,
      noop
    );

    // --GUI--
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    guiMenu.idealHeight = 720;

    // background image
    const imageRect = new Rectangle('titleContainer');
    imageRect.width = 0.8;
    imageRect.thickness = 0;
    guiMenu.addControl(imageRect);

    const startBG = new Image('startBG', './sprites/start.jpeg');
    imageRect.addControl(startBG);

    const title = new TextBlock('title', 'Natsu Festival');
    title.resizeToFit = true;
    title.fontFamily = 'Ceviche One';
    title.fontSize = '64px';
    title.color = '#66ccff';
    title.top = '14px';
    title.width = 0.8;
    title.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    imageRect.addControl(title);

    const startBtn = Button.CreateSimpleButton('start', 'PLAY');
    startBtn.fontFamily = 'Viga';
    startBtn.width = 0.2;
    startBtn.height = '40px';
    startBtn.fontSize = '32px';
    startBtn.color = 'white';
    startBtn.top = '-14px';
    startBtn.thickness = 0;
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    imageRect.addControl(startBtn);

    //set up transition effect : modified version of https://www.babylonjs-playground.com/#2FGYE8#0
    Effect.RegisterShader(
      'fade',
      `precision highp float;
      varying vec2 vUV;
      uniform sampler2D textureSampler;
      uniform float fadeLevel;
      void main(void) {
        vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;
        baseColor.a = 1.0;
        gl_FragColor = baseColor;
      }`
    );

    let fadeLevel = 1.0;
    this._transition = false;
    scene.registerBeforeRender(() => {
      if (this._transition) {
        fadeLevel -= 0.05;
        if (fadeLevel <= 0) {
          this.goCutScene();
          this._transition = false;
        }
      }
    });

    // this handles interactions with the start button attached to the scene
    startBtn.onPointerDownObservable.add(() => {
      // fade screen
      const postProcess = new PostProcess(
        'Fade',
        'fade',
        ['fadeLevel'],
        null,
        1.0,
        camera
      );
      postProcess.onApply = (effect) => {
        effect.setFloat('fadeLevel', fadeLevel);
      };
      this._transition = true;
      //sounds
      sfx.play();

      scene.detachControl();
    });

    if (isMobileBrowser()) {
      // popup for mobile to rotate screen
      const rect1 = new Rectangle();
      rect1.height = 0.2;
      rect1.width = 0.3;
      rect1.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      rect1.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      rect1.background = 'white';
      rect1.alpha = 0.8;
      guiMenu.addControl(rect1);

      const rect2 = new Rectangle();
      rect2.height = 0.2;
      rect2.width = 0.3;
      rect2.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      rect2.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      rect2.color = 'white';
      guiMenu.addControl(rect2);
      const stackPanel = new StackPanel();
      stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
      rect2.addControl(stackPanel);

      const img = new Image('rotate', './sprites/rotate.png');
      img.width = 0.4;
      img.height = 0.6;
      img.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      rect2.addControl(img);

      // alert message
      const alert = new TextBlock(
        'alert',
        'For the best experience, please rotate your device'
      );
      alert.fontSize = '16px';
      alert.fontFamily = 'Viga';
      alert.color = 'black';
      alert.resizeToFit = true;
      alert.textWrapping = true;
      stackPanel.addControl(alert);

      const closealert = Button.CreateSimpleButton('close', 'X');
      closealert.height = '24px';
      closealert.width = '24px';
      closealert.color = 'black';
      stackPanel.addControl(closealert);

      // remove control of the play button until the user closes the notification(allowing for fullscreen mode)
      startBtn.isHitTestVisible = false;

      closealert.onPointerUpObservable.add(() => {
        guiMenu.removeControl(rect2);
        guiMenu.removeControl(rect1);

        startBtn.isHitTestVisible = true;
        this._engine.enterFullscreen(true);
      });
    }

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI(); // when the scene is ready, hide loading

    // lastly set the current state to the start state and set the scene to the start scene
    this.activeScene.dispose();
    this.activeScene = scene;
    this.state = State.READY;
  }

  private async goCutScene() {
    this._engine.displayLoadingUI();

    // --SETUP SCENE--
    // dont detect any inputs from this ui while the game is loading
    this.activeScene.detachControl();

    this.cutScene = new Scene(this._engine);

    const camera = new FreeCamera(
      'camera1',
      new Vector3(0, 0, 0),
      this.cutScene
    );
    camera.setTarget(Vector3.Zero());
    this.cutScene.clearColor = new Color4(0, 0, 0, 1);

    // --GUI--
    const cutScene = AdvancedDynamicTexture.CreateFullscreenUI('cutscene');
    let canPlay = false;
    // totoal 8 animations
    let anims_loaded = 0;

    // Animations
    const beginning_anim = new Image(
      'sparkLife',
      './sprites/beginning_anim.png'
    );
    beginning_anim.stretch = Image.STRETCH_UNIFORM;
    beginning_anim.cellId = 0;
    beginning_anim.cellHeight = 480;
    beginning_anim.cellWidth = 480;
    beginning_anim.sourceWidth = 480;
    beginning_anim.sourceHeight = 480;
    cutScene.addControl(beginning_anim);
    beginning_anim.onImageLoadedObservable.add(() => {
      anims_loaded += 1;
    });
    const working_anim = new Image('sparkLife', './sprites/working_anim.png');
    working_anim.stretch = Image.STRETCH_UNIFORM;
    working_anim.cellId = 0;
    working_anim.cellHeight = 480;
    working_anim.cellWidth = 480;
    working_anim.sourceWidth = 480;
    working_anim.sourceHeight = 480;
    working_anim.isVisible = false;
    cutScene.addControl(working_anim);
    working_anim.onImageLoadedObservable.add(() => {
      anims_loaded++;
    });
    const dropoff_anim = new Image('sparkLife', './sprites/dropoff_anim.png');
    dropoff_anim.stretch = Image.STRETCH_UNIFORM;
    dropoff_anim.cellId = 0;
    dropoff_anim.cellHeight = 480;
    dropoff_anim.cellWidth = 480;
    dropoff_anim.sourceWidth = 480;
    dropoff_anim.sourceHeight = 480;
    dropoff_anim.isVisible = false;
    cutScene.addControl(dropoff_anim);
    dropoff_anim.onImageLoadedObservable.add(() => {
      anims_loaded++;
    });
    const leaving_anim = new Image('sparkLife', './sprites/leaving_anim.png');
    leaving_anim.stretch = Image.STRETCH_UNIFORM;
    leaving_anim.cellId = 0;
    leaving_anim.cellHeight = 480;
    leaving_anim.cellWidth = 480;
    leaving_anim.sourceWidth = 480;
    leaving_anim.sourceHeight = 480;
    leaving_anim.isVisible = false;
    cutScene.addControl(leaving_anim);
    leaving_anim.onImageLoadedObservable.add(() => {
      anims_loaded++;
    });
    const watermelon_anim = new Image(
      'sparkLife',
      './sprites/watermelon_anim.png'
    );
    watermelon_anim.stretch = Image.STRETCH_UNIFORM;
    watermelon_anim.cellId = 0;
    watermelon_anim.cellHeight = 480;
    watermelon_anim.cellWidth = 480;
    watermelon_anim.sourceWidth = 480;
    watermelon_anim.sourceHeight = 480;
    watermelon_anim.isVisible = false;
    cutScene.addControl(watermelon_anim);
    watermelon_anim.onImageLoadedObservable.add(() => {
      anims_loaded++;
    });
    const reading_anim = new Image('sparkLife', './sprites/reading_anim.png');
    reading_anim.stretch = Image.STRETCH_UNIFORM;
    reading_anim.cellId = 0;
    reading_anim.cellHeight = 480;
    reading_anim.cellWidth = 480;
    reading_anim.sourceWidth = 480;
    reading_anim.sourceHeight = 480;
    reading_anim.isVisible = false;
    cutScene.addControl(reading_anim);
    reading_anim.onImageLoadedObservable.add(() => {
      anims_loaded++;
    });

    // Dialogue animations
    const dialogueBg = new Image(
      'sparkLife',
      './sprites/bg_anim_text_dialogue.png'
    );
    dialogueBg.stretch = Image.STRETCH_UNIFORM;
    dialogueBg.cellId = 0;
    dialogueBg.cellHeight = 480;
    dialogueBg.cellWidth = 480;
    dialogueBg.sourceWidth = 480;
    dialogueBg.sourceHeight = 480;
    dialogueBg.horizontalAlignment = Image.HORIZONTAL_ALIGNMENT_LEFT;
    dialogueBg.verticalAlignment = Image.VERTICAL_ALIGNMENT_TOP;
    dialogueBg.isVisible = false;
    cutScene.addControl(dialogueBg);
    dialogueBg.onImageLoadedObservable.add(() => {
      anims_loaded++;
    });
    const dialogue = new Image('sparkLife', './sprites/text_dialogue.png');
    dialogue.stretch = Image.STRETCH_UNIFORM;
    dialogue.cellId = 0;
    dialogue.cellHeight = 480;
    dialogue.cellWidth = 480;
    dialogue.sourceWidth = 480;
    dialogue.sourceHeight = 480;
    dialogue.horizontalAlignment = Image.HORIZONTAL_ALIGNMENT_LEFT;
    dialogue.verticalAlignment = Image.VERTICAL_ALIGNMENT_TOP;
    dialogue.isVisible = false;
    cutScene.addControl(dialogue);
    dialogue.onImageLoadedObservable.add(() => {
      anims_loaded++;
    });

    let dialogueTimer: number;
    function animateDialogue() {
      dialogueTimer = window.setInterval(() => {
        dialogueBg.cellId = (dialogueBg.cellId + 1) % 4;
      }, 250);
    }

    //--PROGRESS DIALOGUE--
    const next = Button.CreateImageOnlyButton('next', './sprites/arrowBtn.png');
    next.rotation = Math.PI / 2;
    next.thickness = 0;
    next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    next.width = '64px';
    next.height = '64px';
    next.top = '-3%';
    next.left = '-12%';
    next.isVisible = false;
    cutScene.addControl(next);

    next.onPointerUpObservable.add(() => {
      if (dialogue.cellId === 8) {
        // once we reach the last dialogue frame, now the game is for play
        canPlay = true;
      } else if (dialogue.cellId < 8) {
        // 8 frames of dialogue
        dialogue.cellId++;
      }
    });
    // skip cutscene
    const skipBtn = Button.CreateSimpleButton('skip', 'SKIP');
    skipBtn.fontFamily = 'Viga';
    skipBtn.width = '45px';
    skipBtn.left = '-14px';
    skipBtn.height = '40px';
    skipBtn.color = 'white';
    skipBtn.top = '14px';
    skipBtn.thickness = 0;
    skipBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    skipBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    cutScene.addControl(skipBtn);

    skipBtn.onPointerDownObservable.add(() => {
      canPlay = true;
    });

    let finishedLoading = false;

    // --PLAYING ANIMATIONS--
    let animTimer: number;
    let anim2Timer: number;
    // keeps track of which animation we're playing
    let anim = 1;

    // set up the state maching for animations
    this.cutScene.onBeforeRenderObservable.add(() => {
      if (anims_loaded === 8) {
        this._engine.hideLoadingUI();
        anims_loaded = -1;
        animTimer = window.setInterval(() => {
          switch (anim) {
            case 1:
              if (beginning_anim.cellId === 9) {
                // each animation could have a different number of frames
                anim += 1;
                beginning_anim.isVisible = false;
                working_anim.isVisible = true;
              } else {
                beginning_anim.cellId += 1;
              }
              break;
            case 2:
              if (working_anim.cellId === 11) {
                anim++;
                working_anim.isVisible = false;
                dropoff_anim.isVisible = true;
              } else {
                working_anim.cellId += 1;
              }
              break;
            case 3:
              if (dropoff_anim.cellId == 11) {
                anim++;
                dropoff_anim.isVisible = false;
                leaving_anim.isVisible = true;
              } else {
                dropoff_anim.cellId++;
              }
              break;
            case 4:
              if (leaving_anim.cellId == 9) {
                anim++;
                leaving_anim.isVisible = false;
                watermelon_anim.isVisible = true;
                clearTimeout(animTimer);
              } else {
                leaving_anim.cellId++;
              }
              break;
            default:
              break;
          }
        }, 150);

        // animation sequence 2 that uses a different time interval
        anim2Timer = window.setInterval(() => {
          switch (anim) {
            case 5:
              if (watermelon_anim.cellId == 8) {
                anim++;
                watermelon_anim.isVisible = false;
                reading_anim.isVisible = true;
              } else {
                watermelon_anim.cellId++;
              }
              break;
            case 6:
              if (reading_anim.cellId == 11) {
                clearInterval(anim2Timer);
                reading_anim.isVisible = false;
                dialogueBg.isVisible = true;
                dialogue.isVisible = true;
                next.isVisible = true;
                animateDialogue();
              } else {
                reading_anim.cellId++;
              }
              break;
          }
        }, 250);
      }

      if (finishedLoading && canPlay) {
        anims_loaded = -1;
        clearInterval(animTimer);
        clearInterval(anim2Timer);
        clearInterval(dialogueTimer);
        canPlay = false;
        this.goGame();
      }
    });

    await this.cutScene.whenReadyAsync();
    this.activeScene.dispose();
    this.activeScene = this.cutScene;
    this.state = State.CUTSCENE;

    await this.setupGame().then(() => {
      finishedLoading = true;
    });
  }
  private async goGame() {
    this.activeScene.detachControl();
    this._engine.displayLoadingUI();

    // initialized in setupGame()
    const scene = this.gameScene;

    // --GUI--
    const ui = new Hud(scene);
    this._ui = ui;

    const envHdri = CubeTexture.CreateFromPrefilteredData(
      'textures/envtext.env',
      scene
    );
    envHdri.name = 'env';
    envHdri.gammaSpace = false;
    scene.environmentTexture = envHdri;
    scene.environmentIntensity = 0.1;

    // detect keyboard/mobile inputs
    this._input = new PlayerInput(scene, this._ui);

    // primitive character and setting
    // Initializes the game's loop
    // handles scene related updates & setting up meshes in scene
    await this._initializeGameAsync(scene);

    await scene.whenReadyAsync();

    scene.getMeshByName('outer')!.position = scene
      .getTransformNodeByName('startPosition')!
      .getAbsolutePosition();

    this._ui.startTimer();
    this._ui.startSparklerTimer(this.player.sparkler);

    this.activeScene.dispose();
    this.activeScene = scene;
    this.state = State.GAMING;
    this._engine.hideLoadingUI();
    this.activeScene.attachControl();

    // play the gamesong
    this.gameSound.play();
  }
  private async goLoss() {
    this._engine.displayLoadingUI();

    // --SCENE SETUP--
    this.activeScene.detachControl();
    const scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);

    const camera = new FreeCamera('camera1', new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    //--SOUNDS--
    const start = new Sound(
      'loseSong',
      './sound/Eye_of_the_Storm.mp3',
      scene,
      noop,
      {
        volume: 0.25,
        loop: true,
        autoplay: true,
      }
    );
    const sfx = new Sound(
      'selection',
      './sounds/vgmenuselect.wav',
      scene,
      noop
    );

    //--GUI--
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    guiMenu.idealHeight = 720;

    // background image
    const image = new Image('lose', 'sprites/lose.jpeg');
    image.autoScale = true;
    guiMenu.addControl(image);

    const panel = new StackPanel();
    guiMenu.addControl(panel);

    const text = new TextBlock();
    text.fontSize = 24;
    text.color = 'white';
    text.height = '100px';
    text.width = '100%';
    panel.addControl(text);

    text.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
    text.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
    text.text = "There's no fireworks this year";
    const dots = new TextBlock();
    dots.color = 'white';
    dots.fontSize = 24;
    dots.height = '100px';
    dots.width = '100%';
    dots.text = '....';

    const mainBtn = Button.CreateSimpleButton('mainmenu', 'MAIN MENU');
    mainBtn.width = 0.2;
    mainBtn.height = '40px';
    mainBtn.color = 'white';
    panel.addControl(mainBtn);

    // set up transition effect : modified version of https://www.babylonjs-playground.com/#2FGYE8#0
    Effect.RegisterShader(
      'fade',
      'precision highp float;' +
        'varying vec2 vUV;' +
        'uniform sampler2D textureSampler; ' +
        'uniform float fadeLevel; ' +
        'void main(void){' +
        'vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;' +
        'baseColor.a = 1.0;' +
        'gl_FragColor = baseColor;' +
        '}'
    );

    let fadeLevel = 1.0;
    this._transition = false;
    scene.registerBeforeRender(() => {
      if (this._transition) {
        fadeLevel -= 0.05;
        if (fadeLevel <= 0) {
          this.goStart();
          this._transition = false;
        }
      }
    });

    // this handles interactions with the start button attached to the scene
    mainBtn.onPointerUpObservable.add(() => {
      // todo: add fade transition & selection sfx
      scene.detachControl();
      guiMenu.dispose();

      this._transition = true;
      sfx.play();
    });

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this._engine.hideLoadingUI(); // when the scene is ready, hide loading
    // lastly set the current state to the lose state and set the scene to the lose scene
    this.activeScene.dispose();
    this.activeScene = scene;
    this.state = State.LOSS;
  }

  private async setupGame() {
    const scene = new Scene(this._engine);
    this.gameScene = scene;

    this._loadSounds(scene);

    const environment = new Environment(scene);
    this._environment = environment;
    // environment load
    await this._environment.load();
    await this._loadCharacterAssets(scene);
  }

  private _loadSounds(scene: Scene): void {
    this.gameSound = new Sound(
      'gameSong',
      './sounds/Christmassynths.wav',
      scene,
      noop,
      {
        loop: true,
        volume: 0.1,
      }
    );
    this.endSound = new Sound(
      'endSong',
      './sounds/copycat(revised).mp3',
      scene,
      noop,
      {
        volume: 0.25,
      }
    );
  }
  /**
   * setup the character mesh system
   * @param scene
   */
  private async _loadCharacterAssets(scene: Scene) {
    // collision mesh
    const outer = MeshBuilder.CreateBox(
      'outer',
      {
        width: 2,
        depth: 1,
        height: 3,
      },
      scene
    );
    outer.isVisible = false;
    outer.isPickable = false;
    outer.checkCollisions = true;

    // move origin of box collider to the bottom of the mesh (to match player mesh)
    outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));
    // for collision
    outer.ellipsoid = new Vector3(1, 1.5, 1);
    outer.ellipsoidOffset = new Vector3(0, 1.5, 0);
    // rotate the player mesh 180 since we want to the back of the player
    outer.rotationQuaternion = new Quaternion(0, 1, 0, 0);

    // --IMPORTING MESH--
    const result = await SceneLoader.ImportMeshAsync(
      null,
      './models/',
      'player.glb',
      scene
    );
    const root = result.meshes[0];
    const body = root;
    body.parent = outer;
    body.isPickable = false;
    body.getChildMeshes().forEach((m) => void (m.isPickable = false));
    this.assets = {
      mesh: outer as Mesh,
      animationGroups: result.animationGroups,
    };
  }

  /**
   * do all of the finishing touches to prepare the game scene once everything is imported & meshes are created
   * @param scene
   */
  private async _initializeGameAsync(scene: Scene) {
    scene.ambientColor = new Color3(
      0.34509803921568627,
      0.5568627450980392,
      0.8352941176470589
    );
    scene.clearColor = new Color4(
      0.01568627450980392,
      0.01568627450980392,
      0.20392156862745098
    );

    const light = new PointLight('sparklight', new Vector3(0, 0, 0), scene);
    light.diffuse = new Color3(
      0.08627450980392157,
      0.10980392156862745,
      0.15294117647058825
    );
    light.intensity = 55;
    light.radius = 1;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.darkness = 0.4;

    this.player = new Player(this.assets, scene, shadowGenerator, this._input);

    this.player.activatePlayerCamera();

    this._environment.checkLanterns(this.player);

    //--Transition post process--
    scene.registerBeforeRender(() => {
      if (this._ui.transition) {
        this._ui.fadeLevel -= 0.05;

        // once the fade transition has complete, switch scenes
        if (this._ui.fadeLevel <= 0) {
          this._ui.quit = true;
          this._ui.transition = false;
        }
      }
    });

    // --GAME LOOP--
    scene.onBeforeRenderObservable.add(() => {
      // reset the sparkler timer
      if (this.player.sparkReset) {
        this._ui.startSparklerTimer(this.player.sparkler);
        this.player.sparkReset = false;

        this._ui.updateLanternCount(this.player.lanternsLit);
      }
      // stop the sparkler timer after 20 seconds
      else if (this._ui.stopSpark && this.player.sparkLit) {
        this._ui.stopSparklerTimer(this.player.sparkler);
        this.player.sparkLit = false;
      }

      // if you've reached the destination and lit all the lanterns
      if (this.player.win && this.player.lanternsLit === NUM_LANTERNS) {
        // stop the timer so that fireworks can play
        // and player cant move around
        this._ui.gamePaused = true;
        // dont allow pause menu interaction
        this._ui.pauseButton.isHitTestVisible = false;

        let i = 10; // 10 seconds
        const t = window.setInterval(() => {
          i--;
          if (i == 0) {
            clearInterval(t);
            this._showWin();
          }
        }, 1000);
        this._environment.startFireworks = true;
        this.player.win = false;
      }

      if (!this._ui.gamePaused) {
        this._ui.updateHud();
      }
      // if the player has attempted all tutorial moves, move on to the hint IF they haven't already lit the next lantern
      if (
        this.player.tutorial_move &&
        this.player.tutorial_jump &&
        this.player.tutorial_dash &&
        (this._ui.tutorial.isVisible || this._ui.hint.isVisible)
      ) {
        this._ui.tutorial.isVisible = false;
        if (!this._environment.lanternObjs[1].isLit) {
          this._ui.hint.isVisible = true;
        } else {
          this._ui.hint.isVisible = false;
        }
      }
    });
    // glow layer
    const gl = new GlowLayer('glow', scene);
    gl.intensity = 0.6;
    this._environment.lanternObjs.forEach((lantern) => {
      gl.addIncludedOnlyMesh(lantern.mesh);
    });
  }
  private _showWin(): void {
    this.gameSound.stop();
    this.endSound.play();
    this.player.onRun.clear();

    const winUI = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    winUI.idealHeight = 720;

    const rect = new Rectangle();
    rect.thickness = 0;
    rect.background = 'black';
    rect.alpha = 0.4;
    rect.width = 0.4;
    winUI.addControl(rect);

    const stackPanel = new StackPanel('credits');
    stackPanel.width = 0.4;
    stackPanel.fontFamily = 'Viga';
    stackPanel.fontSize = '16px';
    stackPanel.color = 'white';
    winUI.addControl(stackPanel);

    const wincredits = new TextBlock('special');
    wincredits.resizeToFit = true;
    wincredits.color = 'white';
    wincredits.text = 'Special thanks to the Babylon Team!';
    wincredits.textWrapping = true;
    wincredits.height = '24px';
    wincredits.width = '100%';
    wincredits.fontFamily = 'Viga';
    stackPanel.addControl(wincredits);

    // Credits for music & SFX
    const music = new TextBlock('music', 'Music');
    music.fontSize = 22;
    music.resizeToFit = true;
    music.textWrapping = true;

    const source = new TextBlock(
      'sources',
      'Sources: freesound.org, opengameart.org, and itch.io'
    );
    source.textWrapping = true;
    source.resizeToFit = true;

    const jumpCred = new TextBlock(
      'jumpCred',
      'jump2 by LloydEvans09 - freesound.org'
    );
    jumpCred.textWrapping = true;
    jumpCred.resizeToFit = true;

    const walkCred = new TextBlock(
      'walkCred',
      'Concrete 2 by MayaSama @mayasama.itch.io / ig: @mayaragandra'
    );
    walkCred.textWrapping = true;
    walkCred.resizeToFit = true;

    const gameCred = new TextBlock(
      'gameSong',
      'Christmas synths by 3xBlast - opengameart.org'
    );
    gameCred.textWrapping = true;
    gameCred.resizeToFit = true;

    const pauseCred = new TextBlock(
      'pauseSong',
      'Music by Matthew Pablo / www.matthewpablo.com - opengameart.org'
    );
    pauseCred.textWrapping = true;
    pauseCred.resizeToFit = true;

    const endCred = new TextBlock(
      'startendSong',
      'copycat by syncopika - opengameart.org'
    );
    endCred.textWrapping = true;
    endCred.resizeToFit = true;

    const loseCred = new TextBlock(
      'loseSong',
      'Eye of the Storm by Joth - opengameart.org'
    );
    loseCred.textWrapping = true;
    loseCred.resizeToFit = true;

    const fireworksSfx = new TextBlock(
      'fireworks',
      'rubberduck - opengameart.org'
    );
    fireworksSfx.textWrapping = true;
    fireworksSfx.resizeToFit = true;

    const dashCred = new TextBlock(
      'dashCred',
      'Woosh Noise 1 by potentjello - freesound.org'
    );
    dashCred.textWrapping = true;
    dashCred.resizeToFit = true;

    // quit, sparkwarning, reset
    const sfxCred = new TextBlock(
      'sfxCred',
      '200 Free SFX - https://kronbits.itch.io/freesfx'
    );
    sfxCred.textWrapping = true;
    sfxCred.resizeToFit = true;

    // lighting lantern, sparkreset
    const sfxCred2 = new TextBlock(
      'sfxCred2',
      'sound pack by wobbleboxx.com - opengameart.org'
    );
    sfxCred2.textWrapping = true;
    sfxCred2.resizeToFit = true;

    const selectionSfxCred = new TextBlock(
      'select',
      '8bit menu select by Fupi - opengameart.org'
    );
    selectionSfxCred.textWrapping = true;
    selectionSfxCred.resizeToFit = true;

    stackPanel.addControl(music);
    stackPanel.addControl(source);
    stackPanel.addControl(jumpCred);
    stackPanel.addControl(walkCred);
    stackPanel.addControl(gameCred);
    stackPanel.addControl(pauseCred);
    stackPanel.addControl(endCred);
    stackPanel.addControl(loseCred);
    stackPanel.addControl(fireworksSfx);
    stackPanel.addControl(dashCred);
    stackPanel.addControl(sfxCred);
    stackPanel.addControl(sfxCred2);
    stackPanel.addControl(selectionSfxCred);
    const mainMenu = Button.CreateSimpleButton('mainmenu', 'RETURN');
    mainMenu.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    mainMenu.fontFamily = 'Viga';
    mainMenu.width = 0.2;
    mainMenu.height = '40px';
    mainMenu.color = 'white';
    winUI.addControl(mainMenu);

    mainMenu.onPointerDownObservable.add(() => {
      this._ui.transition = true;
      this._ui.quitSfx.play();
    });
  }
}

function main() {
  const canvas = document.querySelector('canvas#game') as HTMLCanvasElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  new App(canvas);
}

main();
