import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);

    // Moon light
    const moonLight1 = new THREE.DirectionalLight(0x4d79ff, 2.0);
    moonLight1.position.set(5, 10, 5);
    scene.add(moonLight1);

    const moonLight2 = new THREE.DirectionalLight(0x4d79ff, 2.0);
    moonLight2.position.set(-5, 10, -5);
    scene.add(moonLight2);

    const moonLight3 = new THREE.DirectionalLight(0x4d79ff, 2.0);
    moonLight3.position.set(5, 10, -5);
    scene.add(moonLight3);

    const moonLight4 = new THREE.DirectionalLight(0x4d79ff, 2.0);
    moonLight4.position.set(5, 10, -5);
    scene.add(moonLight4);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
    scene.add(ambientLight);

    // Fog
    scene.fog = new THREE.Fog(0x001133, 30, 500);

    // Plane
    const planeGeometry = new THREE.PlaneGeometry(50, 50, 1, 1);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x047300,
        roughness: 0.9,
        metalness: 0.1,
        wireframe: false
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Function to randomize terrain
    function randomizeTerrain() {
        // Remove previous grass mesh if it exists
        const previousGrassMesh = scene.getObjectByName('grassMesh');
        if (previousGrassMesh) {
            scene.remove(previousGrassMesh);
            previousGrassMesh.geometry.dispose();
            previousGrassMesh.material.dispose();
        }
    
        // Randomize terrain
        const positions = planeGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] = Math.random() * 3 - 1;
        }
        planeGeometry.attributes.position.needsUpdate = true;
        planeGeometry.computeVertexNormals();
    
        // Recreate grass with the updated terrain
        createGrass(camera);
    }
    

    // Create Grass
    function createGrass(camera) {
        const grassCount = 40000; // Reduced count for performance during testing
        const grassHeight = 1.35;
        const grassWidthBase = 0.2;
        const grassWidthTop = 0.002;
    
        // Load the textures
        const loader = new THREE.TextureLoader();
        const grassDiffuseTexture = loader.load('./grass_diffuse.jpg');
        const grassAlphaMaskTexture = loader.load('./grass.jpg');
        const grassAOTexture = loader.load('./grass_ao.jpg'); // Load the AO map

        // Custom Shader for Ambient Occlusion
        const grassShaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                diffuseMap: { value: grassDiffuseTexture },
                alphaMap: { value: grassAlphaMaskTexture },
                aoMap: { value: grassAOTexture },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
    
                void main() {
                vUv = uv;
                vPosition = position;
                vec3 displacedPosition = position;
                displacedPosition.y += sin(position.x * 10.0) * 0.05;
                displacedPosition.z += cos(position.z * 10.0) * 0.05;
    
                gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
            }
            `,
            fragmentShader: `
                uniform sampler2D diffuseMap;
                uniform sampler2D alphaMap;
                uniform sampler2D aoMap;
                varying vec2 vUv;

                void main() {
                    vec4 diffuseColor = texture2D(diffuseMap, vUv);
                    float alpha = texture2D(alphaMap, vUv).r;
                    float ao = texture2D(aoMap, vUv).r;
                    vec4 finalColor = vec4(diffuseColor.rgb * ao, alpha);
                    if (finalColor.a < 0.1) discard; // Discard pixels with low alpha
                    gl_FragColor = finalColor;
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
        });

        // Using the original MeshStandardMaterial
        const grassMaterial = new THREE.MeshStandardMaterial({
            map: grassDiffuseTexture,
            //alphaMap: grassAlphaMaskTexture,
            aoMap: grassAOTexture,
            aoMapIntensity: 1.0,
            transparent: true,               // Enables transparency
            side: THREE.DoubleSide,
            roughness: 1.0,
            metalness: 0.1,
            emissive: new THREE.Color(0x0c210c),
            emissiveIntensity: 0.3
        });

        const grasMaterial = grassShaderMaterial;

        // Create plane geometry for grass blade
        const grassGeometry = new THREE.PlaneGeometry(grassWidthBase, grassHeight, 1, 1);
    
        // Modify the vertices to taper the grass towards the top
        const position = grassGeometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
            const y = position.getY(i);
            const ratio = y / grassHeight;
            const width = grassWidthBase * (1 - ratio) + grassWidthTop * ratio;
    
            const x = position.getX(i);
            position.setX(i, x * (width / grassWidthBase));
        }
    
        position.needsUpdate = true;
        grassGeometry.translate(0, grassHeight / 2, 0);
    
        const grassMesh = new THREE.InstancedMesh(grassGeometry, grassMaterial, grassCount);
        grassMesh.name = 'grassMesh';
    
        const dummy = new THREE.Object3D();
        const raycaster = new THREE.Raycaster();
    
        for (let i = 0; i < grassCount; i++) {
            const x = Math.random() * 100 - 50;
            const z = Math.random() * 100 - 50;
    
            raycaster.set(new THREE.Vector3(x, 100, z), new THREE.Vector3(0, -1, 0));
            const intersects = raycaster.intersectObject(plane);
    
            if (intersects.length > 0) {
                const y = intersects[0].point.y;
    
                dummy.position.set(x, y, z);
                dummy.rotation.y = Math.random() * Math.PI;
                dummy.scale.setScalar(0.8 + Math.random() * 0.4);
    
                dummy.updateMatrix();
                grassMesh.setMatrixAt(i, dummy.matrix);
            }
        }
    
        grassMesh.instanceMatrix.needsUpdate = true;
        scene.add(grassMesh);
    }
    
    // Initial randomization and add grass
    //randomizeTerrain();
    
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
    const pointLight = new THREE.PointLight(0xffff80, 20, 40000);
    sphere.add(pointLight);

    // Add stars with glow and circular effect
    const starCount = 15000;
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.6,
        transparent: true,
        opacity: 0.9,
        map: createStarTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const starVertices = [];
    const starColors = [];
    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = Math.random() * 50 + 100;

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
