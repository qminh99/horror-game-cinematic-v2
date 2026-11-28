import * as THREE from 'three';

export function createFlashlightController(scene, camera, world) {
  const coreSpot = new THREE.SpotLight(0xfff2da, 44, 22, Math.PI / 8.5, 0.42, 1.5);
  coreSpot.shadow.mapSize.set(1024, 1024);
  coreSpot.shadow.bias = -0.0004;
  coreSpot.shadow.normalBias = 0.025;
  coreSpot.shadow.camera.near = 0.12;
  coreSpot.shadow.camera.far = 22;
  const spillSpot = new THREE.SpotLight(0xfff2da, 10, 11, Math.PI / 4.2, 0.85, 1.8);
  spillSpot.target = coreSpot.target;
  scene.add(coreSpot, spillSpot, coreSpot.target);
  setLit(false);
  const origin = new THREE.Vector3();
  const aim = new THREE.Vector3();
  const dark = new THREE.Color(0x020305);
  const sky = new THREE.Color();
  const haze = new THREE.Color();
  const lights = new Map();
  let active = false;
  let environment = 0.18;
  let density = 0.017;
  let depth = 0;
  let audio;

  function setLit(on) {
    coreSpot.visible = spillSpot.visible = on;
    coreSpot.castShadow = on;
  }

  function click() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audio ??= new Audio();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t = audio.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(740, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.035);
    gain.gain.setValueAtTime(0.045, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.05);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  window.addEventListener('keydown', event => {
    if (!active || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code !== 'KeyF' && event.key?.toLowerCase() !== 'f') return;
    setLit(!coreSpot.visible);
    click();
  });

  function applyDarkness() {
    scene.environmentIntensity = THREE.MathUtils.lerp(environment, 0.003, depth);
    scene.background.copy(sky).lerp(dark, depth);
    scene.fog.color.copy(haze).lerp(dark, depth);
    scene.fog.density = THREE.MathUtils.lerp(density, 0.068, depth);
    for (const [light, { intensity, roomSwitch }] of lights) {
      light.intensity = (roomSwitch && !roomSwitch.isOn ? 0 : intensity) * (1 - depth);
    }
  }

  function setEnabled(value) {
    if (active === value) return;
    active = value;
    depth = 0;
    if (!active) {
      setLit(false);
      applyDarkness();
      lights.clear();
      return;
    }
    sky.copy(scene.background);
    haze.copy(scene.fog.color);
    density = scene.fog.density;
    environment = scene.environmentIntensity;
    scene.traverseVisible(light => {
      if (light === spillSpot || !(light.isDirectionalLight || light.isHemisphereLight ||
        (light.isPointLight && light.getWorldPosition(origin).y > -0.6))) return;
      const roomSwitch = world.getSwitches().find(item => item.targetLight === light);
      lights.set(light, { intensity: roomSwitch?.baseLightIntensity ?? light.intensity, roomSwitch });
    });
    track(1);
  }

  function track(alpha) {
    camera.updateWorldMatrix(true, false);
    origin.set(0.18, -0.19, -0.24).applyMatrix4(camera.matrixWorld);
    aim.set(0.08, -0.28, -9).applyMatrix4(camera.matrixWorld);
    coreSpot.position.lerp(origin, alpha);
    spillSpot.position.copy(coreSpot.position);
    coreSpot.target.position.lerp(aim, alpha);
  }

  function update(dt, position) {
    track(THREE.MathUtils.damp(0, 1, 14, dt));
    const target = THREE.MathUtils.clamp((-0.35 - position.y) / 1.45, 0, 1);
    depth = THREE.MathUtils.damp(depth, target, 10, dt);
    applyDarkness();
  }
  return { setEnabled, update, isOn: () => coreSpot.visible };
}
