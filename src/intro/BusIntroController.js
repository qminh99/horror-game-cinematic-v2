import * as THREE from 'three';
import { INTRO_CONTRACT } from '../config/contract.js';

export function createBusIntroController(scene, camera, cinematicRenderer, introAudio, ui) {
  let rootGroup = null;
  let mixer = null;
  let masterAction = null;
  let cameraRigNode = null;
  let glassesNode = null;

  const ceilingMeshes = [];
  const ceilingLights = [];
  const tempPos = new THREE.Vector3();
  const tempQuat = new THREE.Quaternion();

  let active = false;
  let elapsed = 0;
  let cueFlags = {};
  let onCompleteCallback = null;

  function smoothstep(edge0, edge1, x) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function pulseBell(start, peak, end, t) {
    if (t <= start || t >= end) {
      return 0;
    }
    if (t < peak) {
      return smoothstep(start, peak, t);
    }
    return 1 - smoothstep(peak, end, t);
  }

  function ceilingFlickerFactor(t) {
    const interval = INTRO_CONTRACT.flickerIntervalSeconds;
    const duration = INTRO_CONTRACT.flickerDurationSeconds;
    const depth = INTRO_CONTRACT.flickerDepth;
    if (t < interval - 0.1) {
      return 1.0;
    }
    const phase = t % interval;
    if (phase < duration) {
      const dip = Math.sin((phase / duration) * Math.PI);
      return 1.0 - depth * dip;
    }
    return 1.0;
  }

  function triggerOnce(key, fn) {
    if (!cueFlags[key]) {
      cueFlags[key] = true;
      fn();
    }
  }

  function attachGltf(gltf) {
    rootGroup = gltf.scene;
    rootGroup.visible = false;
    scene.add(rootGroup);

    cameraRigNode = rootGroup.getObjectByName(INTRO_CONTRACT.cameraNodeName);
    glassesNode = rootGroup.getObjectByName('Prop_Glasses');

    ceilingMeshes.length = 0;
    ceilingLights.length = 0;

    rootGroup.traverse(function (node) {
      if (node.isMesh && node.name.startsWith(INTRO_CONTRACT.ceilingLightMeshPrefix)) {
        if (node.material && typeof node.material.emissiveIntensity === 'number') {
          ceilingMeshes.push({
            material: node.material,
            baseIntensity: node.material.emissiveIntensity
          });
        }
      }
      if (node.isLight && node.name.startsWith(INTRO_CONTRACT.ceilingLightPointPrefix)) {
        ceilingLights.push({
          light: node,
          baseIntensity: node.intensity
        });
      }
    });

    mixer = new THREE.AnimationMixer(rootGroup);
    let chosenClip = null;
    for (let i = 0; i < gltf.animations.length; i++) {
      if (gltf.animations[i].name === INTRO_CONTRACT.masterClipName) {
        chosenClip = gltf.animations[i];
        break;
      }
    }
    if (!chosenClip && gltf.animations.length > 0) {
      chosenClip = gltf.animations[0];
    }
    if (chosenClip) {
      masterAction = mixer.clipAction(chosenClip);
      masterAction.setLoop(THREE.LoopOnce, 1);
      masterAction.clampWhenFinished = true;
    }
  }

  function start(onComplete) {
    if (!rootGroup) {
      return false;
    }
    onCompleteCallback = onComplete;
    rootGroup.visible = true;
    active = true;
    elapsed = 0;
    cueFlags = {};

    if (masterAction) {
      masterAction.reset();
      masterAction.play();
    }
    introAudio.startAmbience();
    ui.showIntroHud(true);
    ui.setSubtitle('');
    update(0);
    return true;
  }

  function finish() {
    if (!active) {
      return;
    }
    active = false;
    introAudio.stopAll();
    cinematicRenderer.setOpticalBlur(0, 2.0);
    ui.setSubtitle('');
    ui.showIntroHud(false);
    ui.setEyelid(0, false);
    if (rootGroup) {
      rootGroup.visible = false;
    }
    if (typeof onCompleteCallback === 'function') {
      onCompleteCallback();
    }
  }

  function update(dt) {
    if (!active) {
      return;
    }
    elapsed += dt;
    const t = elapsed;

    if (mixer) {
      mixer.update(dt);
    }

    if (cameraRigNode) {
      cameraRigNode.updateWorldMatrix(true, false);
      cameraRigNode.getWorldPosition(tempPos);
      cameraRigNode.getWorldQuaternion(tempQuat);
      camera.position.copy(tempPos);
      camera.quaternion.copy(tempQuat);
      if (cameraRigNode.isPerspectiveCamera && cameraRigNode.fov) {
        if (Math.abs(camera.fov - cameraRigNode.fov) > 0.05) {
          camera.fov = cameraRigNode.fov;
          camera.updateProjectionMatrix();
        }
      }
    }

    const flicker = ceilingFlickerFactor(t);
    for (let i = 0; i < ceilingMeshes.length; i++) {
      ceilingMeshes[i].material.emissiveIntensity = ceilingMeshes[i].baseIntensity * flicker;
    }
    for (let i = 0; i < ceilingLights.length; i++) {
      ceilingLights[i].light.intensity = ceilingLights[i].baseIntensity * flicker;
    }

    const timings = INTRO_CONTRACT.timings;

    if (t >= 7.6) {
      triggerOnce('bagZipper', function () {
        introAudio.playCue('bagZipper');
      });
    }
    if (t >= 12.6) {
      triggerOnce('glassesClink', function () {
        introAudio.playCue('glassesClink');
      });
    }
    if (t >= timings.driverCallTime) {
      triggerOnce('driverCall', function () {
        const played = introAudio.playCue('driverCall');
        if (!played) {
          introAudio.speakDriverFallback();
        }
        ui.setSubtitle('Bác tài: “Tới nơi rồi, cháu xuống xe đi.”');
      });
    }
    if (t >= timings.driverCallTime + timings.driverCallDuration) {
      triggerOnce('clearDriverSub', function () {
        ui.setSubtitle('');
      });
    }
    if (t >= 25.5) {
      triggerOnce('footsteps', function () {
        introAudio.playCue('footsteps');
      });
    }
    if (t >= timings.doorOpenTime) {
      triggerOnce('doorOpen', function () {
        introAudio.playCue('doorOpen');
      });
    }

    if (glassesNode) {
      if (t >= timings.glassesOnStart + 0.15) {
        glassesNode.visible = false;
      } else {
        glassesNode.visible = true;
      }
    }

    const exteriorMix = smoothstep(timings.doorOpenTime, 35.0, t);
    introAudio.setStreetExteriorMix(exteriorMix);

    let blurStrength = 0.0;
    let focusDistance = 1.6;
    if (t < timings.glassesOnStart) {
      const blinkClear = smoothstep(1.6, 5.4, t);
      blurStrength = 0.014 - 0.0045 * blinkClear;
      focusDistance = 0.8 + 0.5 * blinkClear;
    } else if (t < timings.glassesOnEnd) {
      const pull = smoothstep(timings.glassesOnStart, timings.glassesOnEnd, t);
      blurStrength = 0.0095 * (1.0 - pull);
      focusDistance = 1.3 + 2.2 * pull;
    }
    cinematicRenderer.setOpticalBlur(blurStrength, focusDistance);

    const wakeOpen = 1.0 - smoothstep(timings.wakeOpenStart, timings.wakeOpenEnd, t);
    const blink1 = 0.88 * pulseBell(1.85, 2.18, 2.55, t);
    const blink2 = 0.8 * pulseBell(3.3, 3.6, 3.95, t);
    const blink3 = 0.55 * pulseBell(4.8, 5.08, 5.36, t);
    const endFade = smoothstep(timings.fadeOutStart, timings.fadeOutEnd, t);
    const closed = THREE.MathUtils.clamp(Math.max(wakeOpen, blink1, blink2, blink3, endFade), 0, 1);

    if (endFade > 0.01) {
      ui.setEyelid(closed, true);
    } else {
      ui.setEyelid(closed, false);
    }

    ui.setDebugText(
      'TIME: ' + t.toFixed(2) + 's / ' + INTRO_CONTRACT.durationSeconds.toFixed(1) + 's | ' +
      'FLICKER: ' + flicker.toFixed(2) + ' | ' +
      'BLUR: ' + blurStrength.toFixed(4)
    );

    if (t >= INTRO_CONTRACT.durationSeconds) {
      finish();
    }
  }

  return {
    attachGltf,
    start,
    skip: finish,
    update,
    isActive: function () {
      return active;
    }
  };
}
