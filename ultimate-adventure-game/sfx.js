// Lightweight 8-bit SFX engine (no external assets)
(function(){
  const Ctx = {
    ctx: null,
    master: null,
    noiseBuf: null,
    gain: 0.8,
  };
  function ensureCtx(){
    if (!Ctx.ctx) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const master = ctx.createGain();
      master.gain.value = Ctx.gain;
      master.connect(ctx.destination);
      Ctx.ctx = ctx; Ctx.master = master;
      // build noise buffer
      const len = ctx.sampleRate * 1.5; // 1.5s
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i=0; i<len; i++) data[i] = Math.random()*2-1;
      Ctx.noiseBuf = buf;
    }
    return Ctx.ctx;
  }
  function autoUnlock(){
    const resume = ()=>{ try{ ensureCtx().resume(); }catch(e){} cleanup(); };
    const cleanup = ()=>{
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('touchstart', resume);
      window.removeEventListener('keydown', resume);
    };
    window.addEventListener('pointerdown', resume, { passive:true, once:true });
    window.addEventListener('touchstart', resume, { passive:true, once:true });
    window.addEventListener('keydown', resume, { passive:true, once:true });
  }

  function now(){ return ensureCtx().currentTime; }
  function gainEnv(duration=0.2, a=0.005, d=0.06, s=0.35, r=0.08){
    const ctx = ensureCtx();
    const g = ctx.createGain();
    const t = now();
    const end = t + duration;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, s), t + a + d);
    g.gain.exponentialRampToValueAtTime(0.0001, end + r);
    return { g, startTime: t, endTime: end + r };
  }
  function osc(type, freq, duration, envOpts){
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, now());
    const { g, endTime } = gainEnv(duration, ...(envOpts||[]));
    o.connect(g); g.connect(Ctx.master);
    o.start(); o.stop(endTime);
    return o;
  }
  function pitchSlide(type, fStart, fEnd, duration, envOpts){
    const ctx = ensureCtx();
    const o = ctx.createOscillator();
    o.type = type;
    const t = now();
    o.frequency.setValueAtTime(fStart, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, fEnd), t + duration);
    const { g, endTime } = gainEnv(duration, ...(envOpts||[]));
    o.connect(g); g.connect(Ctx.master);
    o.start(); o.stop(endTime);
    return o;
  }
  function noise(duration, { type='bandpass', freq=1800, q=0.6 }={}){
    const ctx = ensureCtx();
    const src = ctx.createBufferSource(); src.buffer = Ctx.noiseBuf;
    const filt = ctx.createBiquadFilter();
    filt.type = type; filt.frequency.value = freq; filt.Q.value = q;
    const { g, endTime } = gainEnv(duration, 0.002, 0.05, 0.2, 0.08);
    src.connect(filt); filt.connect(g); g.connect(Ctx.master);
    src.start(); src.stop(endTime);
    return src;
  }
  function chord(freqs, type='square', dur=0.18){
    freqs.forEach((f,i)=>{ osc(type, f, dur*(1- i*0.1)); });
  }
  function midi(n){ return 440 * Math.pow(2, (n-69)/12); }

  const Sfx = {
    setVolume(v){ Ctx.gain = Math.max(0, Math.min(1, v)); if (Ctx.master) Ctx.master.gain.value = Ctx.gain; },
    resume(){ try{ ensureCtx().resume(); }catch(e){} },
    play(name){
      try { ensureCtx(); } catch(e) { return; }
      switch(name){
        case 'menu': osc('triangle', 880, 0.05); break;
        case 'shoot': pitchSlide('square', 1600, 1200, 0.08); break;
        case 'minigun': pitchSlide('square', 1400+Math.random()*200, 1000+Math.random()*120, 0.05); break;
        case 'sniper': pitchSlide('triangle', 2000, 500, 0.16); break;
        case 'laser': pitchSlide('sawtooth', 1800, 900, 0.12); break;
        case 'web': osc('square', 600, 0.06); break;
        case 'bazooka': osc('square', 220, 0.22, [0.004,0.06,0.3,0.14]); break;
        case 'plane': pitchSlide('square', 1300, 1100, 0.06); break;
        case 'explosion_small': (noise(0.18,{type:'lowpass',freq:900,q:0.7}), osc('square', 110, 0.12)); break;
        case 'explosion_big': (noise(0.38,{type:'lowpass',freq:700,q:0.8}), osc('square', 90, 0.22)); break;
        case 'nuke': (noise(1.2,{type:'lowpass',freq:500,q:0.9}), osc('sine', 70, 0.9, [0.006,0.2,0.2,0.4])); break;
        case 'coin': chord([midi(88), midi(92), midi(95)], 'square', 0.16); break;
        case 'pickup': chord([midi(76), midi(83), midi(88)], 'triangle', 0.22); break;
        case 'jump': (osc('square', 660, 0.08), noise(0.06,{type:'highpass',freq:1200,q:0.4})); break;
        case 'land': osc('sine', 120, 0.06, [0.004,0.04,0.25,0.06]); break;
        case 'hit': (noise(0.08,{type:'bandpass',freq:900,q:0.7}), osc('square', 220, 0.06)); break;
        case 'death': pitchSlide('triangle', 800, 100, 0.6, [0.004,0.2,0.2,0.4]); break;
        case 'spawn': pitchSlide('triangle', 500, 900, 0.24); break;
        default: break;
      }
    }
  };

  autoUnlock();
  window.Sfx = Sfx;
  window.playSfx = function(name){ try { window.Sfx && window.Sfx.play(name); } catch(e){} };
})();
