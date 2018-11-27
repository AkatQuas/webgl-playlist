window.onload = function () {
    var WRAPPER = document.querySelector('#wrapper');
    var CAMERA, SCENE, RENDERER;
    var CONTROLS;
    var OBJECTS = [];
    var TARGET_NAME = { SPHERE: 'sphere', HELIX: 'helix', CIRCLE: 'circle' };
    var TARGETS = { [TARGET_NAME.SPHERE]: [], [TARGET_NAME.HELIX]: [], [TARGET_NAME.CIRCLE]: [] };
    var ROTATE_SPEED = 0.015;
    var CURRENT_TARGET = '';
    var LUCKY = [];

    init();
    animate();

    LUCKY = initLucky();

    function init () {
        CAMERA = new THREE.PerspectiveCamera(40, WRAPPER.clientWidth / WRAPPER.clientHeight, -10000, 10000);
        CAMERA.position.set(0, 0, 3000);

        SCENE = new THREE.Scene();

        for (let i =0 ; i < 280; i++) {
            var el = el2Obj(TABLE[i], i);

            var obj = new THREE.CSS3DObject(el);
            obj.position.x = Math.random() * 4000 - 2000;
            obj.position.y = Math.random() * 4000 - 2000;
            obj.position.z = Math.random() * 4000 - 2000;

            SCENE.add(obj);

            OBJECTS.push(obj);
        }

        // sphere
        var vector = new THREE.Vector3();
        for (let i = 0, l = OBJECTS.length; i < l; i++) {
            var phi = Math.acos(-1 + (2 * i) / l);
            var theta = Math.sqrt(l * Math.PI) * phi;

            var obj = new THREE.Object3D();
            obj.position.setFromSphericalCoords(1000, phi, theta);

            vector.copy(obj.position).multiplyScalar(2);

            obj.lookAt(vector);

            TARGETS[TARGET_NAME.SPHERE].push(obj);
        }

        // helix
        for (let i = 0, l = OBJECTS.length; i < l; i++) {
            let theta = i * 0.175 + Math.PI;
            let y = -(i * 8) + 450;
            let obj = new THREE.Object3D();
            obj.position.setFromCylindricalCoords(850, theta, y);
            vector.x = obj.position.x * 2;
            vector.y = obj.position.y;
            vector.z = obj.position.z * 2;

            obj.lookAt(vector);

            TARGETS[TARGET_NAME.HELIX].push(obj);
        }
        const R = OBJECTS.length * 100 / Math.PI;
        const RA = 1.038;
        // circle
        OBJECTS.forEach((item, i) => {
            let theta = i / OBJECTS.length * 2 * Math.PI;
            let y = 0;
            let obj = new THREE.Object3D();
            obj.position.setFromCylindricalCoords(R, theta, y);

            vector.x = obj.position.x * 2;
            vector.y = obj.position.y * 2;
            vector.z = obj.position.z * 2;

            obj.lookAt(vector);

            TARGETS[TARGET_NAME.CIRCLE].push(obj);

        });

        RENDERER = new THREE.CSS3DRenderer();
        RENDERER.setSize(WRAPPER.clientWidth, WRAPPER.clientHeight);

        WRAPPER.appendChild(RENDERER.domElement);

        CONTROLS = new THREE.TrackballControls(CAMERA, RENDERER.domElement);

        CONTROLS.rotateSpeed = 0.5;
        CONTROLS.minDistance = 500;
        CONTROLS.maxDistance = 10000;
        CONTROLS.noZoom = true;
        CONTROLS.addEventListener('change', render);

        // init state
        // CAMERA.position.set(0, 0, R *RA);
        // transform(TARGET_NAME.CIRCLE, 2000);
        transform(TARGET_NAME.SPHERE, 2000);

        var button = document.querySelector('#rotate');
        button && button.addEventListener('click', function (event) {
            console.log('aouet');
            ROTATE_SPEED = Math.floor(0.1);

        });
        var button = document.querySelector('#rotateu');
        button && button.addEventListener('click', function (event) {
            const timer = setInterval(_ => {
                if (ROTATE_SPEED >= 0.115) {
                    ROTATE_SPEED = 0.115;
                    clearInterval(timer);
                }

                ROTATE_SPEED += 0.0025;
            }, 16);
        });
        var button = document.querySelector('#rotated');
        button && button.addEventListener('click', function (event) {
            const timer = setInterval(_ => {
                if (ROTATE_SPEED <= 0) {
                    clearInterval(timer);
                }
                ROTATE_SPEED = ((ROTATE_SPEED * 1e5 - 0.0098e5) / 1e5);
            }, 16);
        });
        var button = document.getElementById('sphere');
        button && button.addEventListener('click', function (event) {
            transform(TARGET_NAME.SPHERE, 2000);
        }, false);
        var button = document.getElementById('helix');
        button && button.addEventListener('click', function (event) {
            transform(TARGET_NAME.HELIX, 2000);
        }, false);

        var button = document.getElementById('look');
        button && button.addEventListener('click', function (event) {
            const rd = ~~(Math.random() * OBJECTS.length);
            const position = TARGETS.circle[rd].position;
            CAMERA.position.x = position.x * RA;
            CAMERA.position.y = position.y;
            CAMERA.position.z = position.z * RA;
        }, false);
        var button = document.getElementById('circle');
        button && button.addEventListener('click', function (event) {
            transform(TARGET_NAME.CIRCLE, 2000);
        }, false);
        var button = document.querySelector('#draw');
        button.addEventListener('click', function (event) {
            let timer, t = 0;
            if (timer) {
                return;
            }
            const id0 = document.querySelector('#card0');
            id0.innerHTML = '152<br>****<br>1244';

            if (CURRENT_TARGET !== TARGET_NAME.SPHERE) {
                transform(TARGET_NAME.SPHERE, 1500);
                CAMERA.position.set(0, 0, 3000);
                t = 2000;
            }

            setTimeout(_ => {
                timer = setInterval(_ => {
                    if (ROTATE_SPEED >= 0.145) {
                        ROTATE_SPEED = 0.145;
                        clearInterval(timer);
                        timer = setTimeout(_ => {
                            transform(TARGET_NAME.HELIX, 2000);
                            clearTimeout(timer);
                            timer = setTimeout(_ => {
                                clearTimeout(timer);
                                transform(TARGET_NAME.CIRCLE, 3000);
                                let ct = setTimeout(_ => {
                                    clearTimeout(ct);
                                    ct = null;
                                    CAMERA.position.set(0, 0, R * RA);
                                }, 1500);
                                let dt = setTimeout(_ => {
                                    clearTimeout(dt);
                                    timer = setInterval(_ => {
                                        if (ROTATE_SPEED <= 0.015) {
                                            ROTATE_SPEED = 0.015;
                                            clearInterval(timer);
                                            timer = null;
                                        }
                                        ROTATE_SPEED = ((ROTATE_SPEED * 1e5 - 0.0052e5) / 1e5);
                                    }, 16);
                                }, 4000);
                            }, 2800);
                        }, 2000);
                    }
                    ROTATE_SPEED += 0.00125;
                }, 16);
            }, t);
        });

        var button = document.querySelector('#stop');
        button.addEventListener('click', function () {
            const rd = LUCKY.shift();
            const info = TABLE[rd];
            postData('/api/draw', info).then(() => {
                const id0 = document.querySelector('#card0');
                id0.innerHTML = '恭喜<br>'+starTel(info.tel);
                const position = TARGETS.circle[0].position;
                CAMERA.position.x = position.x * RA;
                CAMERA.position.y = position.y;
                CAMERA.position.z = position.z * RA;
                ROTATE_SPEED = 0;
            });
        });

    }

    function transform (targets_name, duration) {
        const targets = TARGETS[targets_name];
        CURRENT_TARGET = targets_name;
        TWEEN.removeAll();
        targets.forEach((target, i) => {
            let obj = OBJECTS[i];
            new TWEEN.Tween(obj.position)
                .to(
                    {
                        x: target.position.x,
                        y: target.position.y,
                        z: target.position.z
                    }, Math.random() * duration + duration
                )
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();
            new TWEEN.Tween(obj.rotation)
                .to(
                    {
                        x: target.rotation.x,
                        y: target.rotation.y,
                        z: target.rotation.z
                    }, Math.random() * duration + duration
                )
                .easing(TWEEN.Easing.Exponential.InOut)
                .start();
        });

        new TWEEN.Tween(this)
            .to({}, duration * 2)
            .onUpdate(render)
            .start();

    }

    function animate () {
        requestAnimationFrame(animate);

        var vector = CONTROLS.target.clone();
        var up = CAMERA.up.clone();
        var quaternion = new THREE.Quaternion();
        if (ROTATE_SPEED <= 0) {
            ROTATE_SPEED = 0;
        }
        quaternion.setFromAxisAngle(up, ROTATE_SPEED);
        CAMERA.position.applyQuaternion(quaternion);
        CAMERA.lookAt(vector);

        TWEEN.update();

        CONTROLS.update();
    }

    function render () {
        RENDERER.render(SCENE, CAMERA);
    }

    function el2Obj (item, index) {
        var el = document.createElement('div');
        el.className = 'element';
        el.style.backgroundColor = 'rgba(127, 0, 127, ' + (Math.random() * 0.5 + 0.25) + ')';

        var tel = document.createElement('div');
        tel.className = 'details';
        tel.id = `card${index}`;
        tel.innerHTML = starTel(item.tel);
        el.appendChild(tel);
        return el;
    }

    function starTel (tel) {
       return  tel.replace(/(\d{3})(.{4})(\d{4})/, function (a, b, c, d) {
            return b + '<br>****<br>' + d;
        });
    }
    function initLucky () {
        const L = TABLE.length;
        let all = 30;
        const res = [];
        while (all > 0) {
            const rd = ~~(Math.random() * L);
            if (res.includes(rd)) {
                continue;
            }
            res.push(rd);
            all -= 1;
        }
        console.log(res);
        return res;
    }

    function postData (url, data) {
        return fetch(url, {
            body: JSON.stringify(data),
            cache: 'no-cache',
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST'
        }).then(res => res.json());

    }
};
