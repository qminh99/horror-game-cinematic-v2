import * as THREE from 'three';

export function createFirstPersonController(camera, domElement, neighborhoodWorld) {
  const EYE_HEIGHT = 1.62;
  const PLAYER_RADIUS = 0.34;
  const WALK_SPEED = 2.85;
  const SPRINT_SPEED = 4.65;
  const JUMP_SPEED = 5.2;
  const GRAVITY = 14.5;
  const MAX_STEP_UP = 0.56;

  let enabled = false;
  let pointerLocked = false;
  let dragging = false;

  const footPos = new THREE.Vector3(0, 0.1, 5.2);
  let yaw = 0;
  let pitch = 0;
  let velY = 0;
  let isGrounded = true;
  let headBobPhase = 0;
  let stepAccumulator = 0;

  const keys = {};
  const raycaster = new THREE.Raycaster();
  const downDir = new THREE.Vector3(0, -1, 0);
  const upDir = new THREE.Vector3(0, 1, 0);
  const probeOrigin = new THREE.Vector3();
  const probeDir = new THREE.Vector3();
  const queryBox = new THREE.Box3();
  const queryMin = new THREE.Vector3();
  const queryMax = new THREE.Vector3();

  let audioCtx = null;

  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function () {});
      }
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return;
    }
    try {
      audioCtx = new Ctx();
    } catch (err) {
      audioCtx = null;
    }
  }

  function playFootstep(indoors) {
    if (!audioCtx || audioCtx.state !== 'running') {
      return;
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(indoors ? 115 : 88, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  function normalizeKey(e) {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      return e.code;
    }
    const known = [
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'Space',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
    ];
    if (known.indexOf(e.code) !== -1) {
      return e.code;
    }
    const k = (e.key || '').toLowerCase();
    if (k === 'w' || k === 'ư') {
      return 'KeyW';
    }
    if (k === 'a') {
      return 'KeyA';
    }
    if (k === 's') {
      return 'KeyS';
    }
    if (k === 'd' || k === 'đ') {
      return 'KeyD';
    }
    if (k === 'e' || k === 'ê') {
      return 'KeyE';
    }
    return e.code;
  }

  function requestPointerLock() {
    if (!domElement || !domElement.requestPointerLock) {
      return;
    }
    try {
      const res = domElement.requestPointerLock();
      if (res && typeof res.catch === 'function') {
        res.catch(function () {});
      }
    } catch (err) {
    }
  }

  function exitPointerLock() {
    if (document.pointerLockElement && document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch (err) {
      }
    }
  }

  function collectNearbyMeshes(sourceList, cx, cy, cz, padXZ, padYLow, padYHigh) {
    queryMin.set(cx - padXZ, cy - padYLow, cz - padXZ);
    queryMax.set(cx + padXZ, cy + padYHigh, cz + padXZ);
    queryBox.set(queryMin, queryMax);

    const nearby = [];
    for (let i = 0; i < sourceList.length; i++) {
      const mesh = sourceList[i];
      const box = mesh.userData.worldBox;
      if (!box || box.intersectsBox(queryBox)) {
        nearby.push(mesh);
      }
    }
    return nearby;
  }

  function isBlockedAt(nx, ny, nz, moveDirX, moveDirZ) {
    const staticCols = collectNearbyMeshes(
      neighborhoodWorld.getColliderMeshes(),
      nx, ny, nz, 1.4, 0.2, 2.0
    );
    const activeDoors = neighborhoodWorld.getActiveDoorColliders();
    const candidates = activeDoors.length > 0 ? staticCols.concat(activeDoors) : staticCols;
    if (candidates.length === 0) {
      return false;
    }

    const heights = [ny + 0.52, ny + 1.28];
    const dirs = [
      [moveDirX, moveDirZ],
      [moveDirX * 0.707 - moveDirZ * 0.707, moveDirX * 0.707 + moveDirZ * 0.707],
      [moveDirX * 0.707 + moveDirZ * 0.707, -moveDirX * 0.707 + moveDirZ * 0.707],
      [-moveDirZ, moveDirX],
      [moveDirZ, -moveDirX]
    ];

    raycaster.near = 0.01;
    raycaster.far = PLAYER_RADIUS + 0.06;

    for (let h = 0; h < heights.length; h++) {
      probeOrigin.set(nx, heights[h], nz);
      for (let d = 0; d < dirs.length; d++) {
        probeDir.set(dirs[d][0], 0, dirs[d][1]);
        const len = probeDir.length();
        if (len < 0.001) {
          continue;
        }
        probeDir.divideScalar(len);
        raycaster.set(probeOrigin, probeDir);
        const hits = raycaster.intersectObjects(candidates, false);
        if (hits.length > 0 && hits[0].distance <= PLAYER_RADIUS) {
          return true;
        }
      }
    }
    return false;
  }

  function sampleFloorY(x, currentY, z, maxDrop) {
    const walkCandidates = collectNearbyMeshes(
      neighborhoodWorld.getWalkMeshes(),
      x, currentY, z, 1.0, maxDrop + 1.0, MAX_STEP_UP + 0.6
    );
    if (walkCandidates.length === 0) {
      return null;
    }
    probeOrigin.set(x, currentY + MAX_STEP_UP, z);
    raycaster.near = 0.01;
    raycaster.far = MAX_STEP_UP + maxDrop;
    raycaster.set(probeOrigin, downDir);
    const hits = raycaster.intersectObjects(walkCandidates, false);
    if (hits.length === 0) {
      return null;
    }
    return hits[0].point.y;
  }

  function hasCeilingAbove(x, currentY, z) {
    const staticCols = collectNearbyMeshes(
      neighborhoodWorld.getColliderMeshes(),
      x, currentY, z, 0.8, 0.0, 2.2
    );
    const walkCols = collectNearbyMeshes(
      neighborhoodWorld.getWalkMeshes(),
      x, currentY, z, 0.8, 0.0, 2.2
    );
    const candidates = staticCols.concat(walkCols);
    if (candidates.length === 0) {
      return false;
    }
    probeOrigin.set(x, currentY + 1.4, z);
    raycaster.near = 0.01;
    raycaster.far = 0.5;
    raycaster.set(probeOrigin, upDir);
    const hits = raycaster.intersectObjects(candidates, false);
    return hits.length > 0;
  }

  function syncCamera(bobOffset) {
    camera.position.set(footPos.x, footPos.y + EYE_HEIGHT + bobOffset, footPos.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch, yaw, 0);
  }

  function resetToSpawn() {
    footPos.copy(neighborhoodWorld.getSpawnPosition());
    yaw = neighborhoodWorld.getSpawnYaw();
    pitch = -0.02;
    velY = 0;
    isGrounded = true;
    headBobPhase = 0;
    stepAccumulator = 0;
    const groundedY = sampleFloorY(footPos.x, footPos.y, footPos.z, 2.0);
    if (groundedY !== null) {
      footPos.y = groundedY;
    }
    camera.fov = 68;
    camera.updateProjectionMatrix();
    syncCamera(0);
  }

  function setEnabled(active) {
    enabled = Boolean(active);
    if (!enabled) {
      dragging = false;
      const kList = Object.keys(keys);
      for (let i = 0; i < kList.length; i++) {
        keys[kList[i]] = false;
      }
      exitPointerLock();
    } else {
      ensureAudio();
      camera.fov = 68;
      camera.updateProjectionMatrix();
    }
  }

  let onLockChangeCallback = null;

  document.addEventListener('pointerlockchange', function () {
    pointerLocked = document.pointerLockElement === domElement;
    if (typeof onLockChangeCallback === 'function') {
      onLockChangeCallback(pointerLocked);
    }
  });

  domElement.addEventListener('mousedown', function (e) {
    if (!enabled) {
      return;
    }
    ensureAudio();
    if (e.button === 0) {
      dragging = true;
      if (!pointerLocked) {
        requestPointerLock();
      }
    }
  });

  window.addEventListener('mouseup', function () {
    dragging = false;
  });

  document.addEventListener('mousemove', function (e) {
    if (!enabled) {
      return;
    }
    if (pointerLocked || dragging) {
      yaw -= e.movementX * 0.0021;
      pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.0018, -1.32, 1.32);
    }
  });

  window.addEventListener('keydown', function (e) {
    if (!enabled) {
      return;
    }
    const code = normalizeKey(e);
    keys[code] = true;
    if (code === 'Space') {
      e.preventDefault();
      if (isGrounded) {
        velY = JUMP_SPEED;
        isGrounded = false;
      }
    } else if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(code) !== -1) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', function (e) {
    keys[normalizeKey(e)] = false;
  });

  window.addEventListener('blur', function () {
    dragging = false;
    const kList = Object.keys(keys);
    for (let i = 0; i < kList.length; i++) {
      keys[kList[i]] = false;
    }
  });

  function update(dt) {
    if (!enabled) {
      return;
    }

    const forward = ((keys.KeyW || keys.ArrowUp) ? 1 : 0) - ((keys.KeyS || keys.ArrowDown) ? 1 : 0);
    const strafe = ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0);

    let movedDist = 0;
    const sprinting = Boolean(keys.ShiftLeft || keys.ShiftRight);

    if (forward !== 0 || strafe !== 0) {
      const len = Math.hypot(forward, strafe);
      const nf = forward / len;
      const ns = strafe / len;
      const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;

      const sinY = Math.sin(yaw);
      const cosY = Math.cos(yaw);
      const vx = (-sinY * nf + cosY * ns) * speed;
      const vz = (-cosY * nf - sinY * ns) * speed;

      const subSteps = dt > 0.03 ? 2 : 1;
      const subDt = dt / subSteps;

      for (let s = 0; s < subSteps; s++) {
        const dx = vx * subDt;
        const dz = vz * subDt;

        if (Math.abs(dx) > 1e-6) {
          const nextX = footPos.x + dx;
          if (!isBlockedAt(nextX, footPos.y, footPos.z, Math.sign(dx), 0)) {
            footPos.x = nextX;
            movedDist += Math.abs(dx);
          }
        }

        if (Math.abs(dz) > 1e-6) {
          const nextZ = footPos.z + dz;
          if (!isBlockedAt(footPos.x, footPos.y, nextZ, 0, Math.sign(dz))) {
            footPos.z = nextZ;
            movedDist += Math.abs(dz);
          }
        }
      }
    }

    if (isGrounded) {
      const floorY = sampleFloorY(footPos.x, footPos.y, footPos.z, 0.72);
      if (floorY !== null) {
        footPos.y = THREE.MathUtils.damp(footPos.y, floorY, 22, dt);
      } else {
        isGrounded = false;
      }
    } else {
      velY -= GRAVITY * dt;
      if (velY > 0 && hasCeilingAbove(footPos.x, footPos.y, footPos.z)) {
        velY = 0;
      }
      footPos.y += velY * dt;
      const floorY = sampleFloorY(footPos.x, footPos.y, footPos.z, 3.0);
      if (floorY !== null && footPos.y <= floorY + 0.04 && velY <= 0) {
        footPos.y = floorY;
        velY = 0;
        isGrounded = true;
      } else if (footPos.y < -10) {
        resetToSpawn();
      }
    }

    let bobOffset = 0;
    if (isGrounded && movedDist > 0.001) {
      const bobSpeed = sprinting ? 12.5 : 8.8;
      headBobPhase += dt * bobSpeed;
      bobOffset = Math.sin(headBobPhase) * (sprinting ? 0.036 : 0.022);
      stepAccumulator += movedDist;
      const stepStride = sprinting ? 1.85 : 1.45;
      if (stepAccumulator >= stepStride) {
        stepAccumulator = 0;
        const indoors = footPos.z < -8.2 && Math.abs(footPos.x) < 7.6;
        playFootstep(indoors);
      }
    } else {
      headBobPhase = 0;
    }

    syncCamera(bobOffset);
  }

  return {
    resetToSpawn,
    setEnabled,
    requestPointerLock,
    exitPointerLock,
    isPointerLocked: function () {
      return pointerLocked;
    },
    onPointerLockChange: function (cb) {
      onLockChangeCallback = cb;
    },
    getPosition: function () {
      return footPos;
    },
    update
  };
}
