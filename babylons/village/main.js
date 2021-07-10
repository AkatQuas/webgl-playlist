window.onload = function () {
  // Get the canvas element
  const canvas = document.getElementById('renderCanvas');
  // Generate the BABYLON 3D engine
  const engine = new BABYLON.Engine(canvas, true);

  //Call the createScene function
  const scene = createScene(engine, canvas);

  // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(function () {
    scene.render();
  });

  // Watch for browser/canvas resize events
  window.addEventListener('resize', function () {
    engine.resize();
  });
};

/******Build Functions***********/

function createScene(engine, canvas) {
  const scene = new BABYLON.Scene(engine);

  cameraAndLights(canvas);
  buildDwelling();
  // importVillage();
  extrudeCar(scene);
  // importCar(scene);

  return scene;
}

/**
 * Set camera and light
 */
function cameraAndLights(canvas) {
  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 2.5,
    15,
    new BABYLON.Vector3(0, 0, 0)
  );
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(1, 1, 0)
  );
}

function importVillage() {
  BABYLON.SceneLoader.ImportMeshAsync('', './static/meshes/', 'village.glb');
}

function buildDwelling() {
  buildGround();
  const detached_house = buildHouse(1);
  detached_house.rotation.y = -Math.PI / 16;
  detached_house.position.x = -6.8;
  detached_house.position.z = 2.5;

  const semi_house = buildHouse(2);
  semi_house.rotation.y = -Math.PI / 16;
  semi_house.position.x = -4.5;
  semi_house.position.z = 3;

  //each entry is an array [house type, rotation, x, z]
  const places = [
    [1, -Math.PI / 16, -6.8, 2.5],
    [2, -Math.PI / 16, -4.5, 3],
    [2, -Math.PI / 16, -1.5, 4],
    [2, -Math.PI / 3, 1.5, 6],
    [2, (15 * Math.PI) / 16, -6.4, -1.5],
    [1, (15 * Math.PI) / 16, -4.1, -1],
    [2, (15 * Math.PI) / 16, -2.1, -0.5],
    [1, (5 * Math.PI) / 4, 0, -1],
    [1, Math.PI + Math.PI / 2.5, 0.5, -3],
    [2, Math.PI + Math.PI / 2.1, 0.75, -5],
    [1, Math.PI + Math.PI / 2.25, 0.75, -7],
    [2, Math.PI / 1.9, 4.75, -1],
    [1, Math.PI / 1.95, 4.5, -3],
    [2, Math.PI / 1.9, 4.75, -5],
    [1, Math.PI / 1.9, 4.75, -7],
    [2, -Math.PI / 3, 5.25, 2],
    [1, -Math.PI / 3, 6, 4],
  ];
  //Create instances from the first two that were built
  const houses = places.map((place, i) => {
    let house;
    if (place[0] === 1) {
      house = detached_house.createInstance('house' + i);
    } else {
      house = semi_house.createInstance('house' + i);
    }
    house.rotation.y = place[1];
    house.position.x = place[2];
    house.position.z = place[3];
    return house;
  });

  return houses;
}

function buildGround() {
  //color
  const groundMat = new BABYLON.StandardMaterial('groundMat');
  groundMat.diffuseColor = new BABYLON.Color3(0, 1, 0);

  const ground = BABYLON.MeshBuilder.CreateGround('ground', {
    width: 20,
    height: 20,
  });
  ground.material = groundMat;
  return ground;
}

const buildHouse = (width) => {
  const box = buildBox(width);
  const roof = buildRoof(width);

  return BABYLON.Mesh.MergeMeshes([box, roof], true, false, null, false, true);
};

/**
 *
 * @param {number} [width=1]
 * @returns
 */
function buildBox(width = 1) {
  //texture
  const boxMat = new BABYLON.StandardMaterial('boxMat');

  let texture = './static/textures/cubehouse.png';
  //options parameter to set different images on each side
  const faceUV = [
    new BABYLON.Vector4(0.5, 0.0, 0.75, 1.0), //rear face
    new BABYLON.Vector4(0.0, 0.0, 0.25, 1.0), //front face
    new BABYLON.Vector4(0.25, 0, 0.5, 1.0), //right side
    new BABYLON.Vector4(0.75, 0, 1.0, 1.0), //left side
    // top 4 and bottom 5 not seen so not set
  ];

  if (width === 2) {
    texture = './static/textures/semihouse.png';
    faceUV[0] = new BABYLON.Vector4(0.6, 0.0, 1.0, 1.0); //rear face
    faceUV[1] = new BABYLON.Vector4(0.0, 0.0, 0.4, 1.0); //front face
    faceUV[2] = new BABYLON.Vector4(0.4, 0, 0.6, 1.0); //right side
    faceUV[3] = new BABYLON.Vector4(0.4, 0, 0.6, 1.0); //left side
    // top 4 and bottom 5 not seen so not set
  }

  boxMat.diffuseTexture = new BABYLON.Texture(texture);

  /**** World Objects *****/
  const box = BABYLON.MeshBuilder.CreateBox('box', {
    width: width,
    faceUV: faceUV,
    wrap: true,
  });
  box.material = boxMat;
  box.position.y = 0.5;

  return box;
}

/**
 *
 * @param {number} [width=1]
 * @returns
 */
function buildRoof(width = 1) {
  //texture
  const roofMat = new BABYLON.StandardMaterial('roofMat');
  roofMat.diffuseTexture = new BABYLON.Texture('./static/textures/roof.jpg');

  const roof = BABYLON.MeshBuilder.CreateCylinder('roof', {
    diameter: 1.3,
    height: 1.2,
    tessellation: 3,
  });
  roof.material = roofMat;
  roof.scaling.x = 0.75;
  roof.scaling.y = width;
  roof.rotation.z = Math.PI / 2;
  roof.position.y = 1.22;

  return roof;
}

function extrudeCar(scene) {
  //base
  const outline = [
    new BABYLON.Vector3(-0.3, 0, -0.1),
    new BABYLON.Vector3(0.2, 0, -0.1),
  ];

  //curved front
  for (let i = 0; i < 20; i++) {
    outline.push(
      new BABYLON.Vector3(
        0.2 * Math.cos((i * Math.PI) / 40),
        0,
        0.2 * Math.sin((i * Math.PI) / 40) - 0.1
      )
    );
  }

  //top
  outline.push(new BABYLON.Vector3(0, 0, 0.1));
  outline.push(new BABYLON.Vector3(-0.3, 0, 0.1));

  //car face UVs
  const faceUV = [
    new BABYLON.Vector4(0, 0.5, 0.38, 1),
    new BABYLON.Vector4(0, 0, 1, 0.5),
    new BABYLON.Vector4(0.38, 1, 0, 0.5),
  ];
  const carMat = new BABYLON.StandardMaterial('carMat');
  carMat.diffuseTexture = new BABYLON.Texture('./static/textures/car.png');
  const animCar = new BABYLON.Animation(
    'carAnimation',
    'position.x',
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  animCar.setKeys([
    { frame: 0, value: 8 },
    { frame: 150, value: -7 },
    { frame: 200, value: -7 },
  ]);

  const car = BABYLON.MeshBuilder.ExtrudePolygon('car', {
    shape: outline,
    depth: 0.2,
    faceUV,
    wrap: true,
  });
  car.material = carMat;
  car.animations = [animCar];
  car.rotation = new BABYLON.Vector3(-Math.PI / 2, -Math.PI / 2, -Math.PI / 2);
  car.position.y = 0.16;
  car.position.x = -3;
  car.position.z = 0;

  //wheel face UVs
  const wheelUV = [
    new BABYLON.Vector4(0, 0, 1, 1),
    new BABYLON.Vector4(0, 0.5, 0, 0.5),
    new BABYLON.Vector4(0, 0, 1, 1),
  ];

  //car material
  const wheelMat = new BABYLON.StandardMaterial('wheelMat');
  wheelMat.diffuseTexture = new BABYLON.Texture('./static/textures/wheel.png');
  const animWheel = new BABYLON.Animation(
    'wheelAnimation',
    'rotation.y',
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  //set the keys
  animWheel.setKeys([
    //At the animation key 0, the value of rotation.y is 0
    { frame: 0, value: 0 },
    //At the animation key 30, (after 1 sec since animation fps = 30) the value of rotation.y is 2PI for a complete rotation
    { frame: 30, value: 2 * Math.PI },
  ]);

  const wheelRB = BABYLON.MeshBuilder.CreateCylinder('wheelRB', {
    diameter: 0.125,
    height: 0.05,
    faceUV: wheelUV,
  });
  wheelRB.material = wheelMat;

  //Link this animation to the right back wheel
  wheelRB.animations = [animWheel];
  wheelRB.parent = car;
  wheelRB.position.z = -0.1;
  wheelRB.position.x = -0.2;
  wheelRB.position.y = 0.035;

  wheelRF = wheelRB.clone('wheelRF');
  wheelRF.position.x = 0.1;

  wheelLB = wheelRB.clone('wheelLB');
  wheelLB.position.y = -0.2 - 0.035;

  wheelLF = wheelRF.clone('wheelLF');
  wheelLF.position.y = -0.2 - 0.035;

  //Begin animation - object to animate, first frame, last frame and loop if true

  scene.beginAnimation(car, 0, 210, true);
  scene.beginAnimation(wheelRB, 0, 30, true);
  scene.beginAnimation(wheelRF, 0, 30, true);
  scene.beginAnimation(wheelLB, 0, 30, true);
  scene.beginAnimation(wheelLF, 0, 30, true);
}

function importCar(scene) {
  BABYLON.SceneLoader.ImportMeshAsync('', './static/meshes/', 'car.glb').then(
    () => {
      const car = scene.getMeshByName('car');
      car.rotation = new BABYLON.Vector3(Math.PI / 2, 0, -Math.PI / 2);
      car.position.y = 0.16;
      car.position.x = -3;
      car.position.z = 0;
      const animCar = new BABYLON.Animation(
        'carAnimation',
        'position.z',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );

      animCar.setKeys([
        { frame: 0, value: 8 },
        { frame: 150, value: -7 },
        { frame: 200, value: -7 },
      ]);

      car.animations = [animCar];
      scene.beginAnimation(car, 0, 200, true);

      const animWheel = new BABYLON.Animation(
        'wheelAnimation',
        'rotation.y',
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      //set the keys
      animWheel.setKeys([
        //At the animation key 0, the value of rotation.y is 0
        { frame: 0, value: 0 },
        //At the animation key 30, (after 1 sec since animation fps = 30) the value of rotation.y is 2PI for a complete rotation
        { frame: 30, value: 2 * Math.PI },
      ]);
      const wheels = ['wheelRB', 'wheelRF', 'wheelLB', 'wheelLF'];
      wheels.forEach((wheel) => {
        const w = scene.getMeshByName(wheel);
        w.animations = [animWheel];
        scene.beginAnimation(w, 0, 30, true);
      });
    }
  );
}
