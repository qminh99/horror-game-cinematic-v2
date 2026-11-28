import * as THREE from 'three';
import { ASSET_PATHS, INTRO_CONTRACT } from './config/contract.js';
import { createCinematicRenderer } from './engine/cinematicRenderer.js';
import { createAssetLoader } from './engine/assetLoader.js';
import { createIntroAudio } from './intro/introAudio.js';
import { createBusIntroController } from './intro/BusIntroController.js';
import { createDormCharactersController } from './gameplay/DormCharactersController.js';

const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const assetStatusEl = document.getElementById('asset-status');
const eyelidEl = document.getElementById('eyelid-veil');
const subtitleEl = document.getElementById('subtitle');
const introHudEl = document.getElementById('intro-hud');
const debugBarEl = document.getElementById('debug-bar');

let debugVisible = false;

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
scene.background = new THREE.Color(0x090f18);
scene.fog = new THREE.FogExp2(0x090f18, 0.015);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.04, 150);
camera.position.set(0, 1.5, 3.0);

const cinematicRenderer = createCinematicRenderer(scene, camera);
const assetLoader = createAssetLoader();
const introAudio = createIntroAudio(camera);
const busIntro = createBusIntroController(scene, camera, cinematicRenderer, introAudio, ui);
const dormCharacters = createDormCharactersController(scene);

let introReady = false;

async function bootstrap() {
  const logs = [];
  const audioLoading = introAudio.preloadAll();

  assetStatusEl.textContent = 'Đang tải ánh sáng môi trường…';
  const hdriResult = await cinematicRenderer.loadEnvironmentHdri(ASSET_PATHS.nightHdri);
  if (hdriResult.ok) {
    logs.push('[OK] ' + hdriResult.message);
  } else {
    logs.push('[WARN] ' + hdriResult.message);
  }

  assetStatusEl.textContent = [...logs, 'Đang tải và giải mã mô hình intro…'].join('\n');
  const introLoad = await assetLoader.loadGlb(ASSET_PATHS.introMaster);
  if (introLoad.ok) {
    const report = assetLoader.validateContract(introLoad.gltf, INTRO_CONTRACT);
    busIntro.attachGltf(introLoad.gltf);
    introReady = true;
    if (report.valid) {
      logs.push('[OK] intro_master.glb đạt đủ 100% Asset Contract.');
    } else {
      logs.push('[WARN] intro_master.glb đã nạp nhưng thiếu node/clip:');
      if (report.missingNodes.length > 0) {
        logs.push('  - Thiếu Node: ' + report.missingNodes.join(', '));
      }
      if (!report.hasMasterClip) {
        logs.push('  - Thiếu Clip: ' + INTRO_CONTRACT.masterClipName + ' (hiện có: ' + report.clipNames.join(', ') + ')');
      }
    }
  } else {
    logs.push('[LỖI] Không nạp được ' + ASSET_PATHS.introMaster);
    logs.push(String(introLoad.error));
  }

  assetStatusEl.textContent = [...logs, '[INFO] Đang tải âm thanh intro…'].join('\n');
  startBtn.textContent = introReady ? 'BẮT ĐẦU INTRO' : 'KHÔNG TẢI ĐƯỢC INTRO';
  startBtn.disabled = !introReady;

  const audioResults = await audioLoading;
  let audioLoadedCount = 0;
  for (let i = 0; i < audioResults.length; i++) {
    if (audioResults[i].ok) {
      audioLoadedCount += 1;
    }
  }
  logs.push('[INFO] Âm thanh intro đã nạp: ' + audioLoadedCount + '/' + audioResults.length + ' track.');

  assetStatusEl.textContent = logs.join('\n');
}

startBtn.addEventListener('click', function () {
  if (!introReady) {
    return;
  }
  startScreen.style.display = 'none';
  busIntro.start(function () {
    ui.setSubtitle('Kết thúc Intro — Sẵn sàng chuyển sang cảnh Sân trước / Nhà trọ.');
  });
});

window.addEventListener('keydown', function (event) {
  if (event.code === 'KeyD') {
    debugVisible = !debugVisible;
  } else if (event.code === 'Space' && busIntro.isActive()) {
    event.preventDefault();
    busIntro.skip();
  }
});

window.addEventListener('resize', function () {
  cinematicRenderer.resize();
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  busIntro.update(dt);
  dormCharacters.update(dt);
  cinematicRenderer.render();
}

bootstrap();
animate();
