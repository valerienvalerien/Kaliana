import * as THREE from 'three';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initScrollReveal();
initParallax();
if (!prefersReducedMotion) initHeroScene();

function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');
    items.forEach(el => {
        const delay = parseInt(el.dataset.revealDelay || '0', 10);
        el.style.setProperty('--reveal-delay', `${delay}ms`);
    });

    if (prefersReducedMotion) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach(el => observer.observe(el));
}

function initParallax() {
    const targets = document.querySelectorAll('[data-parallax]');
    if (!targets.length || prefersReducedMotion) return;

    let pointerX = 0, pointerY = 0;
    let frame;

    window.addEventListener('pointermove', (e) => {
        pointerX = (e.clientX / window.innerWidth - 0.5) * 2;
        pointerY = (e.clientY / window.innerHeight - 0.5) * 2;
        if (!frame) frame = requestAnimationFrame(apply);
    }, { passive: true });

    function apply() {
        targets.forEach(el => {
            const intensity = parseFloat(el.dataset.parallax || '0.05');
            const tx = pointerX * 20 * intensity;
            const ty = pointerY * 20 * intensity;
            const rx = -pointerY * 4 * intensity;
            const ry = pointerX * 4 * intensity;
            el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
        frame = null;
    }
}

function initHeroScene() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const ambient = new THREE.AmbientLight(0xffe6f1, 0.55);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xff8fbe, 1.6);
    keyLight.position.set(4, 5, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffd5e6, 1.1);
    rimLight.position.set(-4, -2, 2);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xfff7fb, 0.9, 20);
    fillLight.position.set(0, 0, 5);
    scene.add(fillLight);

    const knotGeometry = new THREE.TorusKnotGeometry(1.05, 0.32, 220, 28, 2, 3);
    const knotMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff8fbe,
        metalness: 0.35,
        roughness: 0.22,
        clearcoat: 0.9,
        clearcoatRoughness: 0.18,
        sheen: 1,
        sheenColor: new THREE.Color(0xffd5e6),
        sheenRoughness: 0.6,
        transmission: 0.05,
        ior: 1.45,
        reflectivity: 0.55,
        envMapIntensity: 1.4
    });
    const knot = new THREE.Mesh(knotGeometry, knotMaterial);
    knot.rotation.x = 0.4;
    scene.add(knot);

    const haloGeometry = new THREE.RingGeometry(2.25, 2.55, 96);
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0xffd5e6,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.rotation.x = Math.PI / 2.4;
    scene.add(halo);

    const particles = createParticles();
    scene.add(particles);

    let pointer = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
        pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    const clock = new THREE.Clock();
    function tick() {
        const t = clock.getElapsedTime();
        knot.rotation.y = t * 0.28;
        knot.rotation.x = 0.4 + Math.sin(t * 0.5) * 0.12;
        knot.position.x = pointer.x * 0.35;
        knot.position.y = -pointer.y * 0.25;

        halo.rotation.z = t * 0.08;
        particles.rotation.y = t * 0.04;

        camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
        camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || canvas.clientWidth || window.innerWidth;
        const h = rect.height || canvas.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
}

function createParticles() {
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 2.5 + Math.random() * 1.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi) * 0.6;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
        color: 0xffd5e6,
        size: 0.04,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        sizeAttenuation: true
    });
    return new THREE.Points(geometry, material);
}
