import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Create sphere (orb)
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Create plane (ground)
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -1;
scene.add(plane);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Add point light (from orb)
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}