import { elements } from "./dom.js";
import { t } from "./i18n.js";

const STORAGE_KEY = "music-enabled";

function createTrack(src, volume) {
  if (typeof Audio === "undefined") {
    return null;
  }

  const audio = new Audio(src);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = volume;
  return audio;
}

function createEffect(src, { volume = 1, playbackRate = 1 } = {}) {
  if (typeof Audio === "undefined") {
    return null;
  }

  const audio = new Audio(src);
  audio.preload = "auto";
  return {
    src: audio.src || src,
    volume,
    playbackRate
  };
}

const tracks = {
  lobby: createTrack("./audio/ost00.mp3", 0.34),
  game: createTrack("./audio/ost01.mp3", 0.3),
  bossPrep: createTrack("./audio/ost02.mp3", 0.34)
};

const effects = {
  pickup: createEffect("./audio/dr1.mp3", { volume: 0.72 }),
  special: createEffect("./audio/dr2.mp3", { volume: 0.82 }),
  damage: createEffect("./audio/dr1.mp3", { volume: 0.8, playbackRate: 0.78 })
};

let unlocked = false;
let enabled = true;
let desiredTrackKey = "lobby";
let currentTrackKey = null;
let initialized = false;
const activeEffects = new Set();

function cleanupEffect(audio) {
  activeEffects.delete(audio);
}

function applyEffectPlayback(audio, effect) {
  audio.preload = "auto";
  audio.volume = effect.volume;
  audio.playbackRate = effect.playbackRate;

  if ("preservesPitch" in audio) {
    audio.preservesPitch = false;
  }

  if ("mozPreservesPitch" in audio) {
    audio.mozPreservesPitch = false;
  }

  if ("webkitPreservesPitch" in audio) {
    audio.webkitPreservesPitch = false;
  }
}

function pauseAllTracks() {
  for (const track of Object.values(tracks)) {
    if (!track) {
      continue;
    }

    track.pause();
  }

  currentTrackKey = null;
}

function updateMusicToggleButton() {
  const label = enabled ? t("audio.off") : t("audio.on");
  [elements.musicToggleButton, elements.settingsMusicToggleButton].forEach((button) => {
    if (!button) {
      return;
    }

    button.textContent = label;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(enabled));
  });
}

function rememberPreference() {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, String(enabled));
}

function getTrack(trackKey) {
  return tracks[trackKey] || null;
}

async function playDesiredTrack() {
  if (!enabled || !unlocked) {
    pauseAllTracks();
    return;
  }

  const nextTrack = getTrack(desiredTrackKey);
  if (!nextTrack) {
    pauseAllTracks();
    return;
  }

  if (currentTrackKey !== desiredTrackKey) {
    for (const [trackKey, track] of Object.entries(tracks)) {
      if (!track) {
        continue;
      }

      if (trackKey !== desiredTrackKey) {
        track.pause();
        track.currentTime = 0;
      }
    }

    nextTrack.currentTime = 0;
    currentTrackKey = desiredTrackKey;
  }

  try {
    await nextTrack.play();
  } catch {
    unlocked = false;
    currentTrackKey = null;
  }
}

function unlockAudio() {
  if (unlocked) {
    return;
  }

  unlocked = true;
  void playDesiredTrack();
}

function bindUnlockEvents() {
  if (typeof window === "undefined") {
    return;
  }

  const onceOptions = { once: true, passive: true };
  window.addEventListener("pointerdown", unlockAudio, onceOptions);
  window.addEventListener("touchstart", unlockAudio, onceOptions);
  window.addEventListener("keydown", unlockAudio, { once: true });
}

export function initAudio() {
  if (initialized) {
    return;
  }

  initialized = true;

  if (typeof localStorage !== "undefined") {
    enabled = localStorage.getItem(STORAGE_KEY) !== "false";
  }

  updateMusicToggleButton();
  bindUnlockEvents();

  if (typeof window !== "undefined") {
    window.addEventListener("langchange", updateMusicToggleButton);
  }
}

export function toggleMusic() {
  unlockAudio();
  enabled = !enabled;
  rememberPreference();
  updateMusicToggleButton();

  if (!enabled) {
    pauseAllTracks();
    return;
  }

  void playDesiredTrack();
}

export function playLobbyMusic() {
  desiredTrackKey = "lobby";
  void playDesiredTrack();
}

export function playGameMusic() {
  desiredTrackKey = "game";
  void playDesiredTrack();
}

export function playBossPrepMusic() {
  desiredTrackKey = "bossPrep";
  void playDesiredTrack();
}

export function playItemSoundEffect(effectKey) {
  unlockAudio();

  if (typeof Audio === "undefined" || !unlocked) {
    return;
  }

  const effect = effects[effectKey];
  if (!effect) {
    return;
  }

  const audio = new Audio(effect.src);
  applyEffectPlayback(audio, effect);
  audio.addEventListener("ended", () => cleanupEffect(audio), { once: true });
  audio.addEventListener("error", () => cleanupEffect(audio), { once: true });
  activeEffects.add(audio);

  void audio.play().catch(() => {
    cleanupEffect(audio);
  });
}
