import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);

    // Directional Light (main light source)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Ambient Light (to soften shadows)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
    scene.add(ambientLight);

    // Plane (more detailed)
    const planeGeometry = new THREE.PlaneGeometry(40, 40, 5, 5);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a4d1a,
        roughness: 0.8,
        metalness: 0.2,
        wireframe: false
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Function to randomize terrain
    function randomizeTerrain() {
        const positions = planeGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] = Math.random() * 1.2 - 1; // Random height between -1 and 1
        }
        planeGeometry.attributes.position.needsUpdate = true;
        planeGeometry.computeVertexNormals();
    }

    // Initial randomization
    randomizeTerrain();

    // Glowing Sphere
    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffa0,  // Slightly yellow-tinted white
        transparent: true,
        opacity: 0.9
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 0.7;
    scene.add(sphere);

    // Point Light (attached to the sphere)
    const pointLight = new THREE.PointLight(0xffffa0, 10, 20);
    sphere.add(pointLight);

    return { scene, camera, sphere, plane, pointLight, randomizeTerrain };
}