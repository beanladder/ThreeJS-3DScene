import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Directional Light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Sphere with custom shader
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
            lightPosition: { value: new THREE.Vector3(5, 5, 5) },
            glowColor: { value: new THREE.Color(1.0, 0.8, 0.0) },
            intensity: { value: 1.0 },
            power: { value: 2.0 }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldPosition;

            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 lightPosition;
            uniform vec3 glowColor;
            uniform float intensity;
            uniform float power;

            varying vec3 vNormal;
            varying vec3 vWorldPosition;

            void main() {
                vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
                vec3 lightDirection = normalize(lightPosition - vWorldPosition);
                
                vec3 ambient = vec3(0.1, 0.1, 0.1);
                
                float diff = max(dot(vNormal, lightDirection), 0.0);
                vec3 diffuse = diff * vec3(1.0, 0.9, 0.7);
                
                vec3 halfwayDir = normalize(lightDirection + viewDirection);
                float spec = pow(max(dot(vNormal, halfwayDir), 0.0), 32.0);
                vec3 specular = spec * vec3(1.0, 1.0, 1.0);
                
                float fresnel = pow(1.0 - dot(viewDirection, vNormal), power);
                vec3 glow = glowColor * intensity * fresnel;
                
                vec3 baseColor = vec3(1.0, 0.8, 0.0);
                vec3 final = baseColor * (ambient + diffuse) + specular + glow;
                
                gl_FragColor = vec4(final, 1.0);
            }
        `
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 1;
    scene.add(sphere);

    return { scene, camera };
}