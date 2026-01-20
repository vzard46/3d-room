import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';

// --- Configuration & Global State ---
const CONFIG = {
    cameraDefaultPos: new THREE.Vector3(18, 12, 18),
    cameraDefaultTarget: new THREE.Vector3(0, 0, 0),
    animDuration: 1.5,
    DEBUG: true
};

const dom = {
    canvas: document.getElementById('portfolio-canvas'),
    popup: document.getElementById('popup'),
    closeBtn: document.getElementById('popup-exit-button'),
    loading: document.getElementById('loading'),
    welcome: document.getElementById('welcome'),
    welcomeClose: document.getElementById('welcome-exit-button'),
    themeToggle: document.getElementById('theme-toggle'),
    portfolioBtn: document.getElementById('portfolio-btn'),
    musicToggle: document.getElementById('music-toggle'),
    bgMusic: document.getElementById('bg-music'),
    sections: {
        'about-me': document.getElementById('about-me'),
        'work-experience': document.getElementById('work-experience'),
        'skills': document.getElementById('skills'),
        'projects': document.getElementById('projects'),
        'game-project': document.getElementById('game-project'),
        'education': document.getElementById('education'),
        'contact': document.getElementById('contact'),
    }
};

let scene, camera, renderer, controls, raycaster, mouse;
let isInteracting = false;
let model = null;
let birds = [];

// Definition of Interactive Objects
const INTERACTABLES = [
    // --- 1. Secondary PC (Experience) ---
    { id: 'pc_2', targetSection: 'work-experience', offset: { x: 3, y: 3, z: 3 } },
    { id: 'second_pc', targetSection: 'work-experience', offset: { x: 3, y: 3, z: 3 } },

    // --- 2. TV (Game Project) ---
    { id: 'tv', targetSection: 'game-project', offset: { x: 0, y: 0, z: 4 } },
    { id: 'game', targetSection: 'game-project', offset: { x: 0, y: 0, z: 4 } },

    // --- 3. Bookshelf (Skills) ---
    { id: 'bookshelf', targetSection: 'skills', offset: { x: 0, y: 2, z: 6 } },
    { id: 'book', targetSection: 'skills', offset: { x: 0, y: 2, z: 6 } },

    // --- 4. Posters (Projects) ---
    { id: 'poster', targetSection: 'projects', offset: { x: 2, y: 0, z: 2 } },
    { id: 'frame', targetSection: 'projects', offset: { x: 2, y: 0, z: 2 } },

    // --- 5. Main PC (About Me) ---
    { id: 'pc_1', targetSection: 'about-me', offset: { x: 4, y: 3, z: 4 } },
    { id: 'monitor', targetSection: 'about-me', offset: { x: 4, y: 3, z: 4 } },
    { id: 'laptop', targetSection: 'about-me', offset: { x: 4, y: 3, z: 4 } },
    { id: 'computer', targetSection: 'about-me', offset: { x: 4, y: 3, z: 4 } },
    { id: 'desktop', targetSection: 'about-me', offset: { x: 4, y: 3, z: 4 } },
    { id: 'keyboard', targetSection: 'about-me', offset: { x: 4, y: 3, z: 4 } },
    { id: 'mac', targetSection: 'about-me', offset: { x: 4, y: 3, z: 4 } }
];

// --- Initialization ---
init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.copy(CONFIG.cameraDefaultPos);

    renderer = new THREE.WebGLRenderer({ canvas: dom.canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    controls = new OrbitControls(camera, dom.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.copy(CONFIG.cameraDefaultTarget);

    setupLights();
    setupForestEnvironment();
    loadModel();
    setupRaycasting();

    window.addEventListener('resize', onWindowResize);
    dom.closeBtn.addEventListener('click', closePopup);
    dom.welcomeClose.addEventListener('click', () => dom.welcome.classList.add('hidden'));

    // Portfolio Button (Navbar)
    dom.portfolioBtn.addEventListener('click', openFullPortfolio);

    setupThemeToggle();
    setupMusicToggle();
    animate();
}

function setupForestEnvironment() {
    // 1. Ground
    const groundGeo = new THREE.CylinderGeometry(60, 60, 2, 64);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x567d46, roughness: 0.8, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // 2. Water Scene
    const waterGeo = new THREE.CircleGeometry(40, 64);
    const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0077be, roughness: 0.0, metalness: 0.8, transparent: true, opacity: 0.8,
        emissive: 0x001133, emissiveIntensity: 0.2
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(-60, -1.2, 0);
    scene.add(water);

    const waveGeo = new THREE.RingGeometry(35, 36, 64);
    const waveMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.copy(water.position);
    wave.position.y += 0.05;
    scene.add(wave);

    // 3. Procedural Trees (Lightweight - No External GLB)
    // Using simple geometries for smooth performance
    const placements = [
        { x: -12, z: -12 },
        { x: -14, z: 6 },
        { x: 6, z: -14 }
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const leavesGeo = new THREE.ConeGeometry(2.5, 6, 8);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27 });

    placements.forEach(pos => {
        const tree = new THREE.Group();

        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        tree.add(trunk);

        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 5;
        leaves.castShadow = true;
        tree.add(leaves);

        tree.position.set(pos.x, 0, pos.z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        tree.scale.setScalar(1 + Math.random() * 0.5);

        scene.add(tree);
    });

    // 4. User Birds
    const birdLoader = new GLTFLoader();
    birdLoader.load('./birds.glb', (gltf) => {
        const birdModel = gltf.scene;
        birdModel.scale.set(0.2, 0.2, 0.2);
        for (let i = 0; i < 10; i++) {
            const bird = birdModel.clone();
            bird.userData = {
                speed: 0.02 + Math.random() * 0.03,
                center: new THREE.Vector3(0, 15 + Math.random() * 8, 0),
                radius: 25 + Math.random() * 15,
                angle: Math.random() * Math.PI * 2,
                yOffset: Math.random() * 2
            };
            scene.add(bird);
            birds.push(bird);
        }
    }, undefined, (err) => {
        console.warn("Could not load birds.glb", err);
        createProceduralBirds(8);
    });
}

function createProceduralTrees(count) {
    const minRadius = 18; const maxRadius = 45;
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3c31 });
    const leavesGeo = new THREE.ConeGeometry(3, 7, 7);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e });

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        if (x > -5 && z > -5) continue;
        if (x < -20) continue;

        const tree = new THREE.Group();
        tree.position.set(x, 0, z);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 1; trunk.castShadow = true;
        const leaves = new THREE.Mesh(leavesGeo, leavesMat);
        leaves.position.y = 4.5; leaves.castShadow = true;
        tree.add(trunk); tree.add(leaves);
        tree.scale.setScalar(0.8 + Math.random() * 0.6);
        scene.add(tree);
    }
}

function createProceduralBirds(count) {
    const birdGeo = new THREE.ConeGeometry(0.2, 1, 5);
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let i = 0; i < count; i++) {
        const bird = new THREE.Mesh(birdGeo, birdMat);
        bird.userData = {
            speed: 0.04 + Math.random() * 0.02,
            center: new THREE.Vector3(0, 15 + Math.random() * 5, 0),
            radius: 20 + Math.random() * 15,
            angle: Math.random() * Math.PI * 2,
            yOffset: Math.random() * 2
        };
        scene.add(bird);
        birds.push(bird);
    }
}

function updateBirds() {
    birds.forEach(bird => {
        const ud = bird.userData;
        ud.angle += ud.speed * 0.1;
        bird.position.x = Math.cos(ud.angle) * ud.radius;
        bird.position.z = Math.sin(ud.angle) * ud.radius;
        bird.position.y = ud.center.y + Math.sin(Date.now() * 0.001 + ud.yOffset);
        bird.rotation.y = -ud.angle;
    });
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load('./public/isometric_room_house_game-ready_low_poly..glb',
        (gltf) => {
            model = gltf.scene;
            scene.add(model);
            console.groupCollapsed("--- GLB Object Names ---");
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    console.log(child.name);
                }
            });
            console.groupEnd();
            dom.loading.classList.add('hidden');
            gsap.from(camera.position, { x: 50, y: 50, z: 50, duration: 2.0, ease: "power3.out" });
        },
        undefined, (error) => console.error("An error occurred loading the model:", error)
    );
}

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffeeb1, 1.2);
    sunLight.position.set(20, 50, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    scene.add(sunLight);
}

function setupRaycasting() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    dom.canvas.addEventListener('pointerdown', onPointerDown);
    dom.canvas.addEventListener('pointermove', onPointerMove);
}

function onPointerMove(event) {
    if (isInteracting) return;
    updateMouseCoordinates(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    let isHoveringInteractable = false;
    if (intersects.length > 0) {
        const hit = findInteractableParent(intersects[0].object);
        if (hit) isHoveringInteractable = true;
    }
    dom.canvas.style.cursor = isHoveringInteractable ? 'pointer' : 'default';
}

function onPointerDown(event) {
    if (!dom.popup.classList.contains('hidden')) return;
    updateMouseCoordinates(event);
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        console.log(`[Click] Raycast hit: ${object.name}`);
        const interactable = findInteractableParent(object);
        if (interactable) handleObjectClick(object, interactable);
    }
}

function updateMouseCoordinates(event) {
    const rect = dom.canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function findInteractableParent(mesh) {
    let current = mesh;
    while (current) {
        const name = current.name.toLowerCase();
        const config = INTERACTABLES.find(item => name.includes(item.id.toLowerCase()));
        if (config) return config;
        if (current.parent === scene) break;
        current = current.parent;
    }
    return null;
}

function handleObjectClick(mesh, config) {
    console.log(`[Interaction] Triggered: ${config.id} -> Opening ${config.targetSection}`);
    focusCameraOnObject(mesh, config.offset);
    openPopup(config.targetSection);
}

function focusCameraOnObject(targetObject, offset) {
    isInteracting = true;
    controls.enabled = false;
    const targetPos = new THREE.Vector3();
    targetObject.getWorldPosition(targetPos);
    const cameraEndPos = new THREE.Vector3().copy(targetPos);
    if (offset) cameraEndPos.add(new THREE.Vector3(offset.x, offset.y, offset.z));
    else cameraEndPos.add(new THREE.Vector3(5, 5, 5));
    const tl = gsap.timeline();
    tl.to(camera.position, { x: cameraEndPos.x, y: cameraEndPos.y, z: cameraEndPos.z, duration: CONFIG.animDuration, ease: "power3.inOut" });
    tl.to(controls.target, { x: targetPos.x, y: targetPos.y, z: targetPos.z, duration: CONFIG.animDuration, ease: "power3.inOut" }, "<");
}

function openPopup(sectionId) {
    setTimeout(() => {
        Object.values(dom.sections).forEach(el => { if (el) el.style.display = 'none'; });
        const target = dom.sections[sectionId];
        if (target) { target.style.display = 'block'; target.classList.add('active-section'); }
        dom.popup.classList.remove('hidden');
    }, CONFIG.animDuration * 500);
}

// Opens ALL sections at once (for navbar Portfolio button)
function openFullPortfolio() {
    // Show ALL sections
    Object.values(dom.sections).forEach(el => {
        if (el) {
            el.style.display = 'block';
            // Re-trigger animation
            el.classList.remove('fade-in-up');
            void el.offsetWidth; // Force reflow
            el.classList.add('fade-in-up');
        }
    });
    dom.popup.classList.remove('hidden');
}

function closePopup() {
    dom.popup.classList.add('hidden');
    const tl = gsap.timeline({
        onComplete: () => {
            isInteracting = false;
            controls.enabled = true;
            Object.values(dom.sections).forEach(el => { if (el) el.style.display = ''; });
        }
    });
    tl.to(camera.position, { x: CONFIG.cameraDefaultPos.x, y: CONFIG.cameraDefaultPos.y, z: CONFIG.cameraDefaultPos.z, duration: CONFIG.animDuration, ease: "power3.inOut" });
    tl.to(controls.target, { x: CONFIG.cameraDefaultTarget.x, y: CONFIG.cameraDefaultTarget.y, z: CONFIG.cameraDefaultTarget.z, duration: CONFIG.animDuration, ease: "power3.inOut" }, "<");
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupThemeToggle() {
    let isDark = false;
    dom.themeToggle.addEventListener('click', () => {
        isDark = !isDark;
        document.body.classList.toggle('dark-mode');
        dom.themeToggle.innerText = isDark ? "☀️" : "🌙";
        const bgCol = isDark ? new THREE.Color(0x051a14) : new THREE.Color(0x87CEEB);
        gsap.to(scene.background, { r: bgCol.r, g: bgCol.g, b: bgCol.b, duration: 1 });
        scene.fog.color.set(bgCol);
    });
}

function setupMusicToggle() {
    let isPlaying = false;
    dom.bgMusic.volume = 0.3; // Soft volume

    dom.musicToggle.addEventListener('click', () => {
        isPlaying = !isPlaying;

        if (isPlaying) {
            dom.bgMusic.play();
            dom.musicToggle.innerText = "🔊";
            dom.musicToggle.classList.add('active');
        } else {
            dom.bgMusic.pause();
            dom.musicToggle.innerText = "🎵";
            dom.musicToggle.classList.remove('active');
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    updateBirds();
    controls.update();
    renderer.render(scene, camera);
}
