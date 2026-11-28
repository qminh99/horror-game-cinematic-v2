import * as THREE from 'three';
import { NEIGHBORHOOD_CONTRACT } from '../config/contract.js';
import { buildFallbackNeighborhood } from './NeighborhoodFallbackBuilder.js';

export function createNeighborhoodWorld(scene) {
  let worldRoot = null;
  let sourceMode = 'none';

  const spawnPosition = new THREE.Vector3(0, 0.1, 5.2);
  let spawnYaw = 0;

  const walkMeshes = [];
  const colliderMeshes = [];
  const doors = [];
  const switches = [];

  function formatFriendlyName(rawName, prefix, fallbackPrefix) {
    const suffix = rawName.slice(prefix.length).replace(/_/g, ' ').trim();
    if (!suffix) {
      return fallbackPrefix;
    }
    if (suffix === '201') {
      return 'Phòng 201 (Minh)';
    }
    if (suffix === '202') {
      return 'Phòng 202 (Huy)';
    }
    if (/^[0-9]+$/.test(suffix)) {
      return fallbackPrefix + ' ' + suffix;
    }
    return suffix;
  }

  function clearWorld() {
    if (worldRoot) {
      scene.remove(worldRoot);
      worldRoot = null;
    }
    walkMeshes.length = 0;
    colliderMeshes.length = 0;
    doors.length = 0;
    switches.length = 0;
  }

  function indexWorld(root) {
    root.updateMatrixWorld(true);

    const spawnNode = root.getObjectByName(NEIGHBORHOOD_CONTRACT.spawnNodeName);
    if (spawnNode) {
      spawnNode.getWorldPosition(spawnPosition);
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      const quat = new THREE.Quaternion();
      spawnNode.getWorldQuaternion(quat);
      euler.setFromQuaternion(quat, 'YXZ');
      spawnYaw = euler.y;
    } else {
      spawnPosition.set(0, 0.1, 5.2);
      spawnYaw = 0;
    }

    const doorNodes = new Set();

    root.traverse(function (node) {
      if (!node.name) {
        return;
      }

      if (node.name.startsWith(NEIGHBORHOOD_CONTRACT.doorPrefix)) {
        doorNodes.add(node);
        const closedRotY = node.rotation.y;
        const openAngle = typeof node.userData.openAngle === 'number' ? node.userData.openAngle : Math.PI * 0.52;
        const label = node.userData.label || formatFriendlyName(node.name, NEIGHBORHOOD_CONTRACT.doorPrefix, 'Phòng');

        const meshes = [];
        node.traverse(function (child) {
          if (child.isMesh) {
            meshes.push(child);
          }
        });

        doors.push({
          type: 'door',
          node: node,
          meshes: meshes,
          colliderMesh: node.userData.colliderMesh || meshes[0] || null,
          label: label,
          closedRotY: closedRotY,
          openAngle: openAngle,
          isOpen: false,
          currentAngle: 0
        });
        return;
      }

      if (node.name.startsWith(NEIGHBORHOOD_CONTRACT.switchPrefix)) {
        const meshes = [];
        node.traverse(function (child) {
          if (child.isMesh) {
            meshes.push(child);
          }
        });
        const label = node.userData.label || ('Đèn ' + formatFriendlyName(node.name, NEIGHBORHOOD_CONTRACT.switchPrefix, 'Phòng'));
        const resolveTarget = (target) => typeof target === 'string' ? root.getObjectByName(target) : target;
        const targetLight = resolveTarget(node.userData.targetLight);
        const targetBulb = resolveTarget(node.userData.targetBulb);
        switches.push({
          type: 'switch',
          node: node,
          meshes: meshes,
          label: label,
          targetLight: targetLight || null,
          targetBulb: targetBulb || null,
          baseLightIntensity: targetLight ? targetLight.intensity : 0,
          isOn: node.userData.isOn !== undefined ? Boolean(node.userData.isOn) : true
        });
        return;
      }

      if (!node.isMesh) {
        return;
      }

      if (node.name.startsWith(NEIGHBORHOOD_CONTRACT.stairRampPrefix)) {
        node.visible = false;
        walkMeshes.push(node);
      } else if (node.name.startsWith(NEIGHBORHOOD_CONTRACT.walkPrefix)) {
        walkMeshes.push(node);
      }

      if (node.name.startsWith(NEIGHBORHOOD_CONTRACT.colliderPrefix)) {
        if (
          node.name.startsWith(NEIGHBORHOOD_CONTRACT.proxyColliderPrefix) ||
          node.name.startsWith(NEIGHBORHOOD_CONTRACT.boundColliderPrefix)
        ) {
          node.visible = false;
        }
        colliderMeshes.push(node);
      }
    });

    // Ensure every static collider & walkable mesh has an up-to-date cached world bounding box
    for (let i = 0; i < walkMeshes.length; i++) {
      walkMeshes[i].userData.worldBox = new THREE.Box3().setFromObject(walkMeshes[i]);
    }
    for (let i = 0; i < colliderMeshes.length; i++) {
      colliderMeshes[i].userData.worldBox = new THREE.Box3().setFromObject(colliderMeshes[i]);
    }
  }

  function attachGltf(gltf) {
    clearWorld();
    worldRoot = gltf.scene;
    worldRoot.visible = true;
    scene.add(worldRoot);
    sourceMode = 'glb';
    indexWorld(worldRoot);
    return getSummary();
  }

  function attachFallback() {
    clearWorld();
    worldRoot = buildFallbackNeighborhood();
    worldRoot.visible = true;
    scene.add(worldRoot);
    sourceMode = 'fallback';
    indexWorld(worldRoot);
    return getSummary();
  }

  function setVisible(visible) {
    if (worldRoot) {
      worldRoot.visible = Boolean(visible);
    }
  }

  function getZoneLabel(position) {
    const x = position.x;
    const y = position.y;
    const z = position.z;

    if (sourceMode === 'fallback') {
      const insideB1Footprint = x >= -7.5 && x <= 7.5 && z <= -8.3 && z >= -18.6;
      if (insideB1Footprint) {
        let floorNum = 1;
        if (y >= 5.5) {
          floorNum = 3;
        } else if (y >= 2.3) {
          floorNum = 2;
        }
        if (x < -1.9) {
          if (floorNum === 2) {
            return 'Tầng 2 · Phòng 201 (Minh)';
          }
          return 'Tầng ' + floorNum + ' · Phòng ' + floorNum + '01';
        }
        if (x > 1.9) {
          if (floorNum === 2) {
            return 'Tầng 2 · Phòng 202 (Huy)';
          }
          return 'Tầng ' + floorNum + ' · Phòng ' + floorNum + '02';
        }
        return 'Nhà tập thể B1 · Cầu thang Tầng ' + floorNum;
      }
      if (x >= -8.0 && x <= 8.0 && z < -4.0 && z > -8.3) {
        return 'Sân trước nhà tập thể B1';
      }
      if (z < -7.5 || z > 7.5) {
        return 'Ngõ nhỏ giữa các dãy nhà';
      }
      return 'Khu phố đêm · Ngõ 165';
    }

    if (y >= 5.2) {
      return 'Nhà tập thể B1 · Tầng 3';
    }
    if (y >= 2.1) {
      return 'Nhà tập thể B1 · Tầng 2';
    }
    return 'Khu phố Ngõ 165 · Nhà tập thể B1';
  }

  function getActiveDoorColliders() {
    const active = [];
    for (let i = 0; i < doors.length; i++) {
      if (!doors[i].isOpen && doors[i].colliderMesh) {
        active.push(doors[i].colliderMesh);
      }
    }
    return active;
  }

  function getSummary() {
    return {
      sourceMode: sourceMode,
      walkCount: walkMeshes.length,
      colliderCount: colliderMeshes.length,
      doorCount: doors.length,
      switchCount: switches.length
    };
  }

  return {
    attachGltf,
    attachFallback,
    setVisible,
    getSpawnPosition: function () {
      return spawnPosition.clone();
    },
    getSpawnYaw: function () {
      return spawnYaw;
    },
    getWalkMeshes: function () {
      return walkMeshes;
    },
    getColliderMeshes: function () {
      return colliderMeshes;
    },
    getActiveDoorColliders,
    getDoors: function () {
      return doors;
    },
    getSwitches: function () {
      return switches;
    },
    getZoneLabel,
    getSummary
  };
}
