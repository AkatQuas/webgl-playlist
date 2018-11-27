window.onload = function () {
    var wrapper = document.querySelector('#cube');
    var scene = new THREE.Scene();
    var renderer = new THREE.WebGLRenderer();

    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    wrapper.appendChild(renderer.domElement);

    var geometry = new THREE.BoxGeometry(1, 2, 1.5);
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh(geometry, material);

    scene.add(cube);

    var lcamera = new THREE.PerspectiveCamera(45, wrapper.clientWidth / wrapper.clientHeight, 0.1, 500);

    lcamera.position.set(5, 6, 20);

    lcamera.lookAt(0, 0, 0);

    var lmaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

    var lgeometry = new THREE.Geometry();

    lgeometry.vertices.push(new THREE.Vector3(-10, 0, 0));
    lgeometry.vertices.push(new THREE.Vector3(0, 10, 0));
    lgeometry.vertices.push(new THREE.Vector3(10, 0, 0));

    var line = new THREE.Line(lgeometry, lmaterial);

    scene.add(line);


    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, lcamera);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
    }

    animate();
};
