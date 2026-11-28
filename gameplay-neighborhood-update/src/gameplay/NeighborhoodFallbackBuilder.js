import * as THREE from 'three';

function makeCanvasTexture(width, height, drawFn, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (repeatX !== 1 || repeatY !== 1) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
  }
  return texture;
}

export function buildFallbackNeighborhood() {
  const root = new THREE.Group();
  root.name = 'Neighborhood_Fallback_Root';

  const weatheredPlasterTex = makeCanvasTexture(512, 512, function (ctx, w, h) {
    ctx.fillStyle = '#9b835b';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4200; i++) {
      const x = (i * 97) % w;
      const y = (i * 173) % h;
      const sz = (i % 5) + 2;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(65,48,30,0.14)' : 'rgba(210,192,154,0.09)';
      ctx.fillRect(x, y, sz, sz);
    }

    for (let s = 0; s < 38; s++) {
      const sx = (s * 43 + 11) % w;
      const sy = (s * 67) % (h * 0.6);
      const len = 80 + (s * 29) % 190;
      const grad = ctx.createLinearGradient(sx, sy, sx, sy + len);
      grad.addColorStop(0, 'rgba(34,29,24,0.34)');
      grad.addColorStop(0.6, 'rgba(38,33,26,0.16)');
      grad.addColorStop(1, 'rgba(38,33,26,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, 4 + (s % 8), len);
    }

    const baseGrime = ctx.createLinearGradient(0, h * 0.72, 0, h);
    baseGrime.addColorStop(0, 'rgba(25,24,20,0)');
    baseGrime.addColorStop(1, 'rgba(24,23,19,0.52)');
    ctx.fillStyle = baseGrime;
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
  }, 2, 2);

  const neighborWallTex = makeCanvasTexture(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#736552';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(28,24,20,0.12)' : 'rgba(220,208,185,0.06)';
      ctx.fillRect((i * 53) % w, (i * 107) % h, 3, 2);
    }
    const grime = ctx.createLinearGradient(0, h * 0.7, 0, h);
    grime.addColorStop(0, 'rgba(18,18,16,0)');
    grime.addColorStop(1, 'rgba(18,18,16,0.48)');
    ctx.fillStyle = grime;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
  }, 2, 2);

  const asphaltTex = makeCanvasTexture(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#25272c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3600; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(175,180,190,0.07)' : 'rgba(8,10,14,0.22)';
      ctx.fillRect((i * 71) % w, (i * 139) % h, 2, 2);
    }
  }, 18, 3);

  const sidewalkTex = makeCanvasTexture(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#5a5650';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(24,22,20,0.38)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(20,18,16,0.08)' : 'rgba(220,215,200,0.06)';
      ctx.fillRect((i * 89) % w, (i * 47) % h, 2, 2);
    }
  }, 16, 2);

  const roomTileTex = makeCanvasTexture(256, 256, function (ctx, w, h) {
    ctx.fillStyle = '#9c9689';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(65,60,52,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= w; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
  }, 4, 6);

  const woodDoorTex = makeCanvasTexture(256, 512, function (ctx, w, h) {
    ctx.fillStyle = '#5a3b26';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 6) {
      ctx.fillStyle = x % 12 === 0 ? 'rgba(30,16,8,0.16)' : 'rgba(130,90,55,0.09)';
      ctx.fillRect(x, 0, 3, h);
    }
    ctx.strokeStyle = '#362114';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 26, w - 40, 190);
    ctx.strokeRect(20, 250, w - 40, 230);
  });

  const b1SignTex = makeCanvasTexture(256, 128, function (ctx, w, h) {
    ctx.fillStyle = '#6c4932';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c8b494';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = '#f3ece0';
    ctx.font = 'bold 74px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('B1', w / 2, h / 2 + 4);
  });

  const flyerTex = makeCanvasTexture(256, 360, function (ctx, w, h) {
    ctx.fillStyle = '#e8e0cf';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#a82822';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHO THUÊ', w / 2, 56);
    ctx.fillText('PHÒNG TRỌ', w / 2, 94);
    ctx.fillStyle = '#222428';
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText('Khu tập thể B1 - Ngõ 165', w / 2, 146);
    ctx.fillText('Phòng rộng, khép kín', w / 2, 182);
    ctx.fillText('Gần ĐHQG - Giao thông', w / 2, 214);
    ctx.fillStyle = '#8b2620';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('LH: 098x.xxx.165', w / 2, 276);
    ctx.strokeStyle = 'rgba(40,36,30,0.28)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, w - 20, h - 20);
  });

  const warmWindowTex = makeCanvasTexture(256, 256, function (ctx, w, h) {
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 18, w * 0.5, h * 0.5, w * 0.72);
    grad.addColorStop(0, '#ffe2a6');
    grad.addColorStop(0.55, '#dca55e');
    grad.addColorStop(1, '#8c5d2c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(65,38,16,0.22)';
    for (let x = 0; x < w; x += 26) {
      ctx.fillRect(x, 0, 8, h);
    }
    ctx.fillStyle = '#26211c';
    ctx.fillRect(w * 0.49, 0, 7, h);
    ctx.fillRect(0, h * 0.49, w, 7);
  });

  const glowTex = makeCanvasTexture(128, 128, function (ctx, w, h) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,228,175,0.92)');
    g.addColorStop(0.35, 'rgba(255,196,120,0.42)');
    g.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  const mat = function (color, roughness, extra) {
    return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: roughness }, extra || {}));
  };

  const b1ExteriorMat = mat(0xffffff, 0.9, { map: weatheredPlasterTex, bumpMap: weatheredPlasterTex, bumpScale: 0.03 });
  const b1InteriorWallMat = mat(0xc7c3b7, 0.88);
  const b1HallWallMat = mat(0x9a9483, 0.9, { map: weatheredPlasterTex });
  const concreteMat = mat(0x6d6a63, 0.92, { map: sidewalkTex });
  const concreteDarkMat = mat(0x4b4945, 0.94);
  const roomFloorMat = mat(0xffffff, 0.72, { map: roomTileTex });
  const asphaltMat = mat(0xffffff, 0.84, { map: asphaltTex });
  const sidewalkMat = mat(0xffffff, 0.9, { map: sidewalkTex });
  const alleyGroundMat = mat(0x474542, 0.94, { map: sidewalkTex });
  const neighborWallMat = mat(0xffffff, 0.9, { map: neighborWallTex });
  const neighborAltMat = mat(0x8e8373, 0.9, { map: neighborWallTex });
  const ironMat = mat(0x23262b, 0.55, { metalness: 0.65 });
  const metalLightMat = mat(0x98a0a8, 0.42, { metalness: 0.55 });
  const awningMat = mat(0x28433b, 0.7, { metalness: 0.3 });
  const woodDoorMat = mat(0xffffff, 0.68, { map: woodDoorTex });
  const furnitureWoodMat = mat(0x523929, 0.62);
  const bedSheetMat = mat(0x2b4b56, 0.88);
  const warmGlassMat = mat(0xffffff, 0.35, { map: warmWindowTex, emissive: 0xffb85e, emissiveMap: warmWindowTex, emissiveIntensity: 0.92 });
  const dimGlassMat = mat(0x3a434a, 0.3, { emissive: 0x20272d, emissiveIntensity: 0.15 });
  const tubeLightMat = mat(0xfff4dd, 0.25, { emissive: 0xffe5b8, emissiveIntensity: 1.5 });
  const streetBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe4aa });
  const foliageDarkMat = mat(0x18251e, 0.94);
  const barkMat = mat(0x362c24, 0.94);
  const invisibleMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0, depthWrite: false });
  const clothDarkMat = mat(0x1b1e24, 0.92);
  const clothBlueMat = mat(0x243448, 0.9);
  const clearGlassMat = mat(0x8fa4b0, 0.18, { transparent: true, opacity: 0.22, depthWrite: false });

  function addBox(parent, material, x, y, z, w, h, d, name) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    if (name) {
      mesh.name = name;
    }
    parent.add(mesh);
    return mesh;
  }

  function addGlow(parent, x, y, z, size, colorHex, opacity) {
    const sm = new THREE.SpriteMaterial({
      map: glowTex,
      color: colorHex,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(sm);
    sprite.position.set(x, y, z);
    sprite.scale.set(size, size, 1);
    parent.add(sprite);
    return sprite;
  }

  function addTree(parent, x, z, scale, idx) {
    const g = new THREE.Group();
    g.position.set(x, 0.1, z);
    parent.add(g);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * scale, 0.17 * scale, 2.7 * scale, 8), barkMat);
    trunk.position.y = 1.35 * scale;
    trunk.name = 'COL_Tree_' + idx;
    g.add(trunk);
    const blobs = [
      [0, 3.1, 0, 1.35, 1.15, 1.3],
      [0.75, 2.8, 0.4, 0.92, 0.82, 0.9],
      [-0.72, 2.9, -0.35, 0.95, 0.84, 0.92],
      [0.15, 3.7, -0.4, 0.85, 0.72, 0.85]
    ];
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), foliageDarkMat);
      foliage.position.set(b[0] * scale, b[1] * scale, b[2] * scale);
      foliage.scale.set(b[3] * scale, b[4] * scale, b[5] * scale);
      g.add(foliage);
    }
  }

  function addStreetLamp(parent, x, z, facingSign) {
    const g = new THREE.Group();
    g.position.set(x, 0.1, z);
    parent.add(g);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 5.2, 8), ironMat);
    pole.position.y = 2.6;
    pole.name = 'COL_LampPole_' + Math.round(x) + '_' + Math.round(z);
    g.add(pole);
    addBox(g, ironMat, 0, 5.15, facingSign * 0.65, 0.07, 0.07, 1.3);
    addBox(g, ironMat, 0, 5.1, facingSign * 1.25, 0.28, 0.1, 0.48);
    addBox(g, streetBulbMat, 0, 5.03, facingSign * 1.25, 0.22, 0.03, 0.36);
    addGlow(g, 0, 4.95, facingSign * 1.25, 3.2, 0xffd088, 0.72);
  }

  function addWireCurve(parent, p1, p2, sag) {
    const mid = new THREE.Vector3(
      (p1[0] + p2[0]) * 0.5,
      (p1[1] + p2[1]) * 0.5 - sag,
      (p1[2] + p2[2]) * 0.5
    );
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1[0], p1[1], p1[2]),
      mid,
      new THREE.Vector3(p2[0], p2[1], p2[2])
    );
    const geo = new THREE.TubeGeometry(curve, 14, 0.012, 4, false);
    parent.add(new THREE.Mesh(geo, ironMat));
  }

  function addChuongCop(parent, x, y, z, w, h, d, hasClothes) {
    const cage = new THREE.Group();
    cage.position.set(x, y, z);
    parent.add(cage);
    addBox(cage, ironMat, 0, -h / 2, d / 2, w, 0.04, d);
    addBox(cage, ironMat, 0, h / 2, d / 2, w, 0.04, d);
    const step = 0.24;
    for (let bx = -w / 2; bx <= w / 2 + 0.01; bx += step) {
      addBox(cage, ironMat, bx, 0, d, 0.02, h, 0.02);
    }
    for (let by = -h / 2 + 0.35; by < h / 2; by += 0.42) {
      addBox(cage, ironMat, 0, by, d, w, 0.02, 0.02);
    }
    for (const sx of [-w / 2, w / 2]) {
      for (let bz = 0.2; bz < d; bz += 0.24) {
        addBox(cage, ironMat, sx, 0, bz, 0.02, h, 0.02);
      }
    }
    if (hasClothes) {
      addBox(cage, clothDarkMat, -w * 0.18, 0.05, d * 0.52, 0.42, 0.58, 0.06);
      addBox(cage, clothBlueMat, w * 0.16, -0.02, d * 0.55, 0.34, 0.64, 0.06);
    }
  }

  function addAcUnit(parent, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    addBox(g, mat(0xc8c3b6, 0.78), 0, 0, 0, 0.78, 0.54, 0.32);
    const grill = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 14), ironMat);
    grill.rotation.x = Math.PI / 2;
    grill.position.set(-0.12, 0, 0.16);
    g.add(grill);
  }

  const spawnEmpty = new THREE.Object3D();
  spawnEmpty.name = 'SPAWN_Player';
  spawnEmpty.position.set(0, 0.1, 5.2);
  spawnEmpty.rotation.y = 0;
  root.add(spawnEmpty);

  // Street, sidewalks, and walkable alleys between houses
  addBox(root, asphaltMat, 0, -0.05, 0, 92, 0.1, 8.0, 'WALK_Road');
  for (let x = -40; x <= 40; x += 6) {
    addBox(root, mat(0xa8a392, 0.8), x, 0.005, 0, 2.4, 0.01, 0.14);
  }
  addBox(root, sidewalkMat, 0, 0.05, -5.8, 92, 0.1, 3.6, 'WALK_Sidewalk_North');
  addBox(root, sidewalkMat, 0, 0.05, 5.8, 92, 0.1, 3.6, 'WALK_Sidewalk_South');

  // North courtyard and alleys around Building B1 and neighboring houses
  addBox(root, alleyGroundMat, 0, 0.05, -15.8, 92, 0.1, 16.4, 'WALK_Alley_North');
  addBox(root, alleyGroundMat, 0, 0.05, 11.6, 92, 0.1, 8.0, 'WALK_Alley_South');

  // Street lights and trees
  for (let i = 0; i < 6; i++) {
    const x = -35 + i * 14;
    addStreetLamp(root, x, -4.4, 1);
    addStreetLamp(root, x + 7, 4.4, -1);
    if (Math.abs(x + 3.5) > 5.5) {
      addTree(root, x + 3.5, -5.0, 0.95 + (i % 2) * 0.12, i * 2);
    }
    addTree(root, x + 2.0, 5.0, 0.9 + (i % 3) * 0.1, i * 2 + 1);
  }

  // Strategic low-budget street lights (3 warm point lights for the whole street)
  for (const lx of [-21, 0, 21]) {
    const sl = new THREE.PointLight(0xffcb80, 26, 26, 1.65);
    sl.position.set(lx, 4.7, 0.5);
    root.add(sl);
  }

  // =========================================================================
  // BUILDING B1 — MAIN ENTERABLE 3-STORY COLLECTIVE HOUSE (x in [-7.5, 7.5], z in [-18.5, -8.5])
  // =========================================================================
  const b1 = new THREE.Group();
  b1.name = 'Building_B1';
  root.add(b1);

  const floorHeights = [0.3, 3.5, 6.7];
  const floorStep = 3.2;

  // Front entrance steps (z: -7.5 -> -8.5, rising from 0.10 -> 0.30)
  addBox(b1, concreteMat, 0, 0.15, -7.85, 3.5, 0.1, 0.55, 'WALK_B1_Step_1');
  addBox(b1, concreteMat, 0, 0.25, -8.25, 3.5, 0.1, 0.5, 'WALK_B1_Step_2');
  addBox(b1, concreteDarkMat, -1.85, 0.55, -8.0, 0.22, 0.9, 1.15, 'COL_B1_EntryWall_L');
  addBox(b1, concreteDarkMat, 1.85, 0.55, -8.0, 0.22, 0.9, 1.15, 'COL_B1_EntryWall_R');

  // B1 Sign plaque above Floor 1 entrance
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.58, 0.08), [
    concreteDarkMat, concreteDarkMat, concreteDarkMat, concreteDarkMat,
    mat(0xffffff, 0.65, { map: b1SignTex }), concreteDarkMat
  ]);
  signMesh.position.set(0, 3.52, -8.42);
  b1.add(signMesh);

  // 3 "CHO THUÊ PHÒNG TRỌ" paper flyers on the front-left ground wall
  const flyerPositions = [
    [-2.75, 1.68, -8.38, 0.05],
    [-3.22, 1.54, -8.38, -0.07],
    [-2.42, 1.46, -8.38, 0.03]
  ];
  for (let i = 0; i < flyerPositions.length; i++) {
    const fp = flyerPositions[i];
    const flyer = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.44),
      mat(0xffffff, 0.88, { map: flyerTex })
    );
    flyer.position.set(fp[0], fp[1], fp[2]);
    flyer.rotation.z = fp[3];
    b1.add(flyer);
  }

  // 3 Electric meter boxes on front-right ground wall
  for (let m = 0; m < 3; m++) {
    const mx = 2.45 + m * 0.44;
    addBox(b1, mat(0xb8b4a8, 0.72), mx, 1.72, -8.36, 0.3, 0.42, 0.16);
    addBox(b1, ironMat, mx, 1.76, -8.27, 0.14, 0.1, 0.02);
    addBox(b1, metalLightMat, mx, 1.12, -8.4, 0.035, 0.85, 0.035);
  }

  // Vertical PVC pipes & corrugated awnings on Floor 1
  for (const px of [-2.12, 2.12, -7.25, 7.25]) {
    addBox(b1, mat(0x9a9c9e, 0.55), px, 5.1, -8.4, 0.09, 9.6, 0.09);
  }
  for (const ax of [-4.7, 4.7]) {
    const awning = addBox(b1, awningMat, ax, 3.12, -7.85, 4.4, 0.06, 1.15);
    awning.rotation.x = 0.22;
  }

  // Parked motorbike + potted plants in front of B1 (left side)
  const bike = new THREE.Group();
  bike.position.set(-4.3, 0.1, -7.55);
  bike.rotation.y = 0.26;
  b1.add(bike);
  addBox(bike, mat(0x283240, 0.45, { metalness: 0.35 }), 0, 0.58, 0, 1.45, 0.44, 0.46, 'COL_B1_Motorbike');
  addBox(bike, ironMat, -0.15, 0.82, 0, 0.68, 0.14, 0.32);
  addBox(bike, metalLightMat, 0.56, 1.0, 0, 0.08, 0.42, 0.58);
  for (const bx of [-0.52, 0.54]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.12, 12), ironMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(bx, 0.25, 0);
    bike.add(wheel);
  }
  for (const px of [-2.35, -2.9]) {
    addBox(b1, mat(0x63402c, 0.85), px, 0.28, -7.85, 0.34, 0.36, 0.34);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), foliageDarkMat);
    bush.position.set(px, 0.62, -7.85);
    b1.add(bush);
  }

  // AC units placed asymmetrically on facade
  addAcUnit(b1, -6.55, 2.35, -8.28);
  addAcUnit(b1, 6.48, 2.52, -8.28);
  addAcUnit(b1, -6.45, 5.55, -8.28);
  addAcUnit(b1, 6.52, 5.25, -8.28);
  addAcUnit(b1, -6.58, 8.75, -8.28);
  addAcUnit(b1, 6.42, 8.5, -8.28);

  // Overhead power lines across B1 facade
  for (let w = 0; w < 4; w++) {
    const wy = 7.6 + w * 0.28;
    addWireCurve(b1, [-12, wy, -7.8], [12, wy - 0.15, -7.9], 0.48 + w * 0.06);
  }

  // Outer perimeter walls (West, East, Back of B1 across all 3 floors)
  const totalHeight = 9.9;
  addBox(b1, b1ExteriorMat, -7.5, totalHeight / 2, -13.5, 0.24, totalHeight, 10.2, 'COL_B1_Wall_West');
  addBox(b1, b1ExteriorMat, 7.5, totalHeight / 2, -13.5, 0.24, totalHeight, 10.2, 'COL_B1_Wall_East');
  addBox(b1, b1ExteriorMat, 0, totalHeight / 2, -18.5, 15.2, totalHeight, 0.24, 'COL_B1_Wall_Back');
  addBox(b1, concreteDarkMat, 0, totalHeight + 0.15, -13.5, 15.6, 0.3, 10.6, 'COL_B1_Roof');

  // Helper to build a single wing wall with a front window cutout
  function buildFrontFacadeWing(floorIdx, sideSign, floorY) {
    const wingCenterX = sideSign * 4.7;
    const z = -8.5;
    const winW = 2.6;
    const winH = 1.45;
    const winBottom = floorY + 0.92;
    const winTop = winBottom + winH;
    const wallTop = floorY + floorStep;

    // Below window
    addBox(b1, b1ExteriorMat, wingCenterX, floorY + 0.46, z, 5.4, 0.92, 0.22, 'COL_B1_FrontLow_F' + (floorIdx + 1) + '_' + sideSign);
    // Above window
    addBox(b1, b1ExteriorMat, wingCenterX, (winTop + wallTop) / 2, z, 5.4, wallTop - winTop, 0.22);
    // Left & right pillars beside window
    const pillarW = (5.4 - winW) / 2;
    addBox(b1, b1ExteriorMat, wingCenterX - (winW / 2 + pillarW / 2), winBottom + winH / 2, z, pillarW, winH, 0.22, 'COL_B1_FrontPilL_F' + (floorIdx + 1) + '_' + sideSign);
    addBox(b1, b1ExteriorMat, wingCenterX + (winW / 2 + pillarW / 2), winBottom + winH / 2, z, pillarW, winH, 0.22, 'COL_B1_FrontPilR_F' + (floorIdx + 1) + '_' + sideSign);

    // Window glass & frame (Floor 2 rooms have clear glass so you see inside + warm light; others warm curtain glow)
    const isClear = floorIdx === 1;
    addBox(b1, isClear ? clearGlassMat : (floorIdx === 0 && sideSign < 0 ? warmGlassMat : (floorIdx === 2 && sideSign > 0 ? warmGlassMat : dimGlassMat)), wingCenterX, winBottom + winH / 2, z, winW, winH, 0.04, 'COL_B1_WinGlass_F' + (floorIdx + 1) + '_' + sideSign);
    addBox(b1, ironMat, wingCenterX, winBottom + winH / 2, z + 0.04, 0.05, winH, 0.05);
    addBox(b1, ironMat, wingCenterX, winBottom, z + 0.06, winW + 0.14, 0.08, 0.18);

    // Chuong cop iron cage on Floor 2 & Floor 3
    if (floorIdx >= 1) {
      addChuongCop(b1, wingCenterX, winBottom + winH / 2, z + 0.08, winW + 0.28, winH + 0.22, 0.52, true);
    }
  }

  // Helper to build interior partition wall between central stairwell (x = +-1.9) and room, with doorway at z in [-10.2, -9.05]
  function buildStairPartition(floorIdx, sideSign, floorY) {
    const x = sideSign * 1.9;
    const doorMinZ = -10.22;
    const doorMaxZ = -9.06;
    const doorH = 2.24;
    const wallTop = floorY + floorStep;

    // Front jamb (z: -9.06 -> -8.5)
    addBox(b1, b1HallWallMat, x, floorY + floorStep / 2, (-8.5 + doorMaxZ) / 2, 0.18, floorStep, Math.abs(-8.5 - doorMaxZ), 'COL_B1_PartFront_F' + (floorIdx + 1) + '_' + sideSign);
    // Back wall behind doorway (z: -18.5 -> -10.22)
    addBox(b1, b1HallWallMat, x, floorY + floorStep / 2, (-18.5 + doorMinZ) / 2, 0.18, floorStep, Math.abs(doorMinZ - (-18.5)), 'COL_B1_PartBack_F' + (floorIdx + 1) + '_' + sideSign);
    // Transom above doorway
    addBox(b1, b1HallWallMat, x, floorY + doorH + (wallTop - (floorY + doorH)) / 2, (doorMinZ + doorMaxZ) / 2, 0.18, wallTop - (floorY + doorH), doorMaxZ - doorMinZ);

    // Interactive hinged door
    const roomNum = (floorIdx + 1) * 100 + (sideSign < 0 ? 1 : 2);
    const doorPivot = new THREE.Group();
    doorPivot.name = 'INTERACT_Door_' + roomNum;
    // Hinge sits on the z = doorMinZ edge; opens inward into the room
    doorPivot.position.set(x, floorY, doorMinZ);
    doorPivot.userData.openAngle = sideSign < 0 ? -Math.PI * 0.52 : Math.PI * 0.52;
    doorPivot.userData.label = roomNum === 201 ? 'Phòng 201 (Minh)' : (roomNum === 202 ? 'Phòng 202 (Huy)' : 'Phòng ' + roomNum);
    b1.add(doorPivot);

    const doorWidth = doorMaxZ - doorMinZ - 0.04;
    const leaf = addBox(doorPivot, woodDoorMat, 0, doorH / 2, doorWidth / 2 + 0.02, 0.08, doorH - 0.04, doorWidth, 'DoorLeaf_' + roomNum);
    // Brass handle
    addBox(doorPivot, metalLightMat, -sideSign * 0.06, 1.05, doorWidth - 0.12, 0.05, 0.14, 0.04);
    addBox(doorPivot, metalLightMat, sideSign * 0.06, 1.05, doorWidth - 0.12, 0.05, 0.14, 0.04);
    doorPivot.userData.colliderMesh = leaf;

    // Room ceiling light + interactive wall switch just inside the doorway
    const roomCenterX = sideSign * 4.7;
    const bulb = addBox(b1, tubeLightMat.clone(), roomCenterX, floorY + floorStep - 0.14, -13.2, 0.18, 0.06, 1.1);
    let roomLight = null;
    if (floorIdx === 1) {
      roomLight = new THREE.PointLight(0xffdca8, 18, 12, 1.7);
      roomLight.position.set(roomCenterX, floorY + floorStep - 0.4, -12.6);
      b1.add(roomLight);
    }

    const switchGroup = new THREE.Group();
    switchGroup.name = 'INTERACT_Switch_' + roomNum;
    switchGroup.position.set(x + sideSign * 0.11, floorY + 1.25, -10.55);
    switchGroup.userData.label = 'Đèn ' + doorPivot.userData.label;
    switchGroup.userData.targetLight = roomLight;
    switchGroup.userData.targetBulb = bulb;
    switchGroup.userData.isOn = true;
    b1.add(switchGroup);
    addBox(switchGroup, mat(0xdcd8ce, 0.4), 0, 0, 0, 0.03, 0.16, 0.11);
    addBox(switchGroup, mat(0x52eb85, 0.3, { emissive: 0x2ecc71, emissiveIntensity: 1.0 }), sideSign * 0.02, -0.04, 0, 0.015, 0.02, 0.03);
  }

  // Build all 3 floors of Building B1
  for (let f = 0; f < floorHeights.length; f++) {
    const fy = floorHeights[f];

    // Left & Right room floors
    addBox(b1, roomFloorMat, -4.7, fy - 0.08, -13.5, 5.6, 0.16, 10.0, 'WALK_Floor_F' + (f + 1) + '_L');
    addBox(b1, roomFloorMat, 4.7, fy - 0.08, -13.5, 5.6, 0.16, 10.0, 'WALK_Floor_F' + (f + 1) + '_R');

    // Central stairwell front landing (z: -8.5 -> -10.9)
    addBox(b1, concreteMat, 0, fy - 0.08, -9.7, 3.8, 0.16, 2.4, 'WALK_Hall_F' + (f + 1));

    // Front stairwell ceiling fluorescent tube
    addBox(b1, tubeLightMat, 0, fy + floorStep - 0.16, -9.15, 0.92, 0.05, 0.12);
    addGlow(b1, 0, fy + floorStep - 0.22, -9.15, 1.7, 0xffe4b8, 0.48);

    // 1 shared warm PointLight per floor in the stairwell (total 3 lights for entire B1 core)
    const stairLight = new THREE.PointLight(0xffdca0, 14, 11, 1.7);
    stairLight.position.set(0, fy + floorStep - 0.42, -9.6);
    b1.add(stairLight);

    // Front balcony parapet on Floor 2 & Floor 3
    if (f >= 1) {
      addBox(b1, b1ExteriorMat, 0, fy + 0.52, -8.52, 3.8, 1.04, 0.2, 'COL_B1_Parapet_F' + (f + 1));
    }

    // Exterior front wings & interior partitions + doors
    buildFrontFacadeWing(f, -1, fy);
    buildFrontFacadeWing(f, 1, fy);
    buildStairPartition(f, -1, fy);
    buildStairPartition(f, 1, fy);

    // Concrete switchback stairs from Floor f -> Floor f + 1
    if (f < floorHeights.length - 1) {
      const midY = fy + floorStep / 2;
      const numSteps = 10;
      const runLen = 4.6;
      const startZ = -10.9;
      const endZ = startZ - runLen;

      // Flight A (Left side: x in [-1.8, -0.08], going deeper -Z from fy -> midY)
      for (let s = 0; s < numSteps; s++) {
        const sy = fy + ((s + 0.5) / numSteps) * (floorStep / 2);
        const sz = startZ - ((s + 0.5) / numSteps) * runLen;
        addBox(b1, concreteMat, -0.94, sy - 0.08, sz, 1.72, 0.18, runLen / numSteps + 0.04);
      }
      // Smooth invisible ramp for Flight A
      const rampLen = Math.hypot(runLen, floorStep / 2);
      const rampAngle = Math.atan2(floorStep / 2, runLen);
      const rampA = addBox(b1, invisibleMat, -0.94, fy + floorStep / 4, (startZ + endZ) / 2, 1.74, 0.08, rampLen, 'WALK_StairRamp_F' + (f + 1) + '_A');
      rampA.rotation.x = rampAngle;

      // Mid landing (z: -15.5 -> -18.3, full width x in [-1.8, +1.8])
      addBox(b1, concreteMat, 0, midY - 0.08, -16.95, 3.64, 0.16, 2.9, 'WALK_MidLand_F' + (f + 1));

      // Center divider wall between Flight A and Flight B
      addBox(b1, concreteDarkMat, 0, midY, (startZ + endZ) / 2, 0.16, floorStep, runLen, 'COL_StairDivider_F' + (f + 1));

      // Flight B (Right side: x in [+0.08, +1.8], coming back forward +Z from midY -> fy + floorStep)
      for (let s = 0; s < numSteps; s++) {
        const sy = midY + ((s + 0.5) / numSteps) * (floorStep / 2);
        const sz = endZ + ((s + 0.5) / numSteps) * runLen;
        addBox(b1, concreteMat, 0.94, sy - 0.08, sz, 1.72, 0.18, runLen / numSteps + 0.04);
      }
      const rampB = addBox(b1, invisibleMat, 0.94, midY + floorStep / 4, (startZ + endZ) / 2, 1.74, 0.08, rampLen, 'WALK_StairRamp_F' + (f + 1) + '_B');
      rampB.rotation.x = -rampAngle;
    } else {
      // Floor 3 back stairwell floor closed off cleanly
      addBox(b1, concreteMat, 0, fy - 0.08, -14.7, 3.64, 0.16, 7.6, 'WALK_Hall_F3_Back');
    }
  }

  // Basic recognizable furniture inside Room 201 (Minh) & Room 202 (Huy) on Floor 2 (y = 3.5)
  const f2y = floorHeights[1];
  // Room 201 (Minh, x in [-7.3, -2.0])
  addBox(b1, furnitureWoodMat, -6.2, f2y + 0.28, -15.5, 1.85, 0.36, 2.2, 'COL_Bed_201');
  addBox(b1, bedSheetMat, -6.2, f2y + 0.5, -15.5, 1.78, 0.16, 2.12);
  addBox(b1, furnitureWoodMat, -3.2, f2y + 0.78, -17.6, 1.65, 0.08, 0.75, 'COL_Desk_201');
  addBox(b1, ironMat, -3.2, f2y + 0.98, -17.75, 0.52, 0.34, 0.04);
  addBox(b1, furnitureWoodMat, -6.65, f2y + 1.15, -10.8, 0.9, 2.3, 1.5, 'COL_Wardrobe_201');

  // Room 202 (Huy, x in [+2.0, +7.3])
  addBox(b1, furnitureWoodMat, 6.2, f2y + 0.28, -15.5, 1.85, 0.36, 2.2, 'COL_Bed_202');
  addBox(b1, mat(0x526e75, 0.88), 6.2, f2y + 0.5, -15.5, 1.78, 0.16, 2.12);
  addBox(b1, furnitureWoodMat, 3.5, f2y + 0.78, -17.6, 1.85, 0.08, 0.8, 'COL_Desk_202');
  addBox(b1, mat(0x38d8c9, 0.3, { emissive: 0x1a8f8f, emissiveIntensity: 0.75 }), 3.5, f2y + 1.0, -17.76, 0.58, 0.36, 0.03);

  // =========================================================================
  // NEIGHBORING HOUSES (NON-ENTERABLE SHELLS WITH WALKABLE ALLEYS BETWEEN THEM)
  // =========================================================================
  function addNeighborBlock(id, cx, cz, w, h, d, wallMat, litSeed) {
    const g = new THREE.Group();
    g.name = 'Neighbor_' + id;
    root.add(g);

    addBox(g, wallMat, cx, h / 2 + 0.05, cz, w, h, d, 'COL_Neighbor_' + id);
    addBox(g, concreteDarkMat, cx, h + 0.16, cz, w + 0.35, 0.24, d + 0.35);

    const faceSign = cz < 0 ? 1 : -1;
    const faceZ = cz + faceSign * (d / 2 + 0.04);
    const floors = Math.max(2, Math.round(h / 3.2));
    const cols = Math.max(2, Math.floor(w / 3.6));

    // Closed ground-floor iron gate / shuttered door
    addBox(g, ironMat, cx, 1.25, faceZ, 1.65, 2.35, 0.08);
    const awning = addBox(g, awningMat, cx, 2.65, faceZ + faceSign * 0.45, w * 0.62, 0.06, 0.95);
    awning.rotation.x = faceSign * 0.2;

    for (let fl = 0; fl < floors; fl++) {
      const wy = 1.6 + fl * 3.1;
      for (let c = 0; c < cols; c++) {
        if (fl === 0 && Math.abs(c - (cols - 1) / 2) < 0.6) {
          continue;
        }
        const wx = cx - (w * 0.34) + (cols > 1 ? (c / (cols - 1)) * (w * 0.68) : 0);
        const lit = ((fl * 7 + c * 13 + litSeed) % 3) === 0;
        addBox(g, lit ? warmGlassMat : dimGlassMat, wx, wy, faceZ, 1.35, 1.15, 0.06);
        addBox(g, ironMat, wx, wy - 0.6, faceZ + faceSign * 0.05, 1.48, 0.08, 0.14);
      }
    }
  }

  // North side neighbors (leaving walkable 4m alleys on West x in [-11.5,-7.5] and East x in [7.5,11.5], plus back alley z in [-23.5,-18.8])
  addNeighborBlock('B2_West', -19.0, -13.5, 15.0, 9.6, 10.0, neighborWallMat, 1);
  addNeighborBlock('B3_East', 19.0, -13.5, 15.0, 9.6, 10.0, neighborAltMat, 2);
  addNeighborBlock('NorthFar_W', -36.5, -13.5, 13.0, 8.8, 10.0, neighborAltMat, 3);
  addNeighborBlock('NorthFar_E', 36.5, -13.5, 13.0, 9.2, 10.0, neighborWallMat, 4);

  // South side neighbors across the street (with walkable alleys between blocks!)
  addNeighborBlock('South_1', -32.0, 12.2, 15.0, 8.6, 8.8, neighborWallMat, 5);
  addNeighborBlock('South_2', -12.5, 12.2, 14.5, 9.4, 8.8, neighborAltMat, 6);
  addNeighborBlock('South_3', 8.5, 12.2, 15.5, 8.8, 8.8, neighborWallMat, 7);
  addNeighborBlock('South_4', 29.0, 12.2, 16.0, 9.2, 8.8, neighborAltMat, 8);

  // Natural road barriers & invisible world boundaries
  for (const endX of [-44.5, 44.5]) {
    addBox(root, mat(0x523b2b, 0.8), endX, 1.1, 0, 0.35, 2.2, 16.0, 'COL_Bound_StreetEnd_' + (endX < 0 ? 'W' : 'E'));
    addBox(root, mat(0xd8a634, 0.6), endX + (endX < 0 ? 0.2 : -0.2), 1.05, 0, 0.08, 0.28, 7.6);
  }
  addBox(root, invisibleMat, 0, 3.0, -23.8, 92, 6.0, 0.5, 'COL_Bound_NorthBack');
  addBox(root, invisibleMat, 0, 3.0, 15.6, 92, 6.0, 0.5, 'COL_Bound_SouthBack');
  addBox(root, invisibleMat, -45.5, 3.0, 0, 0.5, 6.0, 42, 'COL_Bound_West');
  addBox(root, invisibleMat, 45.5, 3.0, 0, 0.5, 6.0, 42, 'COL_Bound_East');

  // Atmospheric night lighting
  const hemi = new THREE.HemisphereLight(0x88a4c8, 0x262420, 0.78);
  root.add(hemi);
  const moon = new THREE.DirectionalLight(0x9ab8dc, 0.65);
  moon.position.set(16, 26, 18);
  root.add(moon);

  return root;
}
