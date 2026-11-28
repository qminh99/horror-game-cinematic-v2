import * as THREE from 'three';
import { GAME_CONFIG, ASSET_PATHS, INTRO_CONTRACT, NEIGHBORHOOD_CONTRACT } from './config/contract.js';
import { createCinematicRenderer } from './engine/cinematicRenderer.js';
import { createAssetLoader } from './engine/assetLoader.js';
import { createIntroAudio } from './intro/introAudio.js';
import { createBusIntroController } from './intro/BusIntroController.js';
import { createDormCharactersController } from './gameplay/DormCharactersController.js';
import { createNeighborhoodWorld } from './gameplay/NeighborhoodWorld.js';
import { createFirstPersonController } from './gameplay/FirstPersonController.js';
import { createInteractionController } from './gameplay/InteractionController.js';

const startScreen = document.getElementById('start-screen');
const playBtn = document.getElementById('play-btn');
const watchIntroBtn = document.getElementById('watch-intro-btn');
const assetStatusEl = document.getElementById('asset-status');
const eyelidEl = document.getElementById('eyelid-veil');
const subtitleEl = document.getElementById('subtitle');
const introHudEl = document.getElementById('intro-hud');
const gameplayHudEl = document.getElementById('gameplay-hud');
const locationBadgeEl = document.getElementById('location-badge');
const crosshairEl = document.getElementById('crosshair');
const interactPromptEl = document.getElementById('interact-prompt');
const pauseBarEl = document.getElementById('pause-bar');
const resumeBtn = document.getElementById('resume-btn');
const menuBtn = document.getElementById('menu-btn');
const debugBarEl = document.getElementById('debug-bar');

let debugVisible = false;
let mode = 'menu';
let introLoaded = false;
let introLoadingPromise = null;

const ui = {
  setSubtitle: function (text) {
    if (!text) {
      subtitleEl.textContent = '';
      subtitleEl.style.display = 'none';
      return;
    }
    subtitleEl.textContent = text;
    subtitleEl.style.display = 'block';
  },
  showIntroHud: function (visible) {
    introHudEl.hidden = !visible;
  },
  showGameplayHud: function (visible) {
    gameplayHudEl.hidden = !visible;
  },
  setLocationLabel: function (text) {
    if (locationBadgeEl.textContent !== text) {
      locationBadgeEl.textContent = text;
    }
  },
  setInteractPrompt: function (text) {
    if (!text) {
      interactPromptEl.textContent = '';
      interactPromptEl.style.display = 'none';
      crosshairEl.classList.remove('active');
      return;
    }
    interactPromptEl.textContent = text;
    interactPromptEl.style.display = 'block';
    crosshairEl.classList.add('active');
  },
  setEyelid: function (closedAmount, solidBlack) {
    if (closedAmount <= 0.005) {
      eyelidEl.style.opacity = '0';
      return;
    }
    if (solidBlack) {
      eyelidEl.style.background = '#000000';
      eyelidEl.style.opacity = String(closedAmount);
      return;
    }
    const openHeight = Math.max(0, (1.0 - closedAmount) * 76);
    eyelidEl.style.background =
      'radial-gradient(ellipse 96% ' +
      openHeight.toFixed(1) +
      '% at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.48) 64%, rgba(0,0,0,0.98) 100%)';
    eyelidEl.style.opacity = String(THREE.MathUtils.clamp(closedAmount * 1.15, 0, 1));
  },
  setDebugText: function (text) {
    if (debugVisible) {
      debugBarEl.style.display = 'block';
      debugBarEl.textContent = text;
    } else {
      debugBarEl.style.display = 'none';
    }
  }
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1019);
scene.fog = new THREE.FogExp2(0x0a1019, 0.017);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.06, 160);
camera.position.set(0, 1.72, 5.2);

const cinematicRenderer = createCinematicRenderer(scene, camera);
const assetLoader = createAssetLoader();
const introAudio = createIntroAudio(camera);
const busIntro = createBusIntroController(scene, camera, cinematicRenderer, introAudio, ui);
const dormCharacters = createDormCharactersController(scene);
const neighborhoodWorld = createNeighborhoodWorld(scene);
const fpController = createFirstPersonController(camera, cinematicRenderer.renderer.domElement, neighborhoodWorld);
const interactionController = createInteractionController(camera, neighborhoodWorld, ui);

fpController.onPointerLockChange(function (locked) {
  if (mode === 'gameplay') {
    pauseBarEl.hidden = locked;
  } else {
    pauseBarEl.hidden = true;
  }
});

function enterGameplay(resetPosition) {
  mode = 'gameplay';
  startScreen.style.display = 'none';
  ui.showIntroHud(false);
  ui.showGameplayHud(true);
  ui.setSubtitle('');
  ui.setEyelid(0, false);
  cinematicRenderer.setOpticalBlur(0);
  neighborhoodWorld.setVisible(true);
  if (resetPosition) {
    fpController.resetToSpawn();
  }
  fpController.setEnabled(true);
  interactionController.setEnabled(true);
  fpController.requestPointerLock();
  pauseBarEl.hidden = fpController.isPointerLocked();
}

function returnToMenu() {
  mode = 'menu';
  fpController.setEnabled(false);
  interactionController.setEnabled(false);
  ui.showGameplayHud(false);
  ui.showIntroHud(false);
  pauseBarEl.hidden = true;
  startScreen.style.display = 'grid';
}

async function ensureIntroLoaded() {
  if (introLoaded) {
    return true;
  }
  if (introLoadingPromise) {
    return introLoadingPromise;
  }
  introLoadingPromise = (async function () {
    watchIntroBtn.disabled = true;
    watchIntroBtn.textContent = 'ĐANG NẠP INTRO...';
    const audioPromise = introAudio.preloadAll();
    const introLoad = await assetLoader.loadGlb(ASSET_PATHS.introMaster);
    if (!introLoad.ok) {
      watchIntroBtn.textContent = 'CHƯA CÓ INTRO_MASTER.GLB';
      watchIntroBtn.disabled = false;
      introLoadingPromise = null;
      return false;
    }
    assetLoader.validateContract(introLoad.gltf, INTRO_CONTRACT);
    busIntro.attachGltf(introLoad.gltf);
    await audioPromise;
    introLoaded = true;
    watchIntroBtn.textContent = 'XEM LẠI INTRO';
    watchIntroBtn.disabled = false;
    return true;
  })();
  return introLoadingPromise;
}

async function startIntro() {
  const ready = await ensureIntroLoaded();
  if (!ready) {
    return;
  }
  mode = 'intro';
  startScreen.style.display = 'none';
  pauseBarEl.hidden = true;
  fpController.setEnabled(false);
  interactionController.setEnabled(false);
  ui.showGameplayHud(false);
  neighborhoodWorld.setVisible(false);
  busIntro.start(function () {
    enterGameplay(true);
  });
}

async function bootstrap() {
  const logs = [];
  assetStatusEl.textContent = 'Đang tải ánh sáng đêm và kiểm tra bản đồ khu phố...';

  const hdriResult = await cinematicRenderer.loadEnvironmentHdri(ASSET_PATHS.nightHdri);
  logs.push((hdriResult.ok ? '[OK] ' : '[INFO] ') + hdriResult.message);

  assetStatusEl.textContent = logs.concat(['Đang kiểm tra /assets/models/neighborhood_world.glb...']).join('\n');
  const worldLoad = await assetLoader.loadGlb(ASSET_PATHS.neighborhoodWorld);

  if (worldLoad.ok) {
    const report = assetLoader.validateNeighborhoodContract(worldLoad.gltf, NEIGHBORHOOD_CONTRACT);
    const summary = neighborhoodWorld.attachGltf(worldLoad.gltf);
    logs.push('[OK] Đã nạp bản đồ Blender: ' + ASSET_PATHS.neighborhoodWorld);
    logs.push('  - Sàn/Thang: ' + summary.walkCount + ' | Va chạm: ' + summary.colliderCount + ' | Cửa: ' + summary.doorCount);
    if (!report.valid) {
      logs.push('[WARN] GLB thiếu node SPAWN_Player hoặc WALK_/COL_, kiểm tra docs/NEIGHBORHOOD_CONTRACT.md');
    }
  } else {
    const summary = neighborhoodWorld.attachFallback();
    logs.push('[READY] Đã dựng sẵn khu phố đêm & nhà tập thể B1 (3 tầng, 6 phòng) để test ngay.');
    logs.push('  - Sàn/Thang: ' + summary.walkCount + ' | Va chạm: ' + summary.colliderCount + ' | Cửa: ' + summary.doorCount);
    logs.push('[INFO] Khi Codex xuất public/assets/models/neighborhood_world.glb, game sẽ tự chuyển sang bản Blender.');
  }

  logs.push('[INFO] Intro xe buýt tạm bỏ qua lúc khởi động (không xóa — bấm "XEM LẠI INTRO" để xem bất cứ lúc nào).');
  fpController.resetToSpawn();

  assetStatusEl.textContent = logs.join('\n');
  playBtn.textContent = 'VÀO KHU PHỐ (CHƠI NGAY)';
  playBtn.disabled = false;

  if (GAME_CONFIG.playIntroOnStart) {
    startIntro();
  }
}

playBtn.addEventListener('click', function () {
  enterGameplay(true);
});

watchIntroBtn.addEventListener('click', function () {
  startIntro();
});

resumeBtn.addEventListener('click', function () {
  if (mode === 'gameplay') {
    fpController.requestPointerLock();
  }
});

menuBtn.addEventListener('click', function () {
  returnToMenu();
});

window.addEventListener('keydown', function (event) {
  if ((event.code === 'Backquote' || event.code === 'F3' || (event.code === 'KeyD' && mode === 'intro')) && !event.repeat) {
    event.preventDefault();
    debugVisible = !debugVisible;
  } else if (event.code === 'KeyB' && !event.repeat && mode === 'gameplay') {
    cinematicRenderer.setBloomEnabled(!cinematicRenderer.isBloomEnabled());
  } else if (event.code === 'Space' && mode === 'intro' && busIntro.isActive()) {
    event.preventDefault();
    busIntro.skip();
  }
});

window.addEventListener('resize', function () {
  cinematicRenderer.resize();
});

const clock = new THREE.Clock();
let fpsFrames = 0;
let fpsAccum = 0;
let currentFps = 60;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  fpsFrames += 1;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    currentFps = Math.round(fpsFrames / fpsAccum);
    fpsFrames = 0;
    fpsAccum = 0;
  }

  if (mode === 'intro') {
    busIntro.update(dt);
  } else if (mode === 'gameplay') {
    fpController.update(dt);
    interactionController.update(dt);
    dormCharacters.update(dt);
    const pos = fpController.getPosition();
    ui.setLocationLabel(neighborhoodWorld.getZoneLabel(pos));
    if (debugVisible) {
      ui.setDebugText(
        'FPS: ' + currentFps + ' | BLOOM: ' + (cinematicRenderer.isBloomEnabled() ? 'ON' : 'OFF') + '\n' +
        'POS: ' + pos.x.toFixed(2) + ', ' + pos.y.toFixed(2) + ', ' + pos.z.toFixed(2)
      );
    } else {
      ui.setDebugText('');
    }
  }

  cinematicRenderer.render();
}

bootstrap();
animate();
