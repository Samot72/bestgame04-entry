// Mahjong Garden's sound: every effect is synthesized with WebAudio — soft
// wooden clicks, chimes for a match, a small arpeggio for clearing the
// garden. No audio files. The context stays locked until the player's first
// key or click (browser policy), and M mutes.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;

  function unlock() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }

  function tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0 } = {}) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // A short filtered noise tick: the wooden clack of a tile.
  function clack(vol = 0.25, delay = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1900;
    filter.Q.value = 1.1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
  }

  return {
    unlock,
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    click() { clack(0.15); },
    select() { clack(0.3); tone(660, 0.05, { type: 'triangle', vol: 0.08 }); },
    invalid() { tone(140, 0.12, { type: 'square', vol: 0.07, slide: -40 }); },
    match(combo) {
      clack(0.3);
      clack(0.22, 0.05);
      const base = 520 + Math.min(combo, 5) * 70;
      tone(base, 0.1, { type: 'sine', vol: 0.16 });
      tone(base * 1.335, 0.12, { type: 'sine', vol: 0.14, delay: 0.06 });
      tone(base * 1.5, 0.16, { type: 'sine', vol: 0.12, delay: 0.12 });
    },
    hint() {
      tone(880, 0.09, { type: 'sine', vol: 0.14 });
      tone(880, 0.09, { type: 'sine', vol: 0.14, delay: 0.14 });
    },
    undo() { clack(0.2); tone(392, 0.09, { type: 'triangle', vol: 0.12, slide: -60 }); },
    shuffle() {
      clack(0.2);
      clack(0.24, 0.07);
      clack(0.2, 0.14);
      clack(0.26, 0.21);
      tone(523, 0.12, { type: 'triangle', vol: 0.1, delay: 0.2 });
    },
    deal() {
      for (let i = 0; i < 5; i += 1) clack(0.14 + i * 0.02, i * 0.05);
    },
    win() {
      const notes = [523, 659, 784, 1046, 784, 1046, 1318];
      notes.forEach((f, i) => tone(f, 0.22, { type: 'sine', vol: 0.16, delay: i * 0.11 }));
    },
    lose() {
      tone(392, 0.25, { type: 'triangle', vol: 0.14 });
      tone(330, 0.25, { type: 'triangle', vol: 0.14, delay: 0.18 });
      tone(262, 0.4, { type: 'triangle', vol: 0.14, delay: 0.36 });
    },
  };
}
