import * as THREE from 'three';

export function createDormCharactersController(scene) {
  let huyRoot = null;
  let huyMixer = null;
  let huySitAction = null;
  let huyStandAction = null;
  let jacketRoot = null;

  function attachHuy(gltf, position, rotationY) {
    huyRoot = gltf.scene;
    huyRoot.position.copy(position);
    huyRoot.rotation.y = rotationY;
    scene.add(huyRoot);

    huyMixer = new THREE.AnimationMixer(huyRoot);
    for (let i = 0; i < gltf.animations.length; i++) {
      const clip = gltf.animations[i];
      if (clip.name === 'Sit_Idle_Typing') {
        huySitAction = huyMixer.clipAction(clip);
      } else if (clip.name === 'Stand_Talk_Idle') {
        huyStandAction = huyMixer.clipAction(clip);
      }
    }
    if (huySitAction) {
      huySitAction.play();
    }
  }

  function attachJacket(gltf, position, rotationY) {
    jacketRoot = gltf.scene;
    jacketRoot.position.copy(position);
    jacketRoot.rotation.y = rotationY;
    scene.add(jacketRoot);
  }

  function setHuyTalking(isTalking) {
    if (!huySitAction || !huyStandAction) {
      return;
    }
    if (isTalking) {
      huyStandAction.reset();
      huyStandAction.play();
      huySitAction.crossFadeTo(huyStandAction, 0.45, false);
    } else {
      huySitAction.reset();
      huySitAction.play();
      huyStandAction.crossFadeTo(huySitAction, 0.45, false);
    }
  }

  function update(dt) {
    if (huyMixer) {
      huyMixer.update(dt);
    }
  }

  return {
    attachHuy,
    attachJacket,
    setHuyTalking,
    update
  };
}
