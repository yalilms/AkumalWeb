/* ── Configurador de envase — Akumal Sport Nutrition ──────────────── */
import * as THREE from 'three';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';

/* Ruta a los modelos 3D — relativa al JS (no a la página que lo carga)
   para que funcione sin importar en qué carpeta esté el HTML.          */
const _MODELS = new URL('../assets/modelos3D/', import.meta.url).href;

const Configurador = {

    format: 'bote',
    labelUrl: null,
    bottleScene:  null,
    doypackScene: null,
    stickScene:   null,

    /* Etiqueta: imagen cargada + canvas procesado + textura Three.js */
    _labelImg:        null,
    _processedCanvas: null,
    _labelTex:        null,

    labelState: {
        scale:      1.0,
        offsetX:    0,      /* fracción del canvas procesado */
        offsetY:    0,
        rotation:   0,      /* grados */
        brightness: 100,
        contrast:   100,
        saturation: 100,
        opacity:    100
    },

    /* Dimensiones del canvas por formato (coinciden con proporción UV real) */
    _canvasDims: {
        bote:    { w: 2000, h: 600 },  /* 200 mm × 60 mm — proporción real etiqueta bote */
        doypack: { w: 512,  h: 768 },  /* portrait label           */
        stick:   { w: 256,  h: 1024 }, /* tall portrait            */
    },

    formats: {
        bote:    { label: 'Bote',    type: 'bote',    portrait: false },
        doypack: { label: 'Doypack', type: 'doypack', portrait: true  },
        stick:   { label: 'Stick',   type: 'stick',   portrait: true  }
    },

    /* ── Init ─────────────────────────────────────────────────────── */
    init() {
        this.bindTabs();
        this.bindUpload();
        this.bindToolbar();
        this.bindColorPickers();
        this.bindForm();
        this.initBottle();
        this.initDoypack();
        this.initStick();
        this._initFlatDrag();
        this.selectFormat('bote');
    },

    /* ── Tabs ─────────────────────────────────────────────────────── */
    bindTabs() {
        document.querySelectorAll('.cfg-tab').forEach(tab =>
            tab.addEventListener('click', () => this.selectFormat(tab.dataset.format)));
    },

    selectFormat(fmt) {
        this.format = fmt;
        document.querySelectorAll('.cfg-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.format === fmt));

        const ids = { bote: 'cfg-3d-box', doypack: 'cfg-doypack-box', stick: 'cfg-stick-box' };
        Object.entries(ids).forEach(([k, id]) => {
            const el = document.getElementById(id);
            if (el) el.style.display = (k === fmt) ? '' : 'none';
        });

        /* Mostrar/ocultar selector de colores (solo bote tiene separación cuerpo/tapón) */
        const colSec = document.getElementById('cfg-colors-section');
        if (colSec) colSec.style.display = (fmt === 'bote') ? 'block' : 'none';

        /* Mostrar/ocultar sección de medidas y vista plana */
        const dimsSec = document.getElementById('cfg-label-dims-section');
        if (dimsSec) dimsSec.style.display = (fmt === 'bote') ? '' : 'none';
        /* Al cambiar de formato volver siempre a vista 3D */
        this._toggleFlatView(true);

        /* Redimensionar el canvas recién visible y re-aplicar etiqueta */
        requestAnimationFrame(() => {
            const canvasIds = { bote: 'cfg-canvas-3d', doypack: 'cfg-canvas-doypack', stick: 'cfg-canvas-stick' };
            const sceneMap  = { bote: this.bottleScene, doypack: this.doypackScene, stick: this.stickScene };
            const sc     = sceneMap[fmt];
            const canvas = document.getElementById(canvasIds[fmt]);
            if (sc?.renderer && sc?.camera && canvas) {
                const nw = canvas.offsetWidth || 400, nh = canvas.offsetHeight || 400;
                sc.camera.aspect = nw / nh;
                sc.camera.updateProjectionMatrix();
                sc.renderer.setSize(nw, nh);
            }
            if (this._labelImg?.complete) this._applyCurrentLabel();
        });
    },

    /* ── Toolbar ──────────────────────────────────────────────────── */
    bindToolbar() {
        const slider = document.getElementById('cfg-scale-slider');
        const valEl  = document.getElementById('cfg-scale-val');

        slider.addEventListener('input', () => {
            this.labelState.scale = slider.value / 100;
            valEl.textContent = slider.value + '%';
            this._applyCurrentLabel();
        });
        document.getElementById('cfg-scale-minus').addEventListener('click', () => {
            slider.value = Math.max(20, +slider.value - 5);
            slider.dispatchEvent(new Event('input'));
        });
        document.getElementById('cfg-scale-plus').addEventListener('click', () => {
            slider.value = Math.min(200, +slider.value + 5);
            slider.dispatchEvent(new Event('input'));
        });

        document.getElementById('cfg-btn-center').addEventListener('click', () => {
            this.labelState.offsetX = 0;
            this.labelState.offsetY = 0;
            this._applyCurrentLabel();
        });

        document.getElementById('cfg-btn-reset').addEventListener('click', () => {
            this.labelState = { scale:1.0, offsetX:0, offsetY:0, rotation:0, brightness:100, contrast:100, saturation:100, opacity:100 };
            slider.value = 100; valEl.textContent = '100%';
            const rotEl = document.getElementById('adj-rotation');
            if (rotEl) { rotEl.value = 0; document.getElementById('adj-rotation-val').textContent = '0°'; }
            ['brightness','contrast','saturation','opacity'].forEach(k => {
                document.getElementById('adj-'+k).value = 100;
                document.getElementById('adj-'+k+'-val').textContent = '100';
            });
            this._applyCurrentLabel();
        });

        document.getElementById('cfg-btn-adjusts').addEventListener('click', () => {
            const p = document.getElementById('cfg-adjusts-panel');
            p.classList.toggle('open');
            document.getElementById('cfg-btn-adjusts').classList.toggle('active', p.classList.contains('open'));
        });

        document.getElementById('cfg-btn-replace').addEventListener('click', () =>
            document.getElementById('cfg-file-input').click());

        document.getElementById('cfg-btn-flat').addEventListener('click', () => {
            this._toggleFlatView();
        });

        const rotEl = document.getElementById('adj-rotation');
        if (rotEl) {
            rotEl.addEventListener('input', e => {
                this.labelState.rotation = +e.target.value;
                document.getElementById('adj-rotation-val').textContent = e.target.value + '°';
                this._applyCurrentLabel();
            });
        }

        ['brightness','contrast','saturation','opacity'].forEach(key => {
            document.getElementById('adj-'+key).addEventListener('input', e => {
                this.labelState[key] = +e.target.value;
                document.getElementById('adj-'+key+'-val').textContent = e.target.value;
                this._applyCurrentLabel();
            });
        });
    },

    /* ── Aplicar etiqueta al 3D via canvas offscreen + CanvasTexture ─ */
    _applyCurrentLabel() {
        if (!this._labelImg || !this._labelImg.complete) return;
        const st  = this.labelState;
        const img = this._labelImg;

        /* Dimensiones del canvas según formato (coinciden con proporción UV) */
        const dims = this._canvasDims[this.format] || this._canvasDims.bote;
        const W = dims.w, H = dims.h;

        if (!this._processedCanvas) {
            this._processedCanvas = document.createElement('canvas');
        }
        const oc = this._processedCanvas;

        /* Si las dimensiones cambiaron (cambio de formato), nueva textura */
        if (oc.width !== W || oc.height !== H) this._labelTex = null;
        oc.width = W; oc.height = H;

        const ctx = oc.getContext('2d');
        /* Fondo blanco — Three.js interpreta píxeles transparentes como negro */
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        const canvasAr = W / H;
        const imgAr    = img.naturalWidth / img.naturalHeight;
        let baseDw, baseDh;
        /* Contain: la imagen completa encaja dentro del área de etiqueta */
        if (imgAr > canvasAr) {
            baseDw = W; baseDh = W / imgAr;
        } else {
            baseDh = H; baseDw = H * imgAr;
        }
        const dw = baseDw * st.scale;
        const dh = baseDh * st.scale;

        const cx = W / 2 + st.offsetX * W;
        const cy = H / 2 + st.offsetY * H;

        ctx.save();
        ctx.filter      = `brightness(${st.brightness}%) contrast(${st.contrast}%) saturate(${st.saturation}%)`;
        ctx.globalAlpha = st.opacity / 100;
        if (st.rotation) {
            ctx.translate(cx, cy);
            ctx.rotate(st.rotation * Math.PI / 180);
            ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        } else {
            ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
        }
        ctx.restore();

        if (!this._labelTex) {
            this._labelTex = new THREE.CanvasTexture(oc);
            this._labelTex.flipY      = false;
            this._labelTex.colorSpace = THREE.SRGBColorSpace;
        } else {
            this._labelTex.needsUpdate = true;
        }

        /* Aplicar a la escena del formato activo */
        const scene = this._activeScene();
        if (!scene) return;
        const mats = scene.bodyMat  ? [scene.bodyMat]
                   : scene.labelMat ? [scene.labelMat]
                   : (scene.mats || []);
        mats.forEach(m => { m.map = this._labelTex; m.needsUpdate = true; });

        document.getElementById('cfg-toolbar').classList.add('visible');

        /* Vista plana — actualizar el canvas 2D (visible si el usuario lo activó) */
        if (this.format === 'bote') {
            const flatEl = document.getElementById('cfg-label-flat');
            if (flatEl) {
                flatEl.width  = oc.width;
                flatEl.height = oc.height;
                flatEl.getContext('2d').drawImage(oc, 0, 0);
            }
        }
    },

    /* ── Gestión editor de etiqueta (overlay sobre el bote) ─────────── */

    _setFlatView(show) {
        const btn    = document.getElementById('cfg-btn-flat');
        const flatEl = document.getElementById('cfg-flat-preview');
        const label  = document.getElementById('cfg-btn-flat-label');
        const badge  = document.getElementById('cfg-3d-badge');
        if (!flatEl) return;
        btn && btn.classList.toggle('active', show);
        flatEl.style.display = show ? '' : 'none';
        /* Badge "arrastra para girar" visible solo cuando no hay editor encima */
        if (badge) badge.style.display = show ? 'none' : '';
        if (label) label.textContent = show ? 'Ocultar editor' : 'Editar etiqueta';
    },

    _toggleFlatView(forceOff) {
        if (forceOff) { this._setFlatView(false); return; }
        const isFlat = document.getElementById('cfg-flat-preview')?.style.display !== 'none';
        this._setFlatView(!isFlat);
    },

    _initFlatDrag() {
        const box    = document.getElementById('cfg-flat-preview');
        const canvas = document.getElementById('cfg-label-flat');
        if (!box || !canvas) return;

        let mode = null; // 'move' | 'scale'
        let sx = 0, sy = 0, sox = 0, soy = 0, soScale = 0;
        const pos = e => e.touches
            ? [e.touches[0].clientX, e.touches[0].clientY]
            : [e.clientX, e.clientY];

        /* Arrastrar canvas → mover imagen */
        canvas.addEventListener('mousedown', e => {
            if (!this._labelImg) return;
            mode = 'move'; [sx, sy] = pos(e);
            sox = this.labelState.offsetX; soy = this.labelState.offsetY;
            e.preventDefault();
        });
        canvas.addEventListener('touchstart', e => {
            if (!this._labelImg) return;
            mode = 'move'; [sx, sy] = pos(e);
            sox = this.labelState.offsetX; soy = this.labelState.offsetY;
        }, { passive: true });

        /* Arrastrar esquinas → escalar imagen */
        box.querySelectorAll('.cfg-lbh').forEach(h => {
            h.addEventListener('mousedown', e => {
                if (!this._labelImg) return;
                mode = 'scale'; [sx, sy] = pos(e); soScale = this.labelState.scale;
                e.preventDefault(); e.stopPropagation();
            });
            h.addEventListener('touchstart', e => {
                if (!this._labelImg) return;
                mode = 'scale'; [sx, sy] = pos(e); soScale = this.labelState.scale;
                e.stopPropagation();
            }, { passive: true });
        });

        const onMove = e => {
            if (!mode) return;
            const [x, y] = pos(e);
            const r = canvas.getBoundingClientRect();
            if (mode === 'move') {
                this.labelState.offsetX = sox + (x - sx) / r.width;
                this.labelState.offsetY = soy + (y - sy) / r.height;
            } else {
                const dx = (x - sx) / r.width;
                this.labelState.scale = Math.max(0.2, Math.min(3, soScale + dx * 2));
                const slider = document.getElementById('cfg-scale-slider');
                const valEl  = document.getElementById('cfg-scale-val');
                if (slider) slider.value = Math.round(this.labelState.scale * 100);
                if (valEl)  valEl.textContent = Math.round(this.labelState.scale * 100) + '%';
            }
            this._applyCurrentLabel();
        };
        window.addEventListener('mousemove',  onMove);
        window.addEventListener('touchmove',  onMove, { passive: true });
        window.addEventListener('mouseup',    () => { mode = null; });
        window.addEventListener('touchend',   () => { mode = null; });
    },

    _activeScene() {
        return this.format === 'bote'    ? this.bottleScene
             : this.format === 'doypack' ? this.doypackScene
             :                             this.stickScene;
    },

    _resetLabelTex() {
        const clearMat = m => { m.map = null; m.needsUpdate = true; };
        [this.bottleScene, this.doypackScene, this.stickScene].forEach(sc => {
            if (!sc) return;
            if (sc.bodyMat)  clearMat(sc.bodyMat);
            if (sc.labelMat) clearMat(sc.labelMat);
            if (sc.mats)     sc.mats.forEach(clearMat);
        });
        this._labelTex = null;
        document.getElementById('cfg-toolbar').classList.remove('visible');
        /* Volver a vista 3D al quitar etiqueta */
        this._toggleFlatView(true);
    },

    /* ── Helper: renderer Three.js ───────────────────────────────── */
    _makeRenderer(canvas) {
        if (!canvas) return null;
        const w = canvas.offsetWidth  || 400;
        const h = canvas.offsetHeight || 400;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        return renderer;
    },

    _addLights(scene) {
        scene.add(new THREE.AmbientLight(0xffffff, 0.70));
        const k = new THREE.DirectionalLight(0xffffff, 1.40); k.position.set(3.5,  5, 3); scene.add(k);
        const f = new THREE.DirectionalLight(0xdceee8, 0.55); f.position.set(-4,   1, 2); scene.add(f);
        const r = new THREE.DirectionalLight(0xffffff, 0.40); r.position.set(0,    0,-5); scene.add(r);
        const p = new THREE.PointLight(0xffffff, 0.35, 12);   p.position.set(0, 0.5, 5); scene.add(p);
    },

    _addDragRotation(canvas, group) {
        const state = { drag: false, vel: 0 };
        let prevX = 0;
        const cx = e => e.touches ? e.touches[0].clientX : e.clientX;
        canvas.addEventListener('mousedown',  e => { state.drag = true;  prevX = cx(e); state.vel = 0; });
        canvas.addEventListener('touchstart', e => { state.drag = true;  prevX = cx(e); state.vel = 0; }, { passive: true });
        canvas.addEventListener('mousemove',  e => { if (!state.drag) return; state.vel = (cx(e) - prevX) * 0.013; group.rotation.y += state.vel; prevX = cx(e); });
        canvas.addEventListener('touchmove',  e => { if (!state.drag) return; state.vel = (cx(e) - prevX) * 0.013; group.rotation.y += state.vel; prevX = cx(e); }, { passive: true });
        canvas.addEventListener('mouseup',    () => { state.drag = false; });
        canvas.addEventListener('mouseleave', () => { state.drag = false; });
        canvas.addEventListener('touchend',   () => { state.drag = false; });
        return state;
    },

    /* ── Carga de GLB genérica ────────────────────────────────────── */
    _loadGLB(canvasId, glbPath, camZ, onReady) {
        const canvas   = document.getElementById(canvasId);
        const renderer = this._makeRenderer(canvas);
        if (!renderer) return;

        const w = canvas.offsetWidth || 400, h = canvas.offsetHeight || 400;
        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(28, w / h, 0.1, 100);
        camera.position.set(0, 0, camZ);
        this._addLights(scene);

        const wrapper = new THREE.Group();
        scene.add(wrapper);
        let shadowMesh = null;

        new GLTFLoader().load(glbPath, gltf => {
            const model = gltf.scene;

            /* Escalar y centrar */
            const box  = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const sc   = 2.2 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(sc);
            box.setFromObject(model);
            model.position.sub(box.getCenter(new THREE.Vector3()));

            /* Recoger materiales únicos */
            const matsMap = new Map();
            model.traverse(child => {
                if (!child.isMesh) return;
                const list = Array.isArray(child.material) ? child.material : [child.material];
                list.forEach(m => { if (!matsMap.has(m.uuid)) matsMap.set(m.uuid, m); });
            });
            const mats = [...matsMap.values()];

            /* Sombra */
            box.setFromObject(model);
            shadowMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(size.x * sc * 1.8, 0.4),
                new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.13, depthWrite: false })
            );
            shadowMesh.rotation.x = -Math.PI / 2;
            shadowMesh.position.y = box.min.y - 0.03;
            scene.add(shadowMesh);

            wrapper.add(model);
            onReady({ mats, renderer, camera });

        }, undefined, err => console.error('Error GLB:', glbPath, err));

        const ds = this._addDragRotation(canvas, wrapper);
        const animate = () => {
            requestAnimationFrame(animate);
            if (!ds.drag) { ds.vel *= 0.85; wrapper.rotation.y += ds.vel; }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            const nw = canvas.offsetWidth, nh = canvas.offsetHeight;
            if (!nw || !nh) return;
            camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
        });
    },

    /* ── Three.js: bote — materiales separados cuerpo / tapón / etiqueta ─ */
    initBottle() {
        const canvas   = document.getElementById('cfg-canvas-3d');
        const renderer = this._makeRenderer(canvas);
        if (!renderer) return;

        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping      = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        const w = canvas.offsetWidth || 400, h = canvas.offsetHeight || 400;
        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(26, w / h, 0.1, 100);
        camera.position.set(0, 0.1, 7.5);
        this._addLights(scene);

        const wrapper   = new THREE.Group();
        scene.add(wrapper);
        let shadowMesh = null;

        const loader = new GLTFLoader();

        loader.load(_MODELS + 'bote3D_v4.glb?v=1', gltf => {
            const model = gltf.scene;

            /* Escalar y centrar */
            const box  = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const sc   = 2.2 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(sc);
            box.setFromObject(model);
            model.position.sub(box.getCenter(new THREE.Vector3()));
            model.rotation.y = Math.PI; /* frente mirando a cámara */

            /* Encontrar mallas por nombre */
            let meshBody = null, meshLabel = null, meshCap = null;
            model.traverse(child => {
                if (!child.isMesh) return;
                if (child.name === 'jar_body')  meshBody  = child;
                if (child.name === 'jar_label') meshLabel = child;
                if (child.name === 'jar_cap')   meshCap   = child;
            });

            /* Materiales clonados e independientes */
            const bodyPickerEl = document.getElementById('cfg-body-color');
            const capPickerEl  = document.getElementById('cfg-cap-color');
            const bodyColor = bodyPickerEl ? bodyPickerEl.value : '#ffffff';
            const capColor  = capPickerEl  ? capPickerEl.value  : '#3b4e3c';

            const bodyMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(bodyColor), roughness: 0.12, metalness: 0.0
            });
            const labelMat = new THREE.MeshStandardMaterial({
                color: 0xffffff, roughness: 0.28, metalness: 0.0
            });
            const capMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(capColor), roughness: 0.35, metalness: 0.08
            });

            if (meshBody)  meshBody.material  = bodyMat;
            if (meshLabel) meshLabel.material = labelMat;
            if (meshCap)   meshCap.material   = capMat;

            /* Sombra */
            box.setFromObject(model);
            shadowMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(size.x * sc * 1.8, 0.4),
                new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.13, depthWrite: false })
            );
            shadowMesh.rotation.x = -Math.PI / 2;
            shadowMesh.position.y = box.min.y - 0.03;
            scene.add(shadowMesh);

            wrapper.add(model);
            /* bodyMat en bottleScene → _applyCurrentLabel aplica textura al label */
            this.bottleScene = { bodyMat: labelMat, bodyMeshMat: bodyMat, capMat, renderer, camera };
            if (this.labelUrl && this._labelImg?.complete) this._applyCurrentLabel();

        }, undefined, err => console.error('Error GLB bote:', err));

        const ds = this._addDragRotation(canvas, wrapper);
        const animate = () => {
            requestAnimationFrame(animate);
            if (!ds.drag) { ds.vel *= 0.85; wrapper.rotation.y += ds.vel; }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            const nw = canvas.offsetWidth, nh = canvas.offsetHeight;
            if (!nw || !nh) return;
            camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
        });
    },

    /* ── Three.js: doypack (GLB) ──────────────────────────────────── */
    initDoypack() {
        this._loadGLB('cfg-canvas-doypack', _MODELS + 'doypack3d.glb', 5.5, sc => {
            this.doypackScene = sc;
            if (this.labelUrl && this._labelImg?.complete) this._applyCurrentLabel();
        });
    },

    /* ── Three.js: stick (procedural) ────────────────────────────── */
    initStick() {
        const canvas   = document.getElementById('cfg-canvas-stick');
        const renderer = this._makeRenderer(canvas);
        if (!renderer) return;

        const w = canvas.offsetWidth || 400, h = canvas.offsetHeight || 400;
        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(26, w / h, 0.1, 100);
        camera.position.set(0.15, 0, 6.2);
        this._addLights(scene);

        const SW = 0.46, SH = 2.10, SD = 0.09;
        const stick   = new THREE.Group();
        const foilMat = new THREE.MeshStandardMaterial({ color: 0xc2d0c2, roughness: 0.28, metalness: 0.50 });
        const labelMat= new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.04 });
        const sealMat = new THREE.MeshStandardMaterial({ color: 0xa8baa8, roughness: 0.22, metalness: 0.58 });

        /* Cuerpo: label en cara +Z/-Z */
        stick.add(new THREE.Mesh(new THREE.BoxGeometry(SW, SH, SD),
            [foilMat, foilMat, foilMat, foilMat, labelMat, labelMat]));

        /* Cara frontal ligeramente inflada */
        const puffGeo = this._createPuffedPlane(SW - 0.01, SH - 0.02, 28, 0.025);
        const puff    = new THREE.Mesh(puffGeo, labelMat);
        puff.position.z = SD / 2 + 0.001; stick.add(puff);

        /* Sellos */
        [[SH / 2 + 0.085], [-SH / 2 - 0.085]].forEach(([py]) => {
            stick.add(Object.assign(
                new THREE.Mesh(new THREE.BoxGeometry(SW + 0.06, 0.17, SD + 0.01), sealMat),
                { position: new THREE.Vector3(0, py, 0) }
            ));
        });

        /* Muescas */
        [-SW / 2 - 0.01, SW / 2 + 0.01].forEach(px => {
            const n = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, SD + 0.02),
                new THREE.MeshStandardMaterial({ color: 0x505850, roughness: 0.35 }));
            n.position.set(px, SH / 2 + 0.06, 0); stick.add(n);
        });

        /* Sombra */
        const shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(SW * 2.2, 0.30),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12, depthWrite: false })
        );
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = -SH / 2 - 0.09; stick.add(shadow);
        scene.add(stick);

        this.stickScene = { labelMat, renderer, camera };

        const ds = this._addDragRotation(canvas, stick);
        const animate = () => {
            requestAnimationFrame(animate);
            if (!ds.drag) { ds.vel *= 0.85; stick.rotation.y += ds.vel; }
            renderer.render(scene, camera);
        };
        animate();

        window.addEventListener('resize', () => {
            const nw = canvas.offsetWidth, nh = canvas.offsetHeight;
            if (!nw || !nh) return;
            camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
        });
    },

    _createPuffedPlane(w, h, segs, puff) {
        const geo = new THREE.PlaneGeometry(w, h, segs, segs);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const nx = pos.getX(i) / (w / 2), ny = pos.getY(i) / (h / 2);
            pos.setZ(i, puff * Math.exp(-(nx * nx + ny * ny) * 2.8));
        }
        geo.computeVertexNormals();
        return geo;
    },

    /* ── Selectores de color (bote) ──────────────────────────────── */
    bindColorPickers() {
        document.getElementById('cfg-body-color').addEventListener('input', e => {
            /* Solo el cuerpo físico (jar_body) — la etiqueta (jar_label) tiene material propio */
            if (this.bottleScene?.bodyMeshMat) this.bottleScene.bodyMeshMat.color.set(e.target.value);
        });
        document.getElementById('cfg-cap-color').addEventListener('input', e => {
            if (this.bottleScene?.capMat) this.bottleScene.capMat.color.set(e.target.value);
        });
    },

    /* ── Subida de archivo ────────────────────────────────────────── */
    bindUpload() {
        const area      = document.getElementById('cfg-upload-area');
        const input     = document.getElementById('cfg-file-input');
        const preview   = document.getElementById('cfg-uploaded-preview');
        const thumb     = document.getElementById('cfg-preview-thumb');
        const name      = document.getElementById('cfg-preview-name');
        const removeBtn = document.getElementById('cfg-remove-btn');

        area.addEventListener('click',    () => input.click());
        area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragging'); });
        area.addEventListener('dragleave',() => area.classList.remove('dragging'));
        area.addEventListener('drop', e => {
            e.preventDefault(); area.classList.remove('dragging');
            if (e.dataTransfer.files[0]) this.handleFile(e.dataTransfer.files[0], area, preview, thumb, name, input);
        });
        input.addEventListener('change', () => {
            if (input.files[0]) this.handleFile(input.files[0], area, preview, thumb, name, input);
        });

        removeBtn.addEventListener('click', () => {
            this.labelUrl = null; this._labelImg = null;
            preview.classList.remove('visible'); area.style.display = ''; input.value = '';
            this._resetLabelTex();
            /* Resetear sliders */
            this.labelState = { scale:1.0, offsetX:0, offsetY:0, rotation:0, brightness:100, contrast:100, saturation:100, opacity:100 };
            document.getElementById('cfg-scale-slider').value = 100;
            document.getElementById('cfg-scale-val').textContent = '100%';
            const rotEl = document.getElementById('adj-rotation');
            if (rotEl) { rotEl.value = 0; document.getElementById('adj-rotation-val').textContent = '0°'; }
        });
    },

    handleFile(file, area, preview, thumb, name, input) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor sube una imagen (PNG, JPG, SVG…).');
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            this.labelUrl = e.target.result;
            thumb.src = this.labelUrl; name.textContent = file.name;
            preview.classList.add('visible'); area.style.display = 'none';

            /* Resetear ajustes */
            this.labelState = { scale:1.0, offsetX:0, offsetY:0, rotation:0, brightness:100, contrast:100, saturation:100, opacity:100 };
            this._labelTex  = null;
            document.getElementById('cfg-scale-slider').value = 100;
            document.getElementById('cfg-scale-val').textContent = '100%';
            const rotEl2 = document.getElementById('adj-rotation');
            if (rotEl2) { rotEl2.value = 0; document.getElementById('adj-rotation-val').textContent = '0°'; }
            ['brightness','contrast','saturation','opacity'].forEach(k => {
                const el = document.getElementById('adj-'+k);
                if (el) { el.value = 100; document.getElementById('adj-'+k+'-val').textContent = '100'; }
            });

            /* Cargar imagen, aplicar y auto-cambiar a vista plana (bote) */
            this._labelImg = new Image();
            this._labelImg.onload = () => {
                this._applyCurrentLabel();
                if (this.format === 'bote') this._setFlatView(true);
            };
            this._labelImg.src    = this.labelUrl;
        };
        reader.readAsDataURL(file);
    },

    /* ── Formulario ───────────────────────────────────────────────── */
    bindForm() {
        document.getElementById('cfg-form').addEventListener('submit', e => {
            e.preventDefault(); this.submit();
        });
    },

    async submit() {
        const btn = document.getElementById('cfg-submit-btn');
        btn.disabled = true; btn.textContent = 'Enviando…';
        const fmt  = this.formats[this.format];
        const data = {
            nombre:   document.getElementById('cfg-nombre').value.trim(),
            email:    document.getElementById('cfg-email').value.trim(),
            empresa:  document.getElementById('cfg-empresa').value.trim()  || '—',
            telefono: document.getElementById('cfg-telefono').value.trim() || '—',
            galenica: fmt.label, aplicacion: 'Configurador de envase web',
            volumen: '—', formula_estado: '—', empresa_constituida: '—',
            notas: [
                'Consulta desde el configurador de envase. Formato: ' + fmt.label + '.',
                this.labelUrl ? 'Cliente ha subido etiqueta de muestra.' : 'Sin etiqueta.',
                document.getElementById('cfg-notas').value.trim()
            ].filter(Boolean).join(' ')
        };
        const apiUrl = (window.AKUMAL_CONFIG && window.AKUMAL_CONFIG.API_URL) || 'http://localhost:3001';
        try {
            const res  = await fetch(apiUrl + '/api/lead', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
            });
            const json = await res.json();
            if (json.ok) {
                document.getElementById('cfg-form-wrap').style.display = 'none';
                document.getElementById('cfg-success').classList.add('visible');
            } else { throw new Error(); }
        } catch {
            btn.disabled = false; btn.textContent = 'ENVIAR CONSULTA';
            alert('Error al enviar. Escríbenos a info@akumalnutrition.com');
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Configurador.init());
} else {
    Configurador.init();
}
