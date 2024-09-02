import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { createScene } from './scene-setup.js';


let scene, camera, renderer, composer, sphere, plane, pointLight, raycaster, mouse, randomizeTerrain;

function init() {
    const { scene: newScene, camera: newCamera, sphere: newSphere, plane: newPlane, pointLight: newPointLight, randomizeTerrain: newRandomizeTerrain } = createScene();
    scene = newScene;
    camera = newCamera;
    sphere = newSphere;
    plane = newPlane;
    pointLight = newPointLight;
    randomizeTerrain = newRandomizeTerrain;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x020308, 1); // Set background to dark blue for night sky
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1;
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;

    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        2.5, // Bloom intensity
        0.8, // Bloom radius
        0.9  // Bloom threshold
    );
    composer.addPass(bloomPass);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    document.addEventListener('mousemove', onMouseMove, false);

    const randomizeButton = document.createElement('button');
    randomizeButton.textContent = 'Randomize Terrain';
    randomizeButton.style.position = 'absolute';
    randomizeButton.style.top = '10px';
    randomizeButton.style.left = '10px';
    randomizeButton.addEventListener('click', randomizeTerrain);
    document.body.appendChild(randomizeButton);

    animate();
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        sphere.position.x = intersectPoint.x;
        sphere.position.z = intersectPoint.z;
        sphere.position.y = intersectPoint.y + 4; // Keep the sphere slightly higher
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateGrassOrientation();
    composer.render();
}
function updateGrassOrientation() {
    const grassMesh = scene.getObjectByName('grassMesh');
    const dummy = new THREE.Object3D();

    if (grassMesh) {
        for (let i = 0; i < grassMesh.count; i++) {
            grassMesh.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            // Make each grass blade face the camera
            dummy.lookAt(camera.position);
            dummy.updateMatrix();

            grassMesh.setMatrixAt(i, dummy.matrix);
        }

        grassMesh.instanceMatrix.needsUpdate = true;
    }
}

init();

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}
