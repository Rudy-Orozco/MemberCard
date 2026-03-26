/**
 * scene.js
 * Three.js scene setup, card mesh, and animation state machine.
 * You shouldn't need to edit this unless changing the 3D scene itself.
 */

import * as THREE from 'three';
import { drawFront, drawBack } from './cardTexture.js';

// ── Card dimensions (width, height, depth in 3D units) ──
const CW = 3.17, CH = 2.0, CD = 0.036;

export function createScene() {
  const canvas = document.getElementById('gl');

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0xf0ece6, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights = true;

  // ── Scene & Camera ──
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.01, 100);
  camera.position.set(0, 3.2, 7);
  camera.lookAt(0, 0, 0);

  // ── Lights ──
  const key = new THREE.SpotLight(0xffffff, 60, 30, Math.PI * 0.22, 0.45, 2);
  key.position.set(1, 9, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.001;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0xdde8ff, 1.0);
  fill.position.set(-5, 4, -3); scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 2.0);
  rim.position.set(4, 6, -5); scene.add(rim);

  scene.add(new THREE.AmbientLight(0xffffff, 3));

  const pt1 = new THREE.PointLight(0xffffff, 3, 8);
  pt1.position.set(2, 2, 3); scene.add(pt1);

  // ── Environment map ──
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x111111);
  [[0xffffff,4,6,3,8],[0xdde8ff,-5,4,-4,4],[0xffffff,5,3,6,5]].forEach(([c,x,y,z,i]) => {
    const p = new THREE.PointLight(c, i, 20); p.position.set(x,y,z); envScene.add(p);
  });
  envScene.add(new THREE.AmbientLight(0xffffff, 5));
  scene.environment = pmrem.fromScene(envScene).texture;

  // ── Card geometry (rounded box via ExtrudeGeometry) ──
  const R = 0.11;
  const shape = new THREE.Shape();
  shape.moveTo(-CW/2+R, -CH/2); shape.lineTo(CW/2-R, -CH/2);
  shape.quadraticCurveTo(CW/2, -CH/2, CW/2, -CH/2+R);
  shape.lineTo(CW/2, CH/2-R);
  shape.quadraticCurveTo(CW/2, CH/2, CW/2-R, CH/2);
  shape.lineTo(-CW/2+R, CH/2);
  shape.quadraticCurveTo(-CW/2, CH/2, -CW/2, CH/2-R);
  shape.lineTo(-CW/2, -CH/2+R);
  shape.quadraticCurveTo(-CW/2, -CH/2, -CW/2+R, -CH/2);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: CD, bevelEnabled: false });
  bodyGeo.translate(0, 0, -CD/2);

  const edgeMat  = new THREE.MeshStandardMaterial({ color: 0x0c0c1a, roughness: .45, metalness: .3, envMapIntensity: .8 });
  const frontMat = new THREE.MeshStandardMaterial({ roughness: .15, metalness: .60, envMapIntensity: 1.4 });
  const backMat  = new THREE.MeshStandardMaterial({ roughness: .22, metalness: .35, envMapIntensity: .8 });

  // ── Rounded oval roughness map ──
  // Paints a soft elliptical hotspot of low roughness (shiny) in the centre,
  // fading to high roughness (matte) at the edges — giving a natural card glare shape.
  function makeRoughnessMap(w, h, {
    cx = 0.42,   // hotspot centre X (0–1), slightly left of centre like a real light
    cy = 0.38,   // hotspot centre Y (0–1), slightly above centre
    rx = 0.38,   // horizontal radius (0–1 of canvas width)
    ry = 0.28,   // vertical radius — smaller than rx = wide flat oval
    shinyRoughness  = 0.0,   // roughness at the hotspot centre (0 = mirror)
    edgeRoughness   = 1.0,   // roughness at the outer edge (1 = fully matte)
    falloff         = 0.55,  // how quickly it transitions (lower = sharper edge)
  } = {}) {
    const cvs = document.createElement('canvas');
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext('2d');

    // Fill with edge roughness (white = rough)
    const edgeVal = Math.round(edgeRoughness * 255);
    ctx.fillStyle = `rgb(${edgeVal},${edgeVal},${edgeVal})`;
    ctx.fillRect(0, 0, w, h);

    // Draw oval gradient: dark centre (shiny) → light edges (matte)
    // We use a circular gradient then scale the canvas to make it oval.
    const shinyVal = Math.round(shinyRoughness * 255);
    const spread   = Math.round(edgeRoughness * 255);

    ctx.save();
    // Translate to hotspot centre, scale to make oval
    ctx.translate(cx * w, cy * h);
    ctx.scale(rx * w, ry * h);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0,          `rgb(${shinyVal},${shinyVal},${shinyVal})`);
    grad.addColorStop(falloff,    `rgb(${Math.round(edgeRoughness*0.4*255)},${Math.round(edgeRoughness*0.4*255)},${Math.round(edgeRoughness*0.4*255)})`);
    grad.addColorStop(1,          `rgb(${spread},${spread},${spread})`);

    ctx.fillStyle = grad;
    // Draw a unit circle — scaled into an oval by the transform above
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    return new THREE.CanvasTexture(cvs);
  }

  // Apply roughness map to front and back faces
  // Tweak the options object to reshape the glare:
  frontMat.roughnessMap = makeRoughnessMap(512, 320, {
    cx: 0.42, cy: 0.38,
    rx: 0.38, ry: 0.26,
    shinyRoughness: 0.0,
    edgeRoughness:  0.42,  // semi-shiny at edges, not fully matte
    falloff: 0.52,
  });
  frontMat.needsUpdate = true;

  backMat.roughnessMap = makeRoughnessMap(512, 320, {
    cx: 0.55, cy: 0.42,
    rx: 0.32, ry: 0.22,
    shinyRoughness: 0.05,
    edgeRoughness:  0.48,
    falloff: 0.50,
  });
  backMat.needsUpdate = true;

  // ── Rounded face geometry ──
  // Use the same rounded shape as the card body so corners are clipped.
  // PlaneGeometry would leave square corners poking out past the rounded edges.
  const faceShape = new THREE.Shape();
  const FR = R - 0.002; // very slightly smaller than body radius to avoid z-fighting
  faceShape.moveTo(-CW/2+FR, -CH/2);
  faceShape.lineTo( CW/2-FR, -CH/2); faceShape.quadraticCurveTo( CW/2, -CH/2,  CW/2, -CH/2+FR);
  faceShape.lineTo( CW/2,  CH/2-FR); faceShape.quadraticCurveTo( CW/2,  CH/2,  CW/2-FR,  CH/2);
  faceShape.lineTo(-CW/2+FR,  CH/2); faceShape.quadraticCurveTo(-CW/2,  CH/2, -CW/2,  CH/2-FR);
  faceShape.lineTo(-CW/2, -CH/2+FR); faceShape.quadraticCurveTo(-CW/2, -CH/2, -CW/2+FR, -CH/2);
  const faceGeo = new THREE.ShapeGeometry(faceShape, 8);
  // ShapeGeometry UVs are in local shape space — remap to 0–1 across card bounds
  // so card texture maps correctly across the full face.
  const facePos = faceGeo.attributes.position;
  const faceUV  = faceGeo.attributes.uv;
  for (let i = 0; i < facePos.count; i++) {
    faceUV.setXY(i,
      (facePos.getX(i) + CW/2) / CW,
      (facePos.getY(i) + CH/2) / CH
    );
  }
  faceUV.needsUpdate = true;
  const cardGroup = new THREE.Group(); scene.add(cardGroup);

  const bodyMesh  = new THREE.Mesh(bodyGeo, edgeMat);  bodyMesh.castShadow = true; cardGroup.add(bodyMesh);
  const frontMesh = new THREE.Mesh(faceGeo, frontMat); frontMesh.position.z =  CD/2+.001; frontMesh.castShadow = true; cardGroup.add(frontMesh);
  const backMesh  = new THREE.Mesh(faceGeo, backMat);  backMesh.position.z  = -CD/2-.001; backMesh.rotation.y = Math.PI; cardGroup.add(backMesh);



  // Soft shadow blob (radial gradient texture)
  const shadowCvs = document.createElement('canvas'); shadowCvs.width = shadowCvs.height = 256;
  const sc = shadowCvs.getContext('2d');
  const sg = sc.createRadialGradient(128,128,0,128,128,128);
  sg.addColorStop(0,   'rgba(0,0,0,0.9)');
  sg.addColorStop(0.4, 'rgba(0,0,0,0.6)');
  sg.addColorStop(0.75,'rgba(0,0,0,0.2)');
  sg.addColorStop(1,   'rgba(0,0,0,0)');
  sc.fillStyle = sg; sc.fillRect(0, 0, 256, 256);
  const blobMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCvs), transparent: true, opacity: 0, depthWrite: false });
  const blob    = new THREE.Mesh(new THREE.PlaneGeometry(1,1), blobMat);
  blob.rotation.x = -Math.PI/2; blob.position.y = -1.06;
  scene.add(blob);

  cardGroup.visible = false;

  // ── State machine ──
  const TABLE_Y  = -1.05;
  const HELD_Z   =  1.8;

  const curPos  = new THREE.Vector3(0, 6, 0);
  const curQuat = new THREE.Quaternion();
  const tgtPos  = new THREE.Vector3(0, 6, 0);
  const tgtQuat = new THREE.Quaternion();
  const mouse   = new THREE.Vector2(0, 0);

  let state    = 'hidden';
  let revealed = false;

  const POS_SPEED  = 6.0;
  const ROT_SPEED  = 8.0;
  const SLOW_SPEED = 3.5;

  // Camera's downward angle toward held card — so card faces camera perfectly at mouse centre
  const CAM_ANGLE_X = Math.atan2(camera.position.y - 0.3, camera.position.z - HELD_Z);

  function setTableTarget() {
    tgtPos.set(0, TABLE_Y, 0);
    tgtQuat.setFromEuler(new THREE.Euler(-Math.PI/2, 0, 0, 'YXZ'));
  }

  function setHeldTarget(showBack) {
    tgtPos.set(0, 0.3, HELD_Z);
    if (showBack) {
      tgtQuat.setFromEuler(new THREE.Euler(
        CAM_ANGLE_X + mouse.y * 0.45,
        Math.PI + mouse.x * 0.55,
        -mouse.x * 0.04, 'YXZ'
      ));
    } else {
      tgtQuat.setFromEuler(new THREE.Euler(
        -CAM_ANGLE_X + mouse.y * 0.45,
        mouse.x * 0.55,
        -mouse.x * 0.04, 'YXZ'
      ));
    }
  }

  // ── Texture helpers ──
  function makeTex(cvs) {
    const t = new THREE.CanvasTexture(cvs);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function bakeTextures(data) {
    const fCvs = document.getElementById('tc-front');
    const bCvs = document.getElementById('tc-back');
    const fCtx = fCvs.getContext('2d');
    const bCtx = bCvs.getContext('2d');
    fCtx.clearRect(0, 0, 1024, 576);
    bCtx.clearRect(0, 0, 1024, 576);
    drawFront(fCtx, data);
    drawBack(bCtx, data);
    frontMat.map = makeTex(fCvs); frontMat.needsUpdate = true;
    backMat.map  = makeTex(bCvs); backMat.needsUpdate  = true;
  }

  // ── Reveal ──
  function reveal(data) {
    revealed = true;
    bakeTextures(data);
    curPos.set(0, 7, 0);
    curQuat.setFromEuler(new THREE.Euler(-Math.PI/2, 0, 0, 'YXZ'));
    cardGroup.visible = true;
    state = 'dropping';
    setTableTarget();
    canvas.classList.add('clickable');
  }

  // ── Re-bake (called by HMR when cardTexture.js changes) ──
  function rebake(data) {
    if (!revealed || !data) return;
    bakeTextures(data);
  }

  // ── Input ──
  window.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / innerWidth)  * 2 - 1;
    mouse.y = -((e.clientY / innerHeight) * 2 - 1);
  });

  let lastClick = 0;
  canvas.addEventListener('click', () => {
    if (!revealed) return;
    const now = Date.now();
    const dbl = now - lastClick < 320;
    lastClick = now;

    if (dbl) {
      state = 'table'; setTableTarget(); return;
    }
    if (state === 'table' || state === 'dropping') {
      state = 'held'; setHeldTarget(false);
    } else if (state === 'held') {
      state = 'held-back'; setHeldTarget(true);
    } else if (state === 'held-back') {
      state = 'held'; setHeldTarget(false);
    }
  });

  // ── Main loop ──
  let last = performance.now();
  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    const dt  = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (revealed) {
      if (state === 'held')      setHeldTarget(false);
      if (state === 'held-back') setHeldTarget(true);

      const speed = (state === 'dropping' || state === 'table') ? SLOW_SPEED : POS_SPEED;
      curPos.lerp(tgtPos, 1 - Math.exp(-speed * dt));
      curQuat.slerp(tgtQuat, 1 - Math.exp(-ROT_SPEED * dt));

      if (state === 'dropping' && curPos.distanceTo(tgtPos) < 0.05) state = 'table';

      cardGroup.position.copy(curPos);
      cardGroup.quaternion.copy(curQuat);

      // Shadow
      const onTable = state === 'table' || state === 'dropping';
      const blobT   = onTable ? Math.max(0, 1 - (curPos.y - TABLE_Y) / 3) : 0;
      blobMat.opacity = blobT * 0.5;
      blob.position.x = curPos.x * 0.8; blob.position.z = curPos.z * 0.8;
      blob.scale.set(CW*(0.5+blobT*0.5), CH*(0.5+blobT*0.5), 1);


    }

    renderer.render(scene, camera);
  }
  loop();

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ── Save PNG ──
  function saveCardPng(data) {
    if (!data) return;
    const cvs = document.getElementById('tc-front');
    const a   = document.createElement('a');
    a.download = 'member-card.png';
    a.href = cvs.toDataURL('image/png');
    a.click();
  }

  return { reveal, rebake, saveCardPng };
}