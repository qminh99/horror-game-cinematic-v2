export const GAME_CONFIG = {
  playIntroOnStart: false,
  enableBloomByDefault: true
};

export const ASSET_PATHS = {
  neighborhoodWorld: '/assets/models/neighborhood_world.glb',
  introMaster: '/assets/models/intro_master.glb',
  huyRoommate: '/assets/models/huy_roommate.glb',
  vnuJacket: '/assets/models/vnu_jacket.glb',
  fpGameplayHands: '/assets/models/fp_gameplay_hands.glb',
  nightHdri: '/assets/hdri/night_street_1k.hdr'
};

export const NEIGHBORHOOD_CONTRACT = {
  spawnNodeName: 'SPAWN_Player',
  walkPrefix: 'WALK_',
  stairRampPrefix: 'WALK_StairRamp_',
  colliderPrefix: 'COL_',
  proxyColliderPrefix: 'COL_Proxy_',
  boundColliderPrefix: 'COL_Bound_',
  doorPrefix: 'INTERACT_Door_',
  switchPrefix: 'INTERACT_Switch_',
  zonePrefix: 'ZONE_'
};

export const INTRO_CONTRACT = {
  durationSeconds: 40.5,
  fps: 24,
  cameraNodeName: 'Head_Cam',
  masterClipName: 'Intro_Master_40s',
  requiredNodes: [
    'Head_Cam',
    'FP_Arms_Rig',
    'Bus_Interior',
    'Bus_Driver',
    'Bus_Door_Front',
    'Bus_Door_Rear',
    'Prop_Pouch',
    'Prop_Glasses',
    'Prop_Backpack',
    'Street_Boarding_House'
  ],
  ceilingLightMeshPrefix: 'CeilingLight_Emissive_',
  ceilingLightPointPrefix: 'CeilingLight_Point_',
  flickerIntervalSeconds: 8.0,
  flickerDurationSeconds: 0.16,
  flickerDepth: 0.34,
  timings: {
    wakeOpenStart: 0.0,
    wakeOpenEnd: 1.55,
    glassesOnStart: 13.55,
    glassesOnEnd: 15.35,
    driverCallTime: 16.0,
    driverCallDuration: 3.6,
    doorOpenTime: 31.3,
    fadeOutStart: 39.75,
    fadeOutEnd: 40.5
  }
};

export const AUDIO_PATHS = {
  engineLoop: '/assets/audio/bus_engine_loop.mp3',
  interiorRattle: '/assets/audio/bus_interior_rattle.mp3',
  bagZipper: '/assets/audio/bag_zipper_rustle.mp3',
  glassesClink: '/assets/audio/glasses_clink.mp3',
  driverCall: '/assets/audio/driver_call.mp3',
  footsteps: '/assets/audio/footsteps_bus.mp3',
  doorOpen: '/assets/audio/bus_door_pneumatic.mp3',
  streetAmbience: '/assets/audio/night_street_ambience.mp3',
  ambientPad: '/assets/audio/ambient_pad_low.mp3'
};
