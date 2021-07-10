import {
  ActionManager,
  Animation,
  AnimationGroup,
  Color3,
  ExecuteCodeAction,
  Mesh,
  PBRMetallicRoughnessMaterial,
  Scene,
  SceneLoader,
  Texture,
  TransformNode,
} from '@babylonjs/core';
import { Player } from './characterController';
import { NUM_LANTERNS } from './constants';
import { Firework } from './firework';
import { Lantern } from './lantern';

/**
 * Environment will contain all information necessary
 * for the game scene's world.
 */
export class Environment {
  private _scene: Scene;

  // Meshes
  public lanternObjs: Lantern[] = []; // array of lanterns to be lit
  private _lightmtl: PBRMetallicRoughnessMaterial; // emissive texture for when lanterns are lit

  // fireworks
  public startFireworks: boolean = false;
  public fireworkObjs: Firework[] = [];

  constructor(scene: Scene) {
    this._scene = scene;

    // create emissive material for when lantern is lit
    const lightmtl = new PBRMetallicRoughnessMaterial(
      'lantern mesh light',
      this._scene
    );
    lightmtl.emissiveTexture = new Texture(
      '/textures/litLantern.png',
      this._scene,
      true,
      false
    );
    lightmtl.emissiveColor = new Color3(
      0.8784313725490196,
      0.7568627450980392,
      0.6235294117647059
    );
    this._lightmtl = lightmtl;
  }

  // What we do once the environment assets have been imported
  // handles setting the necessary flags for collision and trigger meshes,
  // sets up the lantern objects
  // creates the firework particle systems for end-game
  public async load() {
    const assets = await this._loadAsset();
    //Loop through all environment meshes that were imported
    assets.allMeshes.forEach((m) => {
      m.receiveShadows = true;
      m.checkCollisions = true;

      if (m.name === 'ground') {
        // no check for collisions,
        // no allow for raycasting to detect it(cant land on it)
        m.checkCollisions = false;
        m.isPickable = false;
      }

      // areas that will use box collisions
      if (
        m.name.includes('stairs') ||
        m.name.includes('lilyflwr') ||
        m.name === 'cityentranceground' ||
        m.name === 'fishingground.001'
      ) {
        m.checkCollisions = false;
        m.isPickable = false;
      }

      // collision meshes
      if (m.name.includes('collision')) {
        m.isVisible = false;
        m.isPickable = true;
      }

      // trigger meshes
      if (m.name.includes('Trigger')) {
        m.isVisible = false;
        m.isPickable = false;
        m.checkCollisions = false;
      }
      // console.log(`xedlog mesh.name ->`, m.name);
    });

    // LANTERNS
    assets.lantern.isVisible = false; // original mesh is not visible

    // transform node to hold all lanterns
    const lanternHolder = new TransformNode('lanternHolder', this._scene);
    for (let i = 0; i < NUM_LANTERNS; i++) {
      // Mesh clone
      const lanternInstance = assets.lantern.clone(`lantern${i}`);
      lanternInstance.isVisible = true;
      lanternInstance.setParent(lanternHolder);

      const animGroupClone = new AnimationGroup(`lanternAnimGroup ${i}`);

      animGroupClone.addTargetedAnimation(
        assets.animationGroups.targetedAnimations[0].animation,
        lanternInstance
      );
      const newLanter = new Lantern(
        this._lightmtl,
        lanternInstance,
        this._scene,
        assets.env
          .getChildTransformNodes(false)
          .find((m) => m.name === `lantern ${i}`)!
          .getAbsolutePivotPoint(),
        animGroupClone
      );
      this.lanternObjs.push(newLanter);
    }

    // dispose of original mesh and animation group that were cloned
    assets.lantern.dispose();
    assets.animationGroups.dispose();

    // FIREWORKS
    for (let i = 0; i < 20; i++) {
      this.fireworkObjs.push(new Firework(this._scene, i));
    }

    // before the scene renders, check to see if the fireworks have started
    // if they have, trigger the firework sequence
    this._scene.onBeforeRenderObservable.add(() => {
      this.fireworkObjs.forEach((f) => {
        if (this.startFireworks) {
          f.startFirework();
        }
      });
    });
  }

  /**
   * Load all necessary meshes for the environment
   */
  private async _loadAsset() {
    const [
      { env, allMeshes },
      { result: lanternRes, lantern, animationGroups: importedAnims },
    ] = await Promise.all([this._loadAsset_env(), this._loadAsset_lantern()]);

    //--ANIMATION--
    // extract animation from lantern (following demystifying animation groups video)
    const animation: Animation[] = [];
    animation.push(importedAnims[0].targetedAnimations[0].animation);
    importedAnims[0].dispose();

    // create a new animation group and target the mesh to its animation
    const animGroup = new AnimationGroup('lanternAnimGroup');
    animGroup.addTargetedAnimation(animation[0], lanternRes.meshes[1]);

    return {
      env,
      allMeshes,
      lantern: lantern as Mesh,
      animationGroups: animGroup,
    };
  }
  private async _loadAsset_env() {
    // loads game environment
    const result = await SceneLoader.ImportMeshAsync(
      null,
      './models/',
      'envSetting.glb',
      this._scene
    );
    const env = result.meshes[0];
    const allMeshes = env.getChildMeshes();
    return {
      result,
      env,
      allMeshes,
    };
  }
  private async _loadAsset_lantern() {
    // loads lantern mesh
    const result = await SceneLoader.ImportMeshAsync(
      '',
      './models/',
      'lantern.glb',
      this._scene
    );

    // extract the actual lantern mesh
    // from the root of the mesh that's imported,
    // dispose the root
    const lantern = result.meshes[0].getChildren()[0];
    lantern.parent = null;
    result.meshes[0].dispose();
    return {
      result,
      lantern,
      animationGroups: result.animationGroups,
    };
  }

  public checkLanterns(player: Player) {
    if (!this.lanternObjs[0].isLit) {
      this.lanternObjs[0].setEmissiveTexture();
    }

    this.lanternObjs.forEach((lantern) => {
      player.mesh.actionManager!.registerAction(
        new ExecuteCodeAction(
          {
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: lantern.mesh,
          },
          () => {
            // if the lantern is not lit, light it up & reset sparkler timer
            if (!lantern.isLit && player.sparkLit) {
              player.lanternsLit += 1;
              lantern.setEmissiveTexture();
              player.sparkReset = true;
              player.sparkLit = true;

              //SFX
              player.lightSfx.play();
            }
            // if the lantern is lit already, reset the sparkler timer
            else if (lantern.isLit) {
              player.sparkReset = true;
              player.sparkLit = true;

              //SFX
              player.sparkResetSfx.play();
            }
          }
        )
      );
    });
  }
}
