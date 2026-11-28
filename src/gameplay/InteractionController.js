import * as THREE from 'three';

export function createInteractionController(camera, neighborhoodWorld, ui) {
  const MAX_REACH = 2.55;
  const raycaster = new THREE.Raycaster();
  const centerNDC = new THREE.Vector2(0, 0);

  let enabled = false;
  let currentTarget = null;
  let audioCtx = null;

  function playClickSound(isDoor) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return;
    }
    try {
      if (!audioCtx) {
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      if (isDoor) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(92, now + 0.16);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.19);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(980, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.045);
      }
    } catch (err) {
    }
  }

  function findTarget() {
    const doors = neighborhoodWorld.getDoors();
    const switches = neighborhoodWorld.getSwitches();

    const meshToItem = new Map();
    const testMeshes = [];

    for (let i = 0; i < doors.length; i++) {
      for (let j = 0; j < doors[i].meshes.length; j++) {
        testMeshes.push(doors[i].meshes[j]);
        meshToItem.set(doors[i].meshes[j], doors[i]);
      }
    }
    for (let i = 0; i < switches.length; i++) {
      for (let j = 0; j < switches[i].meshes.length; j++) {
        testMeshes.push(switches[i].meshes[j]);
        meshToItem.set(switches[i].meshes[j], switches[i]);
      }
    }

    if (testMeshes.length === 0) {
      return null;
    }

    raycaster.near = 0.05;
    raycaster.far = MAX_REACH;
    raycaster.setFromCamera(centerNDC, camera);
    const hits = raycaster.intersectObjects(testMeshes, false);
    if (hits.length === 0) {
      return null;
    }
    return meshToItem.get(hits[0].object) || null;
  }

  function interactCurrent() {
    if (!enabled || !currentTarget) {
      return;
    }
    if (currentTarget.type === 'door') {
      currentTarget.isOpen = !currentTarget.isOpen;
      playClickSound(true);
    } else if (currentTarget.type === 'switch') {
      currentTarget.isOn = !currentTarget.isOn;
      if (currentTarget.targetLight) {
        currentTarget.targetLight.intensity = currentTarget.isOn ? currentTarget.baseLightIntensity : 0;
      }
      if (currentTarget.targetBulb && currentTarget.targetBulb.material) {
        currentTarget.targetBulb.material.emissiveIntensity = currentTarget.isOn ? 1.5 : 0.04;
      }
      playClickSound(false);
    }
  }

  window.addEventListener('keydown', function (e) {
    if (!enabled || e.repeat) {
      return;
    }
    const keyLower = (e.key || '').toLowerCase();
    if (e.code === 'KeyE' || keyLower === 'e' || keyLower === 'ê') {
      interactCurrent();
    }
  });

  function setEnabled(active) {
    enabled = Boolean(active);
    if (!enabled) {
      currentTarget = null;
      ui.setInteractPrompt('');
    }
  }

  function update(dt) {
    const doors = neighborhoodWorld.getDoors();
    for (let i = 0; i < doors.length; i++) {
      const d = doors[i];
      const goal = d.isOpen ? d.openAngle : 0;
      d.currentAngle = THREE.MathUtils.damp(d.currentAngle, goal, 7.5, dt);
      d.node.rotation.y = d.closedRotY + d.currentAngle;
    }

    if (!enabled) {
      return;
    }

    currentTarget = findTarget();
    if (!currentTarget) {
      ui.setInteractPrompt('');
      return;
    }

    if (currentTarget.type === 'door') {
      const action = currentTarget.isOpen ? 'Đóng cửa ' : 'Mở cửa ';
      ui.setInteractPrompt('[E] ' + action + currentTarget.label);
    } else if (currentTarget.type === 'switch') {
      const action = currentTarget.isOn ? 'Tắt ' : 'Bật ';
      ui.setInteractPrompt('[E] ' + action + currentTarget.label);
    }
  }

  return {
    setEnabled,
    update
  };
}
