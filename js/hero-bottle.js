/**
 * hero-bottle.js  — Visor 3D + configurador de envase
 * Carga bote3D_v2.glb (Draco) y expone window.AkumalBottle
 * para cambiar color de tapa, cuerpo y textura de etiqueta.
 */
import * as THREE from 'three';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const canvas = document.getElementById('hero-bottle-canvas');
if (!canvas) throw new Error('[AkumalBottle] canvas no encontrado');

// ── Renderer ────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping      = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// ── Escena / Cámara ─────────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
camera.position.set(0, 0.1, 7.5);

// ── Iluminación ─────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.75));

const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(3.5, 5, 3);
scene.add(key);

const fill = new THREE.DirectionalLight(0xdceee8, 0.65);
fill.position.set(-4, 1, 2);
scene.add(fill);

const rim = new THREE.DirectionalLight(0xffffff, 0.50);
rim.position.set(0, 1, -5);
scene.add(rim);

const front = new THREE.PointLight(0xffffff, 0.45, 18);
front.position.set(0, 0.5, 5.5);
scene.add(front);

// ── Sombra elíptica bajo el bote ─────────────────────────────────────
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 0.6),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15, depthWrite: false })
);
shadow.rotation.x = -Math.PI / 2;
scene.add(shadow);

// ── Carga GLB ────────────────────────────────────────────────────────
let bottle   = null;
let meshCap  = null, meshBody = null, meshLabel = null;

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

loader.load(
  'assets/modelos3D/bote3D_v3.glb',
  (gltf) => {
    bottle = gltf.scene;

    // Clonar materiales para edición independiente
    bottle.traverse((child) => {
      if (!child.isMesh) return;
      child.material = child.material.clone();
      child.castShadow    = true;
      child.receiveShadow = true;
      if (child.name === 'jar_cap')   meshCap   = child;
      if (child.name === 'jar_body')  meshBody  = child;
      if (child.name === 'jar_label') meshLabel = child;
    });

    // Centrar y escalar para que quepa en el canvas
    const box    = new THREE.Box3().setFromObject(bottle);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    bottle.position.sub(center);
    bottle.scale.setScalar(2.6 / size.y);

    // Posición inicial: frente mirando a cámara (+Y blender → +Z three)
    bottle.rotation.y = Math.PI;

    scene.add(bottle);

    // Colocar sombra bajo la base del bote
    const bottom = box.min.y - center.y;
    shadow.position.y = (bottom * 2.6 / size.y) - 0.01;

    // Activar panel configurador
    const cfg = document.getElementById('bottleConfigurator');
    if (cfg) cfg.classList.add('is-ready');

    // Ocultar spinner de carga si existe
    const spinner = document.getElementById('bottleSpinner');
    if (spinner) spinner.style.display = 'none';
  },
  undefined,
  (err) => console.error('[AkumalBottle] Error cargando GLB:', err)
);

// ── API pública: window.AkumalBottle ────────────────────────────────
window.AkumalBottle = {
  /** Cambia el color de la tapa. hex: número 0xRRGGBB */
  setCapColor(hex) {
    if (meshCap)  meshCap.material.color.setHex(hex);
  },
  /** Cambia el color del cuerpo. hex: número 0xRRGGBB */
  setBodyColor(hex) {
    if (meshBody) meshBody.material.color.setHex(hex);
  },
  /** Aplica una imagen como etiqueta. url: ruta local o blob URL */
  setLabel(url) {
    if (!meshLabel) return;
    const tex = new THREE.TextureLoader().load(url);
    tex.flipY        = false;                    // GLB usa UV origen arriba-izquierda
    tex.colorSpace   = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    meshLabel.material.map         = tex;
    meshLabel.material.needsUpdate = true;
  },
  /** Elimina la textura de etiqueta (vuelve a blanco liso) */
  clearLabel() {
    if (!meshLabel) return;
    meshLabel.material.map         = null;
    meshLabel.material.needsUpdate = true;
  }
};

// ── Interacción: arrastrar para rotar ───────────────────────────────
let drag = false, prevX = 0, vel = 0;
const AUTO_SPEED = 0.004;

const px = (e) => e.touches ? e.touches[0].clientX : e.clientX;

canvas.addEventListener('mousedown',  (e) => { drag=true;  prevX=px(e); vel=0; });
canvas.addEventListener('touchstart', (e) => { drag=true;  prevX=px(e); vel=0; }, { passive: true });
canvas.addEventListener('mousemove',  (e) => { if (!drag || !bottle) return; vel=(px(e)-prevX)*0.013; bottle.rotation.y+=vel; prevX=px(e); });
canvas.addEventListener('touchmove',  (e) => { if (!drag || !bottle) return; vel=(px(e)-prevX)*0.013; bottle.rotation.y+=vel; prevX=px(e); }, { passive: true });
canvas.addEventListener('mouseup',    () => drag=false);
canvas.addEventListener('mouseleave', () => drag=false);
canvas.addEventListener('touchend',   () => drag=false);

// ── Resize responsive ────────────────────────────────────────────────
function syncSize() {
  const w = canvas.clientWidth || 400;
  const h = canvas.clientHeight || 500;
  if (renderer.domElement.width  !== w * devicePixelRatio ||
      renderer.domElement.height !== h * devicePixelRatio) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}
window.addEventListener('resize', syncSize);
syncSize();

// ── Loop de animación ────────────────────────────────────────────────
let t = 0;
function animate() {
  requestAnimationFrame(animate);
  t += 0.012;

  if (bottle) {
    if (!drag) {
      vel *= 0.90;
      bottle.rotation.y += AUTO_SPEED + vel;
    }
    // Flotación suave
    const f = Math.sin(t * 0.72);
    bottle.position.y = f * 0.10;

    // Sombra sincronizada
    shadow.position.y  += (bottle.position.y - 0.01) - shadow.position.y;
    shadow.scale.x      = 1 - Math.abs(f) * 0.18;
    shadow.material.opacity = 0.15 - Math.abs(f) * 0.05;
  }

  renderer.render(scene, camera);
}
animate();
