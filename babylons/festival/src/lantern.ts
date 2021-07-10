import {
  AnimationGroup,
  Color3,
  Color4,
  Mesh,
  ParticleSystem,
  PBRMetallicRoughnessMaterial,
  PointLight,
  Scene,
  Texture,
  Vector3,
} from '@babylonjs/core';

export class Lantern {
  private _scene: Scene;

  public mesh: Mesh;
  public isLit: boolean = false;

  // lit material
  private _lightmtl: PBRMetallicRoughnessMaterial;
  // light for lantern
  // used when lit
  private _light: PointLight;

  // Lantern animations
  private _spinAnim: AnimationGroup;

  // Particle System
  private _stars: ParticleSystem;

  constructor(
    lightmtl: PBRMetallicRoughnessMaterial,
    mesh: Mesh,
    scene: Scene,
    position: Vector3,
    animationGroups: AnimationGroup
  ) {
    this._scene = scene;
    this._lightmtl = lightmtl;

    // load the lantern mesh
    this._loadLantern(mesh, position);

    // load particle system
    this._loadStars();

    // set animations
    this._spinAnim = animationGroups;

    // create light source for the lanterns
    const light = new PointLight(
      'lantern light',
      this.mesh.getAbsolutePosition(),
      this._scene
    );
    light.intensity = 0;
    light.radius = 2;
    light.diffuse = new Color3(0.45, 0.56, 0.8);
    this._light = light;
    // only allow light to affect meshes near it
    this._findNearestMeshes(light);
  }

  private _loadLantern(mesh: Mesh, position: Vector3): void {
    this.mesh = mesh;
    this.mesh.scaling = new Vector3(0.8, 0.8, 0.8);
    this.mesh.setAbsolutePosition(position);
    this.mesh.isPickable = false;
  }

  /**
   * setEmissiveTexture
   */
  public setEmissiveTexture(): void {
    this.isLit = true;

    // play animation and particle system
    this._spinAnim.play();
    this._stars.start();

    // using the light material
    this.mesh.material = this._lightmtl;
    this._light.intensity = 30;
  }

  // when the light is created, only include the meshes specified
  private _findNearestMeshes(light: PointLight): void {
    const { name } = this.mesh;
    const scene = this._scene;
    let meshName = '';
    console.log(`xedlog lantern.mesh.name ->`, name);
    if (name.includes('14') || name.includes('15')) {
      meshName = 'festivalPlatform1';
    } else if (name.includes('16') || name.includes('17')) {
      meshName = 'festivalPlatform2';
    } else if (name.includes('18') || name.includes('19')) {
      meshName = 'festivalPlatform3';
    } else if (name.includes('20') || name.includes('21')) {
      meshName = 'festivalPlatform4';
    }
    if (meshName) {
      light.includedOnlyMeshes.push(scene.getMeshByName(meshName)!);
    }

    scene
      .getTransformNodeByName(name + 'lights')
      ?.getChildMeshes()
      .forEach((m) => {
        light.includedOnlyMeshes.push(m);
      });
  }

  private _loadStars(): void {
    const particleSystem = new ParticleSystem('stars', 1000, this._scene);

    particleSystem.particleTexture = new Texture(
      'textures/solidStar.png',
      this._scene
    );
    particleSystem.emitter = new Vector3(
      this.mesh.position.x,
      this.mesh.position.y + 1.5,
      this.mesh.position.z
    );
    particleSystem.createPointEmitter(
      new Vector3(0.6, 1, 0),
      new Vector3(0, 1, 0)
    );
    particleSystem.color1 = new Color4(1, 1, 1);
    particleSystem.color2 = new Color4(1, 1, 1);
    particleSystem.colorDead = new Color4(1, 1, 1, 1);
    particleSystem.emitRate = 12;
    particleSystem.minEmitPower = 14;
    particleSystem.maxEmitPower = 14;
    particleSystem.addStartSizeGradient(0, 2);
    particleSystem.addStartSizeGradient(1, 0.8);
    particleSystem.minAngularSpeed = 0;
    particleSystem.maxAngularSpeed = 2;
    particleSystem.addDragGradient(0, 0.7, 0.7);
    particleSystem.targetStopDuration = 0.25;

    this._stars = particleSystem;
  }
}
