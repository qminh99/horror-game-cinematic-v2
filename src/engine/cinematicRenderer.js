import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GAME_CONFIG } from '../config/contract.js';

export function createCinematicRenderer(scene, camera) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  document.body.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomWidth = Math.max(1, Math.floor(window.innerWidth / 2));
  const bloomHeight = Math.max(1, Math.floor(window.innerHeight / 2));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(bloomWidth, bloomHeight),
    0.22,
    0.45,
    0.86
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  let bloomEnabled = Boolean(GAME_CONFIG.enableBloomByDefault);
  let lastBlurPx = -1;

  async function loadEnvironmentHdri(url) {
    const loader = new RGBELoader();
    try {
      const texture = await loader.loadAsync(url);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.environmentIntensity = 0.55;
      texture.dispose();
      return { ok: true, message: 'HDRI đã nạp: ' + url };
    } catch (error) {
      const fallbackLight = new THREE.HemisphereLight(0xb8c8de, 0x242830, 0.7);
      fallbackLight.name = 'Fallback_Environment_Hemi';
      scene.add(fallbackLight);
      return { ok: false, message: 'Chưa có HDRI (' + url + '), dùng ánh sáng môi trường chuẩn.' };
    }
  }

  function setBloomEnabled(enabled) {
    bloomEnabled = Boolean(enabled);
  }

  function isBloomEnabled() {
    return bloomEnabled;
  }

  function setOpticalBlur(blurAmount) {
    let blurPx = 0;
    if (blurAmount > 0.0002) {
      blurPx = Math.round(blurAmount * 550 * 10) / 10;
    }
    if (blurPx === lastBlurPx) {
      return;
    }
    lastBlurPx = blurPx;
    if (blurPx <= 0) {
      renderer.domElement.style.filter = '';
    } else {
      renderer.domElement.style.filter = 'blur(' + blurPx + 'px)';
    }
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloomPass.setSize(Math.max(1, Math.floor(w / 2)), Math.max(1, Math.floor(h / 2)));
  }

  function render() {
    if (bloomEnabled) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  return {
    renderer,
    composer,
    loadEnvironmentHdri,
    setBloomEnabled,
    isBloomEnabled,
    setOpticalBlur,
    resize,
    render
  };
}
