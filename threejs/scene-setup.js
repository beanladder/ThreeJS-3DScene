import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);

    // Moon light (increased intensity)
    const moonLight = new THREE.DirectionalLight(0x4d79ff, 6.0); // Increased from 0.5 to 1.0
    moonLight.position.set(5, 10, 5);
    scene.add(moonLight);

    // Ambient Light (slightly increased for better visibility)
    const ambientLight = new THREE.AmbientLight(0x111122, 0.3); // Increased from 0.2 to 0.3
    scene.add(ambientLight);

    // Fog (adjusted for better star visibility)
    scene.fog = new THREE.Fog(0x001133, 30, 500); // Increased far value from 60 to 100

    // Plane (more detailed and darker for night)
    const planeGeometry = new THREE.PlaneGeometry(100, 100, 5, 5); // Increased detail
    const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0c210c,
        roughness: 0.8,
        metalness: 0.2,
        wireframe: false
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Function to randomize terrain (more pronounced for interesting night shadows)
    function randomizeTerrain() {
        const positions = planeGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] = Math.random() * 2 - 1; // Increased range from 1.2 to 2
        }
        planeGeometry.attributes.position.needsUpdate = true;
        planeGeometry.computeVertexNormals();
    }

    // Initial randomization
    randomizeTerrain();

    // Glowing Sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff80,
        transparent: true,
        opacity: 1
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 3;
    scene.add(sphere);

    // Point Light (attached to the sphere, for glow)
    const pointLight = new THREE.PointLight(0xffff80, 160, 40000);
    sphere.add(pointLight);

    // Add stars with glow and circular effect
    const starCount = 15000;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.6, // Slightly increased size
        transparent: true,
        opacity: 0.9, // Increased opacity
        map: createStarTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false // Ensures stars are always visible
    });

    const starVertices = [];
    const starColors = [];
    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = Math.random() * 50 + 100; // Increased distance: stars between 100 and 150 units away

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);

        starVertices.push(x, y, z);

        // Add some color variation to stars
        const r = Math.random() * 0.3 + 0.7;
        const g = Math.random() * 0.3 + 0.7;
        const b = Math.random() * 0.3 + 0.7;
        starColors.push(r, g, b);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starMaterial.vertexColors = true;

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    return { scene, camera, sphere, plane, pointLight, randomizeTerrain, stars };
}

function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
}