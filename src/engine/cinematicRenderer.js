import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export function createCinematicRenderer(scene, camera) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance'
  });

  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.body.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.28,
    0.55,
    0.82
  );
  composer.addPass(bloomPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 1.6,
    aperture: 0.00025,
    maxblur: 0.0
  });
  bokehPass.enabled = false;
  composer.addPass(bokehPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

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

  function setOpticalBlur(blurAmount, focusDistance) {
    if (blurAmount <= 0.0002) {
      bokehPass.enabled = false;
      bokehPass.uniforms.maxblur.value = 0.0;
      return;
    }
    bokehPass.enabled = true;
    bokehPass.uniforms.maxblur.value = blurAmount;
    bokehPass.uniforms.focus.value = focusDistance;
    bokehPass.uniforms.aperture.value = 0.00035;
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
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
