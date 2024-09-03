import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createScene } from './scene-setup.js';
import { createNoise2D } from 'simplex-noise';
import { N8AOPass } from 'n8ao';
import { MeshLine, MeshLineMaterial } from 'three.meshline';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, composer, sphere, plane, pointLight, raycaster, mouse, randomizeTerrain;
let noise2D;
let windEffect; 

function init() {
    const { scene: newScene, camera: newCamera, sphere: newSphere, plane: newPlane, pointLight: newPointLight, randomizeTerrain: newRandomizeTerrain } = createScene();
    scene = newScene;
    camera = newCamera;
    sphere = newSphere;
    plane = newPlane;
    pointLight = newPointLight;
    randomizeTerrain = newRandomizeTerrain;

    camera.position.set(0, 8, 15); 
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x020308, 1);
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1;
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; 
    controls.minPolarAngle = Math.PI / 4; 
    controls.minDistance = 10; 
    controls.maxDistance = 80; 

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const n8aoPass = new N8AOPass(scene, camera);
    composer.addPass(n8aoPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2.5,
        0.8,
        0.9
    );
    composer.addPass(bloomPass);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    document.addEventListener('mousemove', onMouseMove, false);

    const randomizeButton = document.createElement('button');
    randomizeButton.textContent = 'Generate Grass';
    randomizeButton.style.position = 'absolute';
    randomizeButton.style.top = '10px';
    randomizeButton.style.left = '10px';
    randomizeButton.addEventListener('click', randomizeTerrain);
    document.body.appendChild(randomizeButton);

    noise2D = createNoise2D();
    windEffect = addWindEffect(scene);

    const loader = new GLTFLoader();
    loader.load(
        './tree/scene.gltf',
        function (gltf) {
            const model1 = gltf.scene.clone();
            model1.position.set(9, 0.1, 9);
            model1.scale.set(0.05, 0.06, 0.05);
            model1.name = 'tree1';
            scene.add(model1);

            const model2 = gltf.scene.clone();
            model2.position.set(-11, 0.1, -9);
            model2.scale.set(0.05, 0.06, 0.05);
            model2.name = 'tree2';
            scene.add(model2);
        },
        undefined,
        function (error) {
            console.error('Error loading model:', error);
        }
    );

    animate();
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        sphere.position.set(intersectPoint.x, intersectPoint.y + 3, intersectPoint.z);
    }
}

function updateTreeSway(time) {
    const tree1 = scene.getObjectByName('tree1');
    const tree2 = scene.getObjectByName('tree2');

    if (tree1) {
        tree1.rotation.z = noise2D(tree1.position.x * 0.1, time * 0.0005) * 0.01;
    }

    if (tree2) {
        tree2.rotation.z = noise2D(tree2.position.x * 0.1, time * 0.0005) * 0.01;
    }
}

function updateGrassOrientation(time) {
    const grassMesh = scene.getObjectByName('grassMesh');
    const dummy = new THREE.Object3D();

    if (grassMesh) {
        for (let i = 0; i < grassMesh.count; i++) {
            grassMesh.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            const noiseX = noise2D(dummy.position.x * 0.1, time * 0.0005) * 0.2;
            const noiseZ = noise2D(dummy.position.z * 0.1, time * 0.0005) * 0.2;

            dummy.lookAt(camera.position);
            dummy.rotateOnAxis(new THREE.Vector3(1, 0, 0), noiseX);
            dummy.rotateOnAxis(new THREE.Vector3(0, 0, 1), noiseZ);

            dummy.updateMatrix();
            grassMesh.setMatrixAt(i, dummy.matrix);
        }

        grassMesh.instanceMatrix.needsUpdate = true;
    }
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    updateGrassOrientation(time);
    updateTreeSway(time);
    windEffect.animateWind();
    composer.render();
}

function addWindEffect(scene) {
    const curvePoints = [
        new THREE.Vector3(-25, 3, -25),
        new THREE.Vector3(-15, 4, -5),
        new THREE.Vector3(0, 5, 0),
        new THREE.Vector3(15, 4, 5),
        new THREE.Vector3(25, 3, 25)
    ];
    const curve = new THREE.CatmullRomCurve3(curvePoints);

    const lineCount = 3;
    const lineLength = 20;
    const lines = [];

    for (let i = 0; i < lineCount; i++) {
        const lineMaterial = new MeshLineMaterial({
            color: new THREE.Color(0xffffff),
            lineWidth: 0.2,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        const line = new MeshLine();
        const points = curve.getPoints(lineLength);
        line.setPoints(points);
        const mesh = new THREE.Mesh(line, lineMaterial);
        scene.add(mesh);
        lines.push({ mesh, line });
    }

    function animateWind() {
        const time = Date.now() * 0.001;
        const looptime = 10;

        lines.forEach(({ mesh, line }, index) => {
            const t = ((time + index * 0.5) % looptime) / looptime;
            const startT = t;
            const endT = (t + lineLength / 200) % 1;

            const points = [];
            for (let i = 0; i <= lineLength; i++) {
                const segmentT = (startT + (endT - startT) * (i / lineLength)) % 1;
                const point = curve.getPoint(segmentT);
                point.y += Math.sin((segmentT + index * 0.1) * Math.PI * 2) * 0.5;
                points.push(point.x, point.y, point.z);
            }

            line.setPoints(points);
            mesh.geometry = line.geometry;

            const opacity = Math.sin(t * Math.PI) * 0.5 + 0.5;
            mesh.material.opacity = 0.5;
        });
    }

    return { animateWind };
}

init();

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);

    const n8aoPass = composer.passes.find(pass => pass instanceof N8AOPass);
    if (n8aoPass) {
        n8aoPass.setSize(window.innerWidth, window.innerHeight);
    }
}
