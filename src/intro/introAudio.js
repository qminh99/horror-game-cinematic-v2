import * as THREE from 'three';
import { AUDIO_PATHS } from '../config/contract.js';

export function createIntroAudio(camera) {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const audioLoader = new THREE.AudioLoader();
  const tracks = {};
  let fallbackCtx = null;

  function loadTrack(key, url, loop, volume) {
    return new Promise(function (resolve) {
      audioLoader.load(
        url,
        function (buffer) {
          const sound = new THREE.Audio(listener);
          sound.setBuffer(buffer);
          sound.setLoop(loop);
          sound.setVolume(volume);
          tracks[key] = sound;
          resolve({ key: key, ok: true });
        },
        undefined,
        function () {
          resolve({ key: key, ok: false });
        }
      );
    });
  }

  async function preloadAll() {
    const entries = [
      ['engineLoop', AUDIO_PATHS.engineLoop, true, 0.36],
      ['interiorRattle', AUDIO_PATHS.interiorRattle, true, 0.22],
      ['bagZipper', AUDIO_PATHS.bagZipper, false, 0.65],
      ['glassesClink', AUDIO_PATHS.glassesClink, false, 0.5],
      ['driverCall', AUDIO_PATHS.driverCall, false, 0.92],
      ['footsteps', AUDIO_PATHS.footsteps, false, 0.62],
      ['doorOpen', AUDIO_PATHS.doorOpen, false, 0.72],
      ['streetAmbience', AUDIO_PATHS.streetAmbience, true, 0.14],
      ['ambientPad', AUDIO_PATHS.ambientPad, true, 0.12]
    ];

    const results = [];
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      const res = await loadTrack(item[0], item[1], item[2], item[3]);
      results.push(res);
    }
    return results;
  }

  function startAmbience() {
    if (listener.context.state === 'suspended') {
      listener.context.resume();
    }
    const loops = ['engineLoop', 'interiorRattle', 'streetAmbience', 'ambientPad'];
    for (let i = 0; i < loops.length; i++) {
      const sound = tracks[loops[i]];
      if (sound && !sound.isPlaying) {
        sound.play();
      }
    }
  }

  function playCue(key) {
    const sound = tracks[key];
    if (sound) {
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
      return true;
    }
    return false;
  }

  function speakDriverFallback() {
    if (!('speechSynthesis' in window)) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('Tới nơi rồi, cháu xuống xe đi.');
      utterance.lang = 'vi-VN';
      utterance.rate = 0.92;
      utterance.pitch = 0.86;
      utterance.volume = 0.9;
      const voices = window.speechSynthesis.getVoices();
      for (let i = 0; i < voices.length; i++) {
        if (voices[i].lang && voices[i].lang.toLowerCase().startsWith('vi')) {
          utterance.voice = voices[i];
          break;
        }
      }
      window.speechSynthesis.speak(utterance);
    } catch (error) {
    }
  }

  function setStreetExteriorMix(exteriorFactor) {
    if (tracks.streetAmbience) {
      tracks.streetAmbience.setVolume(0.12 + 0.34 * exteriorFactor);
    }
    if (tracks.engineLoop) {
      tracks.engineLoop.setVolume(0.36 - 0.16 * exteriorFactor);
    }
  }

  function stopAll() {
    const keys = Object.keys(tracks);
    for (let i = 0; i < keys.length; i++) {
      const sound = tracks[keys[i]];
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
      }
    }
    if (fallbackCtx) {
      try {
        fallbackCtx.close();
      } catch (error) {
      }
      fallbackCtx = null;
    }
  }

  return {
    preloadAll,
    startAmbience,
    playCue,
    speakDriverFallback,
    setStreetExteriorMix,
    stopAll
  };
}
