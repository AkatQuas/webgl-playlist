import {
  Color4,
  Mesh,
  ParticleSystem,
  Scene,
  Sound,
  Texture,
  Vector3,
  VertexBuffer,
} from '@babylonjs/core';
import { noop } from './utils';

export class Firework {
  _scene: Scene;
  private _emitter: Mesh;
  private _rocket: ParticleSystem;

  // sounds
  private _rocketSfx: Sound;
  private _explosionSfx: Sound;
  private _started: boolean;
  private _delay: number;
  private _height: number;
  private _exploded: boolean = false;
  constructor(scene: Scene, i: number) {
    this._scene = scene;

    this._loadSounds(scene);
    const sphere = Mesh.CreateSphere('rocket', 4, 1, scene);
    sphere.isVisible = false;

    // the origin spawn point for all fireworks is determined by a TransformNode called "fireworks", this was placed in blender

    const fireworksPosition = scene
      .getTransformNodeByName('fireworks')!
      .getAbsolutePosition();
    const randPos = Math.random() * 10;

    sphere.position = new Vector3(
      (fireworksPosition.x + randPos) & -1,
      fireworksPosition.y,
      fireworksPosition.z
    );
    this._emitter = sphere;

    // Rocket particle system
    const rocket = new ParticleSystem('rocket', 350, scene);

    rocket.particleTexture = new Texture('./textures/flare.png', scene);
    rocket.emitter = sphere;
    rocket.emitRate = 20;
    rocket.minEmitBox = new Vector3(0, 0, 0);
    rocket.maxEmitBox = new Vector3(0, 0, 0);
    rocket.color1 = new Color4(0.49, 0.57, 0.76);
    rocket.color2 = new Color4(0.29, 0.29, 0.66);
    rocket.colorDead = new Color4(0, 0, 0.2, 0.5);
    rocket.minSize = 1;
    rocket.maxSize = 1;
    rocket.addSizeGradient(0, 1);
    rocket.addSizeGradient(1, 0.01);
    this._rocket = rocket;

    // set how high the rocket will travel before exploding and how long it'll take before shooting the rocket
    this._height = sphere.position.y + Math.random() * (15 + 4) + 4;
    this._delay = (Math.random() * i + 1) * 60; // frame based
  }

  private _explosions(position: Vector3): void {
    // mesh that gets split into vertices
    const explosion = Mesh.CreateSphere('explosion', 4, 1, this._scene);
    explosion.isVisible = false;
    explosion.position = position;

    const emitter = explosion;
    emitter.useVertexColors = true;
    const vertPos = emitter.getVerticesData(VertexBuffer.PositionKind)!;
    const vertNorms = emitter.getVerticesData(VertexBuffer.NormalKind)!;
    const vertColors: number[] = [];

    // for each vertex, create a particle system
    for (let i = 0, l = vertPos.length; i < l; i += 3) {
      const r = Math.random();
      const g = Math.random();
      const b = Math.random();
      const alpha = 1.0;
      vertColors.push(r);
      vertColors.push(g);
      vertColors.push(b);
      vertColors.push(alpha);

      const vertNormal = new Vector3(
        vertNorms[i],
        vertNorms[i + 1],
        vertNorms[i + 2]
      );
      const gizmo = Mesh.CreateBox('gizmo', 0.001, this._scene);
      gizmo.position = new Vector3(vertPos[i], vertPos[i + 1], vertPos[i + 2]);
      gizmo.parent = emitter;

      const direction = vertNormal.normalize().scale(1); // move in the direction of the normal
      const color = new Color4(r, g, b, alpha);
      // actual partical system for each exploding piece

      const particleSys = new ParticleSystem('particles', 500, this._scene);
      particleSys.particleTexture = new Texture(
        'textures/flare.png',
        this._scene
      );
      particleSys.emitter = gizmo;
      particleSys.minEmitBox = new Vector3(1, 0, 0);
      particleSys.maxEmitBox = new Vector3(1, 0, 0);
      particleSys.minSize = 0.1;
      particleSys.maxSize = 0.1;
      particleSys.color1 = color;
      particleSys.color2 = color;
      particleSys.colorDead = new Color4(0, 0, 0, 0.0);
      particleSys.minLifeTime = 1;
      particleSys.maxLifeTime = 2;
      particleSys.emitRate = 500;
      particleSys.gravity = new Vector3(0, -9.8, 0);
      particleSys.direction1 = direction;
      particleSys.direction2 = direction;
      particleSys.minEmitPower = 10;
      particleSys.maxEmitPower = 13;
      particleSys.updateSpeed = 0.01;
      particleSys.targetStopDuration = 0.2;
      particleSys.disposeOnStop = true;
      particleSys.start();
    }

    emitter.setVerticesData(VertexBuffer.ColorKind, vertColors);
  }
  public startFirework(): void {
    if (this._started) {
      // if it's started, rocket flies up to height & then explodes
      if (this._emitter.position.y >= this._height && !this._exploded) {
        //--sounds--
        this._explosionSfx.play();
        // transition to the explosion particle system
        this._exploded = true;  // don't allow for it to explode again
        this._explosions(this._emitter.position);
        this._emitter.dispose();
        this._rocket.stop();
      } else {
        // move the rocket up
        this._emitter.position.y += 0.2;
      }
    } else {
      // use its delay to know when to shoot the firework
      if (this._delay <= 0) {
        this._started = true;
        // --sounds--
        this._rocketSfx.play();
        // start particle system
        this._rocket.start();
      } else {
        this._delay -= 1;
      }
    }
  }

  private _loadSounds(scene: Scene): void {
    this._rocketSfx = new Sound(
      'selection',
      './sounds/fw_05.wav',
      scene,
      noop,
      { volume: 0.5 }
    );
    this._explosionSfx = new Sound(
      'selection',
      './sounds/fw_03.wav',
      scene,
      noop,
      { volume: 0.5 }
    );
  }
}
