import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import dracoDecoderJs from 'three/examples/jsm/libs/draco/gltf/draco_decoder.js?url';
import dracoDecoderWasm from 'three/examples/jsm/libs/draco/gltf/draco_decoder.wasm?url';
import dracoWasmWrapper from 'three/examples/jsm/libs/draco/gltf/draco_wasm_wrapper.js?url';

const DRACO_FILES = new Map([
  ['draco_decoder.js', dracoDecoderJs],
  ['draco_decoder.wasm', dracoDecoderWasm],
  ['draco_wasm_wrapper.js', dracoWasmWrapper]
]);

export function createAssetLoader() {
  const gltfLoader = new GLTFLoader();
  const dracoManager = new THREE.LoadingManager();
  dracoManager.setURLModifier(function (url) {
    const mapped = DRACO_FILES.get(url);
    return mapped !== undefined ? mapped : url;
  });
  const dracoLoader = new DRACOLoader(dracoManager);
  gltfLoader.setDRACOLoader(dracoLoader);

  function optimizeMaterial(material) {
    if (!material) {
      return false;
    }
    let convertedGlass = false;
    if (typeof material.transmission === 'number' && material.transmission > 0) {
      material.transmission = 0;
      material.thickness = 0;
      material.transparent = true;
      if (material.opacity >= 0.95) {
        material.opacity = 0.22;
      }
      material.depthWrite = false;
      convertedGlass = true;
    }
    if (material.isMeshStandardMaterial) {
      material.envMapIntensity = 0.85;
    }
    return convertedGlass;
  }

  async function loadGlb(url) {
    try {
      const gltf = await gltfLoader.loadAsync(url);
      let meshCount = 0;
      let lightCount = 0;
      let triangleCount = 0;
      let glassConvertedCount = 0;

      gltf.scene.traverse(function (node) {
        if (node.isMesh) {
          meshCount += 1;
          node.castShadow = false;
          node.receiveShadow = false;
          if (node.geometry) {
            if (node.geometry.index) {
              triangleCount += Math.floor(node.geometry.index.count / 3);
            } else if (node.geometry.attributes && node.geometry.attributes.position) {
              triangleCount += Math.floor(node.geometry.attributes.position.count / 3);
            }
          }
          if (Array.isArray(node.material)) {
            for (let i = 0; i < node.material.length; i++) {
              if (optimizeMaterial(node.material[i])) {
                glassConvertedCount += 1;
              }
            }
          } else {
            if (optimizeMaterial(node.material)) {
              glassConvertedCount += 1;
            }
          }
        } else if (node.isLight) {
          lightCount += 1;
          node.castShadow = false;
        }
      });

      const stats = {
        meshes: meshCount,
        triangles: triangleCount,
        lights: lightCount,
        glassTransmissionDisabled: glassConvertedCount
      };
      console.log('[GLB STATS]', url, stats);

      return { ok: true, gltf: gltf, stats: stats, error: null };
    } catch (error) {
      return { ok: false, gltf: null, stats: null, error: error };
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

  function validateNeighborhoodContract(gltf, contract) {
    const hasSpawn = Boolean(gltf.scene.getObjectByName(contract.spawnNodeName));
    let walkCount = 0;
    let rampCount = 0;
    let colliderCount = 0;
    let doorCount = 0;
    let switchCount = 0;

    gltf.scene.traverse(function (node) {
      if (!node.name) {
        return;
      }
      if (node.name.startsWith(contract.stairRampPrefix)) {
        rampCount += 1;
        walkCount += 1;
      } else if (node.name.startsWith(contract.walkPrefix)) {
        walkCount += 1;
      }
      if (node.name.startsWith(contract.colliderPrefix)) {
        colliderCount += 1;
      }
      if (node.name.startsWith(contract.doorPrefix)) {
        doorCount += 1;
      }
      if (node.name.startsWith(contract.switchPrefix)) {
        switchCount += 1;
      }
    });

    return {
      valid: hasSpawn && walkCount > 0 && colliderCount > 0,
      hasSpawn: hasSpawn,
      walkCount: walkCount,
      rampCount: rampCount,
      colliderCount: colliderCount,
      doorCount: doorCount,
      switchCount: switchCount
    };
  }

  return {
    loadGlb,
    validateContract,
    validateNeighborhoodContract
  };
}
