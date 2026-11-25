import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export function createAssetLoader() {
  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  gltfLoader.setDRACOLoader(dracoLoader);

  async function loadGlb(url) {
    try {
      const gltf = await gltfLoader.loadAsync(url);
      gltf.scene.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          if (node.material && node.material.isMeshStandardMaterial) {
            node.material.envMapIntensity = 1.0;
          }
        }
      });
      return { ok: true, gltf: gltf, error: null };
    } catch (error) {
      return { ok: false, gltf: null, error: error };
    }
  }

  function validateContract(gltf, contract) {
    const missingNodes = [];
    for (let i = 0; i < contract.requiredNodes.length; i++) {
      const nodeName = contract.requiredNodes[i];
      const found = gltf.scene.getObjectByName(nodeName);
      if (!found) {
        missingNodes.push(nodeName);
      }
    }

    let hasMasterClip = false;
    for (let i = 0; i < gltf.animations.length; i++) {
      if (gltf.animations[i].name === contract.masterClipName) {
        hasMasterClip = true;
        break;
      }
    }

    return {
      valid: missingNodes.length === 0 && hasMasterClip,
      missingNodes: missingNodes,
      hasMasterClip: hasMasterClip,
      clipNames: gltf.animations.map(function (clip) {
        return clip.name;
      })
    };
  }

  return {
    loadGlb,
    validateContract
  };
}
