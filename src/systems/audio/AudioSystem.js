const BGM_BY_AGE = {
  classic:    'assets/audio/classic.m4a',
  egypt:      'assets/audio/egypt.m4a',
  medieval:   'assets/audio/medieval.m4a',
  industrial: 'assets/audio/industrial.m4a',
  china:      'assets/audio/china.m4a',
  global:     'assets/audio/global.m4a',
  space:      'assets/audio/space.m4a',
  stone:      'assets/audio/stone.m4a',
};

const SFX_SRCS = {
  move:     'assets/audio/move.m4a',
  merge:    'assets/audio/match.m4a',
  button:   'assets/audio/button.m4a',
  popup:    'assets/audio/popup.m4a',
  undo:     'assets/audio/rewind_short.m4a',
  wonder:   'assets/audio/makewonder.m4a',
  wonder2:  'assets/audio/makewonder_2.m4a',
  scoreUp:  'assets/audio/score_up.m4a',
  broom:    'assets/audio/broom.m4a',
};

class AudioManager {
  constructor() {
    this._bgm = null;
    this._bgmAge = null;
    this._muted = false;
    this._pool = {}; // name -> Audio[]
  }

  setMuted(v) {
    this._muted = v;
    if (this._bgm) this._bgm.muted = v;
  }

  _releaseBGM() {
    if (this._bgm) {
      this._bgm.pause();
      this._bgm.removeAttribute('src');
      this._bgm.load(); // forces WebKit to release the media decoder
      this._bgm = null;
    }
  }

  playBGM(age) {
    const src = BGM_BY_AGE[age];
    if (!src || this._bgmAge === age) return;
    this._bgmAge = age;
    this._releaseBGM();
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.35;
    audio.muted = this._muted;
    audio.play().catch(() => {});
    this._bgm = audio;
  }

  stopBGM() {
    this._releaseBGM();
    this._bgmAge = null;
  }

  // Pre-create Audio elements so first playSfx() doesn't freeze on audio init.
  // Call this after the board is visible — not at startup.
  preloadSfx() {
    for (const [name, src] of Object.entries(SFX_SRCS)) {
      if (!this._pool[name]) {
        const a = new Audio(src);
        a.volume = 0.65;
        this._pool[name] = [a];
      }
    }
  }

  playSfx(name) {
    if (this._muted) return;
    const src = SFX_SRCS[name];
    if (!src) return;
    if (!this._pool[name]) this._pool[name] = [];
    const pool = this._pool[name];
    let a = pool.find(x => x.paused || x.ended);
    if (!a) {
      if (pool.length >= 3) {
        a = pool[0];
        a.pause();
        a.currentTime = 0;
      } else {
        a = new Audio(src);
        a.volume = 0.65;
        pool.push(a);
      }
    }
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

export const audioManager = new AudioManager();
