import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export function createCinematicRenderer(scene, camera) {
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: 'high-performance'
  });

  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.body.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomWidth = Math.max(1, Math.floor(window.innerWidth / 2));
  const bloomHeight = Math.max(1, Math.floor(window.innerHeight / 2));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(bloomWidth, bloomHeight),
    0.24,
    0.45,
    0.85
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  let lastBlurPx = -1;

  async function loadEnvironmentHdri(url) {
    const loader = new RGBELoader();
    try {
      const texture = await loader.loadAsync(url);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.environmentIntensity = 0.65;
      texture.dispose();
      return { ok: true, message: 'HDRI đã nạp: ' + url };
    } catch (error) {
      const fallbackLight = new THREE.HemisphereLight(0xb8c8de, 0x242830, 0.75);
      fallbackLight.name = 'Fallback_Environment_Hemi';
      scene.add(fallbackLight);
      return { ok: false, message: 'Chưa có HDRI (' + url + '), đang dùng ánh sáng môi trường tạm.' };
    }
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
    composer.render();
  }

  return {
    renderer,
    composer,
    loadEnvironmentHdri,
    setOpticalBlur,
    resize,
    render
  };
}