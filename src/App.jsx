import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  TERRITORIES, NEUTRAL_LABELS, SHOP,
  GENERIC_HEADLINES, CONQUEST_MESSAGES, DEFENSE_HEADLINES,
  EVENTS, TICKER_HEADLINES, ISRAEL_MESSAGES,
  VICTORY_JOKES, DEFEAT_JOKES,
  getTitle, pickRandom, randInt, createInitialTerritories,
} from './data'

// ============================================================
// WARISK.FUN — "How America Sees the World"
// State machine: MENU → GAME → VICTORY
// ============================================================

// Short names for shop buttons on mobile
const SHOP_SHORT = {
  shield:       'Shield',
  drone:        'Drone',
  missile:      'Missile',
  nuke:         'Nuke',
  un_resolution:'UN Res.',
}

// ----------------------------------------------------------
// SOUND ENGINE — procedural sounds via Web Audio API
// ----------------------------------------------------------
const SFX = (() => {
  let ctx = null
  const getCtx = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  const play = (fn) => {
    try { fn(getCtx()) } catch {}
  }

  return {
    click: () => play(c => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sine'; o.frequency.value = 800
      g.gain.setValueAtTime(0.08, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.08)
      const o2 = c.createOscillator(), g2 = c.createGain()
      o2.type = 'triangle'; o2.frequency.value = 2400
      g2.gain.setValueAtTime(0.03, c.currentTime)
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05)
      o2.connect(g2).connect(c.destination); o2.start(); o2.stop(c.currentTime + 0.05)
    }),
    money: () => play(c => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sine'; o.frequency.setValueAtTime(600, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.12)
      g.gain.setValueAtTime(0.08, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.2)
      const o2 = c.createOscillator(), g2 = c.createGain()
      o2.type = 'sine'; o2.frequency.value = 2400
      g2.gain.setValueAtTime(0.04, c.currentTime + 0.05)
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)
      o2.connect(g2).connect(c.destination); o2.start(c.currentTime + 0.05); o2.stop(c.currentTime + 0.25)
      const o3 = c.createOscillator(), g3 = c.createGain()
      o3.type = 'sine'; o3.frequency.value = 3600
      g3.gain.setValueAtTime(0.02, c.currentTime + 0.08)
      g3.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
      o3.connect(g3).connect(c.destination); o3.start(c.currentTime + 0.08); o3.stop(c.currentTime + 0.3)
    }),
    explosion: () => play(c => {
      const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2)
      const s = c.createBufferSource(), g = c.createGain()
      s.buffer = buf; g.gain.setValueAtTime(0.15, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
      s.connect(g).connect(c.destination); s.start()
      const boom = c.createOscillator(), bg = c.createGain()
      boom.type = 'sine'; boom.frequency.setValueAtTime(80, c.currentTime)
      boom.frequency.exponentialRampToValueAtTime(30, c.currentTime + 0.3)
      bg.gain.setValueAtTime(0.12, c.currentTime)
      bg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35)
      boom.connect(bg).connect(c.destination); boom.start(); boom.stop(c.currentTime + 0.35)
      const dbuf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate)
      const dd = dbuf.getChannelData(0)
      for (let i = 0; i < dd.length; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / dd.length, 3)
      const ds = c.createBufferSource(), dg = c.createGain(), df = c.createBiquadFilter()
      ds.buffer = dbuf; df.type = 'highpass'; df.frequency.value = 2000
      dg.gain.setValueAtTime(0.06, c.currentTime + 0.2)
      dg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
      ds.connect(df).connect(dg).connect(c.destination); ds.start(c.currentTime + 0.2)
    }),
    nuke: () => play(c => {
      const buf = c.createBuffer(1, c.sampleRate * 1.2, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5)
      const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter()
      s.buffer = buf; f.type = 'lowpass'; f.frequency.setValueAtTime(2000, c.currentTime)
      f.frequency.exponentialRampToValueAtTime(60, c.currentTime + 1.0)
      g.gain.setValueAtTime(0.2, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2)
      s.connect(f).connect(g).connect(c.destination); s.start()
      const sub = c.createOscillator(), sg = c.createGain()
      sub.type = 'sine'; sub.frequency.value = 35
      sg.gain.setValueAtTime(0.15, c.currentTime)
      sg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.0)
      sub.connect(sg).connect(c.destination); sub.start(); sub.stop(c.currentTime + 1.0)
      const hum = c.createOscillator(), hg = c.createGain()
      hum.type = 'sawtooth'; hum.frequency.value = 60
      hg.gain.setValueAtTime(0, c.currentTime + 0.6)
      hg.gain.linearRampToValueAtTime(0.04, c.currentTime + 0.8)
      hg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.5)
      hum.connect(hg).connect(c.destination); hum.start(c.currentTime + 0.6); hum.stop(c.currentTime + 1.5)
    }),
    victory: () => play(c => {
      const notes = [523, 659, 784, 1047]
      notes.forEach((freq, i) => {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'sawtooth'; o.frequency.value = freq
        const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2500
        g.gain.setValueAtTime(0.05, c.currentTime + i * 0.15)
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.15 + 0.4)
        o.connect(fl).connect(g).connect(c.destination)
        o.start(c.currentTime + i * 0.15); o.stop(c.currentTime + i * 0.15 + 0.4)
      })
      ;[659, 784, 1047].forEach(freq => {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'sine'; o.frequency.value = freq
        g.gain.setValueAtTime(0.03, c.currentTime + 0.6)
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.2)
        o.connect(g).connect(c.destination); o.start(c.currentTime + 0.6); o.stop(c.currentTime + 1.2)
      })
      const buf = c.createBuffer(1, c.sampleRate * 0.8, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3 * (1 - Math.pow(i / data.length, 0.5))
      const bs = c.createBufferSource(), bg = c.createGain(), bf = c.createBiquadFilter()
      bs.buffer = buf; bf.type = 'bandpass'; bf.frequency.value = 1200; bf.Q.value = 0.3
      bg.gain.setValueAtTime(0.05, c.currentTime + 0.4)
      bg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.0)
      bs.connect(bf).connect(bg).connect(c.destination); bs.start(c.currentTime + 0.4)
    }),
    hit: () => play(c => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sawtooth'; o.frequency.setValueAtTime(400, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.12)
      g.gain.setValueAtTime(0.1, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.15)
      const o2 = c.createOscillator(), g2 = c.createGain()
      o2.type = 'triangle'; o2.frequency.value = 1800
      g2.gain.setValueAtTime(0.04, c.currentTime)
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
      o2.connect(g2).connect(c.destination); o2.start(); o2.stop(c.currentTime + 0.08)
      const o3 = c.createOscillator(), g3 = c.createGain()
      o3.type = 'sine'; o3.frequency.setValueAtTime(180, c.currentTime + 0.05)
      o3.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.15)
      g3.gain.setValueAtTime(0.05, c.currentTime + 0.05)
      g3.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
      o3.connect(g3).connect(c.destination); o3.start(c.currentTime + 0.05); o3.stop(c.currentTime + 0.15)
    }),
    conquer: () => play(c => {
      const notes = [440, 554, 659]
      notes.forEach((freq, i) => {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'sawtooth'; o.frequency.value = freq
        const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 2000
        g.gain.setValueAtTime(0.05, c.currentTime + i * 0.1)
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.35)
        o.connect(fl).connect(g).connect(c.destination)
        o.start(c.currentTime + i * 0.1); o.stop(c.currentTime + i * 0.1 + 0.35)
      })
      const buf = c.createBuffer(1, c.sampleRate * 0.4, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5) * 0.3
      const bs = c.createBufferSource(), bg = c.createGain(), bf = c.createBiquadFilter()
      bs.buffer = buf; bf.type = 'bandpass'; bf.frequency.value = 1500; bf.Q.value = 0.5
      bg.gain.setValueAtTime(0.04, c.currentTime + 0.2)
      bg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)
      bs.connect(bf).connect(bg).connect(c.destination); bs.start(c.currentTime + 0.2)
    }),
    warStart: () => play(c => {
      const buf = c.createBuffer(1, c.sampleRate * 0.8, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.2)
      const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter()
      s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 300
      g.gain.setValueAtTime(0.12, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8)
      s.connect(f).connect(g).connect(c.destination); s.start()
      const jet = c.createOscillator(), jg = c.createGain(), jf = c.createBiquadFilter()
      jet.type = 'sawtooth'; jet.frequency.setValueAtTime(200, c.currentTime + 0.1)
      jet.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 0.5)
      jf.type = 'bandpass'; jf.frequency.value = 800; jf.Q.value = 2
      jg.gain.setValueAtTime(0, c.currentTime); jg.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.2)
      jg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6)
      jet.connect(jf).connect(jg).connect(c.destination)
      jet.start(c.currentTime + 0.1); jet.stop(c.currentTime + 0.6)
      const eb = c.createBuffer(1, c.sampleRate * 0.3, c.sampleRate)
      const ed = eb.getChannelData(0)
      for (let i = 0; i < ed.length; i++) ed[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ed.length, 2)
      const es = c.createBufferSource(), eg = c.createGain(), ef = c.createBiquadFilter()
      es.buffer = eb; ef.type = 'lowpass'; ef.frequency.value = 400
      eg.gain.setValueAtTime(0.15, c.currentTime + 0.5)
      eg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8)
      es.connect(ef).connect(eg).connect(c.destination); es.start(c.currentTime + 0.5)
    }),
    build: () => play(c => {
      for (let i = 0; i < 3; i++) {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'square'; o.frequency.setValueAtTime(800 - i * 100, c.currentTime + i * 0.06)
        o.frequency.exponentialRampToValueAtTime(400 - i * 50, c.currentTime + i * 0.06 + 0.04)
        g.gain.setValueAtTime(0.05, c.currentTime + i * 0.06)
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.06 + 0.05)
        o.connect(g).connect(c.destination)
        o.start(c.currentTime + i * 0.06); o.stop(c.currentTime + i * 0.06 + 0.05)
      }
      const chime = c.createOscillator(), cg = c.createGain()
      chime.type = 'sine'; chime.frequency.value = 1400
      cg.gain.setValueAtTime(0.06, c.currentTime + 0.2)
      cg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
      chime.connect(cg).connect(c.destination); chime.start(c.currentTime + 0.2); chime.stop(c.currentTime + 0.4)
      const ch2 = c.createOscillator(), cg2 = c.createGain()
      ch2.type = 'sine'; ch2.frequency.value = 1760
      cg2.gain.setValueAtTime(0.03, c.currentTime + 0.25)
      cg2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
      ch2.connect(cg2).connect(c.destination); ch2.start(c.currentTime + 0.25); ch2.stop(c.currentTime + 0.4)
    }),
    drone: () => play(c => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sawtooth'; o.frequency.setValueAtTime(600, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.15)
      g.gain.setValueAtTime(0.06, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.25)
      const prop = c.createOscillator(), pg = c.createGain()
      prop.type = 'square'; prop.frequency.value = 120
      const lfo = c.createOscillator(), lg = c.createGain()
      lfo.type = 'square'; lfo.frequency.value = 30; lg.gain.value = 0.03
      lfo.connect(lg).connect(pg.gain)
      pg.gain.setValueAtTime(0.04, c.currentTime)
      pg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
      prop.connect(pg).connect(c.destination)
      prop.start(); lfo.start(); prop.stop(c.currentTime + 0.2); lfo.stop(c.currentTime + 0.2)
      const dop = c.createOscillator(), dg = c.createGain()
      dop.type = 'sine'; dop.frequency.setValueAtTime(1800, c.currentTime + 0.1)
      dop.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.25)
      dg.gain.setValueAtTime(0.03, c.currentTime + 0.1)
      dg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)
      dop.connect(dg).connect(c.destination); dop.start(c.currentTime + 0.1); dop.stop(c.currentTime + 0.25)
    }),
    missileSound: () => play(c => {
      const wBuf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate)
      const wd = wBuf.getChannelData(0)
      for (let i = 0; i < wd.length; i++) wd[i] = (Math.random() * 2 - 1) * 0.5
      const ws = c.createBufferSource(), wg = c.createGain(), wf = c.createBiquadFilter()
      ws.buffer = wBuf; wf.type = 'bandpass'; wf.frequency.setValueAtTime(500, c.currentTime)
      wf.frequency.exponentialRampToValueAtTime(4000, c.currentTime + 0.15); wf.Q.value = 3
      wg.gain.setValueAtTime(0.06, c.currentTime)
      wg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
      ws.connect(wf).connect(wg).connect(c.destination); ws.start()
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sine'; o.frequency.setValueAtTime(200, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(2000, c.currentTime + 0.25)
      g.gain.setValueAtTime(0.08, c.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.3)
      const buf = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.5)
      const s = c.createBufferSource(), sg2 = c.createGain(), sf = c.createBiquadFilter()
      s.buffer = buf; sf.type = 'lowpass'; sf.frequency.value = 1000
      sg2.gain.setValueAtTime(0.15, c.currentTime + 0.25)
      sg2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)
      s.connect(sf).connect(sg2).connect(c.destination); s.start(c.currentTime + 0.25)
      const boom = c.createOscillator(), bg = c.createGain()
      boom.type = 'sine'; boom.frequency.setValueAtTime(60, c.currentTime + 0.25)
      boom.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.4)
      bg.gain.setValueAtTime(0.1, c.currentTime + 0.25)
      bg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.45)
      boom.connect(bg).connect(c.destination); boom.start(c.currentTime + 0.25); boom.stop(c.currentTime + 0.45)
    }),
    deploy: () => play(c => {
      for (let step = 0; step < 2; step++) {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'square'; o.frequency.value = 100
        g.gain.setValueAtTime(0.06, c.currentTime + step * 0.08)
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + step * 0.08 + 0.06)
        o.connect(g).connect(c.destination)
        o.start(c.currentTime + step * 0.08); o.stop(c.currentTime + step * 0.08 + 0.06)
      }
      const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3
      const s = c.createBufferSource(), rg = c.createGain(), rf = c.createBiquadFilter()
      s.buffer = buf; rf.type = 'bandpass'; rf.frequency.value = 2000; rf.Q.value = 5
      rg.gain.setValueAtTime(0.04, c.currentTime + 0.12)
      rg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
      s.connect(rf).connect(rg).connect(c.destination); s.start(c.currentTime + 0.12)
      const o2 = c.createOscillator(), g2 = c.createGain()
      o2.type = 'sine'; o2.frequency.value = 1400
      g2.gain.setValueAtTime(0.04, c.currentTime + 0.18)
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22)
      o2.connect(g2).connect(c.destination); o2.start(c.currentTime + 0.18); o2.stop(c.currentTime + 0.22)
    }),
    shieldUp: () => play(c => {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sine'; o.frequency.setValueAtTime(200, c.currentTime)
      o.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.3)
      g.gain.setValueAtTime(0.06, c.currentTime)
      g.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.15)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4)
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.4)
      const buf = c.createBuffer(1, c.sampleRate * 0.1, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.1)
      const s = c.createBufferSource(), sg = c.createGain(), sf = c.createBiquadFilter()
      s.buffer = buf; sf.type = 'highpass'; sf.frequency.value = 3000
      sg.gain.setValueAtTime(0.04, c.currentTime + 0.15)
      sg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
      s.connect(sf).connect(sg).connect(c.destination); s.start(c.currentTime + 0.15)
      const hum = c.createOscillator(), hg = c.createGain()
      hum.type = 'triangle'; hum.frequency.value = 400
      hg.gain.setValueAtTime(0.03, c.currentTime + 0.2)
      hg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)
      hum.connect(hg).connect(c.destination); hum.start(c.currentTime + 0.2); hum.stop(c.currentTime + 0.5)
    }),
    eventAlert: () => play(c => {
      const freqs = [880, 1100]
      freqs.forEach((freq, i) => {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'square'; o.frequency.value = freq
        const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 3000
        g.gain.setValueAtTime(0.06, c.currentTime + i * 0.12)
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.1)
        o.connect(fl).connect(g).connect(c.destination)
        o.start(c.currentTime + i * 0.12); o.stop(c.currentTime + i * 0.12 + 0.1)
      })
      const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.2
      const s = c.createBufferSource(), sg = c.createGain(), sf = c.createBiquadFilter()
      s.buffer = buf; sf.type = 'bandpass'; sf.frequency.value = 2500; sf.Q.value = 2
      sg.gain.setValueAtTime(0.03, c.currentTime + 0.2)
      sg.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3)
      s.connect(sf).connect(sg).connect(c.destination); s.start(c.currentTime + 0.2)
    }),
  }
})()

const DIFFICULTY_SETTINGS = {
  easy:   { label: 'EASY',   troopMult: 0.6, reinforceEvery: 3, startMoney: 200, description: 'For armchair generals' },
  normal: { label: 'NORMAL', troopMult: 1.0, reinforceEvery: 2, startMoney: 150, description: 'Standard deployment' },
  hard:   { label: 'HARD',   troopMult: 1.5, reinforceEvery: 1, startMoney: 80, description: 'Pentagon nightmare mode' },
}

// ----------------------------------------------------------
// AMBIENT MUSIC — procedural military drone
// ----------------------------------------------------------
const MusicEngine = (() => {
  let ctx = null, masterGain = null, playing = false, nodes = []

  return {
    start() {
      if (playing) return
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        if (ctx.state === 'suspended') ctx.resume()
        masterGain = ctx.createGain()
        masterGain.gain.value = 0.04
        masterGain.connect(ctx.destination)

        // Low bass drone
        const bass = ctx.createOscillator()
        bass.type = 'sine'; bass.frequency.value = 55
        const bassGain = ctx.createGain(); bassGain.gain.value = 0.6
        bass.connect(bassGain).connect(masterGain); bass.start()
        nodes.push(bass)

        // Mid tension
        const mid = ctx.createOscillator()
        mid.type = 'triangle'; mid.frequency.value = 110
        const midGain = ctx.createGain(); midGain.gain.value = 0.2
        mid.connect(midGain).connect(masterGain); mid.start()
        nodes.push(mid)

        // Subtle high pulse
        const hi = ctx.createOscillator()
        hi.type = 'sine'; hi.frequency.value = 220
        const hiGain = ctx.createGain()
        hiGain.gain.setValueAtTime(0.05, ctx.currentTime)
        // LFO for pulsing
        const lfo = ctx.createOscillator()
        lfo.type = 'sine'; lfo.frequency.value = 0.3
        const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.05
        lfo.connect(lfoGain).connect(hiGain.gain)
        hi.connect(hiGain).connect(masterGain); hi.start(); lfo.start()
        nodes.push(hi, lfo)

        playing = true
      } catch {}
    },
    stop() {
      if (!playing) return
      try {
        nodes.forEach(n => { try { n.stop() } catch {} })
        nodes = []
        if (ctx) ctx.close()
        ctx = null; masterGain = null; playing = false
      } catch {}
    },
    get isPlaying() { return playing },
  }
})()

const BASE_INCOME = 3
const TOTAL_ATTACKABLE = Object.keys(TERRITORIES).length // 12
const MAX_NEWS_QUEUE = 50

function capNews(queue) {
  return queue.length > MAX_NEWS_QUEUE ? queue.slice(-MAX_NEWS_QUEUE) : queue
}

// ----------------------------------------------------------
// NEWS TICKER — scrolling red bar with sarcastic headlines
// ----------------------------------------------------------
function NewsTicker({ extraHeadlines = [] }) {
  const allHeadlines = [...TICKER_HEADLINES, ...extraHeadlines]
  // Duplicate for seamless loop
  const doubled = [...allHeadlines, ...allHeadlines]
  const speed = allHeadlines.length * 3 // ~3s per headline

  return (
    <div className="w-full bg-red-enemy/10 border-b border-red-enemy/30 overflow-hidden relative z-20">
      <div className="flex items-center">
        {/* LIVE badge */}
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-red-enemy/20 border-r border-red-enemy/30">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 live-dot" />
          <span className="text-xs text-red-400 font-bold tracking-wider">LIVE</span>
        </div>
        {/* Scrolling text */}
        <div className="overflow-hidden flex-1">
          <div
            className="ticker-scroll flex whitespace-nowrap"
            style={{ '--ticker-duration': `${speed}s` }}
          >
            {doubled.map((headline, i) => (
              <span key={`${i}-${headline.slice(0, 20)}`} className="text-[10px] text-red-400/80 px-4">
                {headline} <span className="text-red-enemy/30 mx-2">│</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MenuScreen({ onStart, hasSave, onResume }) {
  const [difficulty, setDifficulty] = useState('normal')
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22C55E" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* News Ticker */}
      <NewsTicker />

      {/* Content — centered in remaining space */}
      <div className="flex-1 flex items-center justify-center">
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-6xl md:text-8xl tracking-wider text-red-enemy"
            style={{ fontFamily: 'var(--font-military)' }}
          >
            WARISK
          </h1>
          <div className="text-sm md:text-base text-text-dim tracking-[0.3em] uppercase">
            How America Sees the World
          </div>
        </div>

        {/* Decorative line */}
        <div className="w-64 h-px bg-green-grid opacity-50" />

        {/* Difficulty selector */}
        <div className="flex gap-2">
          {Object.entries(DIFFICULTY_SETTINGS).map(([key, d]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              className={`border px-5 py-2.5 text-xs tracking-widest uppercase transition-all cursor-pointer ${
                difficulty === key
                  ? 'border-green-500/60 bg-green-500/20 text-green-400'
                  : 'border-gray-neutral/30 bg-transparent text-text-dim hover:bg-gray-neutral/10'
              }`}
            >
              <div className="font-bold">{d.label}</div>
              <div className="text-[10px] mt-0.5 opacity-60">{d.description}</div>
            </button>
          ))}
        </div>

        {/* Start button */}
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={() => { SFX.warStart(); setTimeout(() => onStart(difficulty), 800) }}
            className="border-2 border-green-500/40 bg-green-500/10 text-green-400 px-10 py-4 text-base sm:text-lg tracking-widest uppercase hover:bg-green-500/20 hover:border-green-500/60 transition-all duration-200 cursor-pointer btn-war font-bold"
          >
            ▸ {hasSave ? 'NEW OPERATION' : 'START OPERATION'}
          </button>
          {hasSave && (
            <button
              onClick={onResume}
              className="border-2 border-gold-accent/40 bg-gold-accent/10 text-gold-accent px-10 py-4 text-base sm:text-lg tracking-widest uppercase hover:bg-gold-accent/20 hover:border-gold-accent/60 transition-all duration-200 cursor-pointer btn-war font-bold"
            >
              ▸ CONTINUE OPERATION
            </button>
          )}
        </div>

        {/* Classification label */}
        <div className="text-xs text-text-dim tracking-widest uppercase opacity-40">
          ★ TOP SECRET // EYES ONLY ★
        </div>

        {/* X / Twitter link */}
        <a
          href="https://x.com/WARISK_fun"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-text-dim tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          @WARISK_fun
        </a>

        {/* Token Section */}
        <div className="w-full max-w-sm border border-green-500/20 bg-bg-card/60 p-4 mt-4">
          <div className="text-center mb-3">
            <span className="text-gold-accent font-bold text-base tracking-wider flex items-center justify-center gap-1.5"><img src="/warisk-coin.png" alt="W" className="w-5 h-5" />WARISK</span>
            <span className="text-text-dim text-xs ml-2 tracking-wider">THE FREEDOM CURRENCY</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
            <div>
              <div className="text-text-dim">TAX</div>
              <div className="text-green-400 font-bold">0/0</div>
            </div>
            <div>
              <div className="text-text-dim">LP</div>
              <div className="text-green-400 font-bold">BURNED</div>
            </div>
            <div>
              <div className="text-text-dim">SUPPLY</div>
              <div className="text-green-400 font-bold">1B</div>
            </div>
          </div>
          <div className="text-center text-xs text-text-dim mb-3 tracking-wider">
            CA: COMING SOON
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-green-500/30 bg-green-500/10 text-green-400 py-2 text-xs tracking-wider hover:bg-green-500/20 transition-all cursor-pointer">
              BUY $WARISK
            </button>
            <button className="flex-1 border border-gray-neutral/30 bg-gray-neutral/10 text-text-dim py-2 text-xs tracking-wider hover:bg-gray-neutral/20 transition-all cursor-pointer">
              VIEW CHART
            </button>
          </div>
          <div className="text-[10px] text-text-dim/40 text-center mt-2 italic">
            Not financial advice. But freedom isn't free.
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------
// WORLD MAP — SVG with all territories
// ----------------------------------------------------------

const OWNER_COLORS = {
  player: { fill: '#3B82F6', stroke: '#60A5FA', text: '#DBEAFE' },
  enemy:  { fill: '#EF4444', stroke: '#F87171', text: '#FEE2E2' },
  ally:   { fill: '#22C55E', stroke: '#4ADE80', text: '#DCFCE7' },
}

const DIFFICULTY_BADGE = {
  easy:   { label: 'EASY',   color: '#22C55E' },
  medium: { label: 'MED',    color: '#F59E0B' },
  hard:   { label: 'HARD',   color: '#EF4444' },
  boss:   { label: 'BOSS',   color: '#A855F7' },
}

// ISO 3166-1 numeric → game territory/neutral ID mapping
const ISO_TO_GAME = {
  // Player base (USA is now a clickable territory)
  '840': { type: 'territory', id: 'usa' },

  // Attackable territories (mapped to game IDs)
  '192': { type: 'territory', id: 'cuba' },
  '862': { type: 'territory', id: 'venezuela' },
  '591': { type: 'territory', id: 'panama' },
  '434': { type: 'territory', id: 'libya' },
  '887': { type: 'territory', id: 'yemen' },
  '368': { type: 'territory', id: 'iraq' },
  '364': { type: 'territory', id: 'iran' },

  // Allied countries
  '376': { type: 'ally', id: 'israel' },

  // Neutral labels (humor tooltips)
  '124': { type: 'neutral', id: 'canada' },
  '484': { type: 'neutral', id: 'mexico' },
  '826': { type: 'neutral', id: 'uk' },
  '250': { type: 'neutral', id: 'france' },
  '276': { type: 'neutral', id: 'germany' },
  '380': { type: 'neutral', id: 'italy' },
  '724': { type: 'neutral', id: 'spain' },
  '620': { type: 'neutral', id: 'portugal' },
  '752': { type: 'neutral', id: 'sweden' },
  '246': { type: 'neutral', id: 'finland' },
  '578': { type: 'neutral', id: 'norway' },
  '756': { type: 'neutral', id: 'switzerland' },
  '392': { type: 'neutral', id: 'japan' },
  '036': { type: 'neutral', id: 'australia' },
  '076': { type: 'neutral', id: 'brazil' },
  '356': { type: 'neutral', id: 'india' },
  '496': { type: 'neutral', id: 'mongolia' },
  '410': { type: 'neutral', id: 'south_korea' },
  '792': { type: 'neutral', id: 'turkey' },
  '818': { type: 'neutral', id: 'egypt' },
  '682': { type: 'neutral', id: 'saudi' },
  '643': { type: 'neutral', id: 'russia' },
  '156': { type: 'neutral', id: 'china' },
  '032': { type: 'neutral', id: 'argentina' },
  '710': { type: 'neutral', id: 'south_africa' },
  '170': { type: 'neutral', id: 'colombia' },
  '554': { type: 'neutral', id: 'new_zealand' },
  '764': { type: 'neutral', id: 'thailand' },
  '616': { type: 'neutral', id: 'poland' },
  '300': { type: 'neutral', id: 'greece' },
  '414': { type: 'neutral', id: 'kuwait' },
  '304': { type: 'territory', id: 'greenland' }, // Greenland is attackable
  // New neutral countries
  '408': { type: 'territory', id: 'north_korea_t' },
  '586': { type: 'neutral', id: 'pakistan' },
  '004': { type: 'territory', id: 'afghanistan' },
  '566': { type: 'neutral', id: 'nigeria' },
  '360': { type: 'neutral', id: 'indonesia' },
  '704': { type: 'neutral', id: 'vietnam' },
  '804': { type: 'neutral', id: 'ukraine' },
  '608': { type: 'neutral', id: 'philippines' },
  '604': { type: 'neutral', id: 'peru' },
  '152': { type: 'neutral', id: 'chile' },
  '104': { type: 'neutral', id: 'myanmar' },
  '760': { type: 'territory', id: 'syria' },
  '706': { type: 'territory', id: 'somalia' },
  '729': { type: 'neutral', id: 'sudan' },
  '231': { type: 'neutral', id: 'ethiopia' },
  '180': { type: 'neutral', id: 'congo' },
  // Batch 3
  '320': { type: 'neutral', id: 'guatemala' },
  '340': { type: 'neutral', id: 'honduras' },
  '332': { type: 'neutral', id: 'haiti' },
  '208': { type: 'neutral', id: 'denmark' },
  '372': { type: 'neutral', id: 'ireland' },
  '642': { type: 'neutral', id: 'romania' },
  '398': { type: 'neutral', id: 'kazakhstan' },
  '068': { type: 'neutral', id: 'bolivia' },
  '404': { type: 'neutral', id: 'kenya' },
  '716': { type: 'neutral', id: 'zimbabwe' },
  '524': { type: 'neutral', id: 'nepal' },
  '504': { type: 'neutral', id: 'morocco' },
  '010': { type: 'neutral', id: 'antarctica' },
}

// Load world map data
import { feature } from 'topojson-client'
import { geoPath, geoNaturalEarth1 } from 'd3-geo'

const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// SVG map animation overlay — renders visual effects at territory centroids
function MapAnimation({ anim }) {
  const { type, x, y, fromX, fromY, id } = anim
  switch (type) {
    case 'deploy_pulse':
      return (
        <circle cx={x} cy={y} r="3" fill="none" stroke="#3B82F6" strokeWidth="1.5">
          <animate attributeName="r" from="3" to="25" dur="0.8s" fill="freeze" />
          <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" fill="freeze" />
        </circle>
      )
    case 'build_flash':
      return (
        <g>
          <circle cx={x} cy={y} r="2" fill="#F59E0B" opacity="0.8">
            <animate attributeName="r" from="2" to="18" dur="0.6s" fill="freeze" />
            <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" fill="freeze" />
          </circle>
          {[0, 45, 90, 135].map(angle => (
            <line key={angle} x1={x} y1={y}
              x2={x + Math.cos(angle * Math.PI / 180) * 12}
              y2={y + Math.sin(angle * Math.PI / 180) * 12}
              stroke="#FBBF24" strokeWidth="1" opacity="0.6">
              <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" fill="freeze" />
            </line>
          ))}
        </g>
      )
    case 'shield_dome':
      return (
        <g>
          <circle cx={x} cy={y} r="5" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="3 2">
            <animate attributeName="r" from="5" to="20" dur="0.5s" fill="freeze" />
            <animate attributeName="opacity" from="0" to="0.7" dur="0.3s" fill="freeze" />
          </circle>
          <circle cx={x} cy={y} r="20" fill="#3B82F6" fillOpacity="0.05">
            <animate attributeName="fillOpacity" from="0.15" to="0.03" dur="1s" fill="freeze" />
          </circle>
        </g>
      )
    case 'drone_fly': {
      if (fromX === undefined) return null
      const pathId = `drone-path-${id}`
      return (
        <g>
          <defs>
            <path id={pathId} d={`M${fromX},${fromY} Q${(fromX+x)/2},${Math.min(fromY,y)-30} ${x},${y}`} />
          </defs>
          <circle r="3" fill="#22C55E">
            <animateMotion dur="1s" fill="freeze">
              <mpath href={`#${pathId}`} />
            </animateMotion>
            <animate attributeName="opacity" from="1" to="0" begin="0.8s" dur="0.4s" fill="freeze" />
          </circle>
          <path d={`M${fromX},${fromY} Q${(fromX+x)/2},${Math.min(fromY,y)-30} ${x},${y}`}
            fill="none" stroke="#22C55E" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.3">
            <animate attributeName="opacity" from="0.4" to="0" dur="1.2s" fill="freeze" />
          </path>
        </g>
      )
    }
    case 'missile_arc': {
      if (fromX === undefined) return null
      const mPathId = `missile-path-${id}`
      const midX = (fromX + x) / 2
      const midY = Math.min(fromY, y) - 60
      return (
        <g>
          <defs>
            <path id={mPathId} d={`M${fromX},${fromY} Q${midX},${midY} ${x},${y}`} />
          </defs>
          <circle r="2.5" fill="#EF4444">
            <animateMotion dur="1.2s" fill="freeze">
              <mpath href={`#${mPathId}`} />
            </animateMotion>
          </circle>
          <path d={`M${fromX},${fromY} Q${midX},${midY} ${x},${y}`}
            fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="6 3" opacity="0.4">
            <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" fill="freeze" />
          </path>
          <circle cx={x} cy={y} r="2" fill="#FF6B6B" opacity="0">
            <animate attributeName="r" from="2" to="20" begin="1.1s" dur="0.4s" fill="freeze" />
            <animate attributeName="opacity" from="0" to="0.6" begin="1.1s" dur="0.1s" fill="freeze" />
            <animate attributeName="opacity" from="0.6" to="0" begin="1.2s" dur="0.3s" fill="freeze" />
          </circle>
        </g>
      )
    }
    case 'nuke_blast':
      return (
        <g>
          <circle cx={x} cy={y} r="3" fill="#FBBF24" opacity="0.9">
            <animate attributeName="r" from="3" to="35" dur="1s" fill="freeze" />
            <animate attributeName="opacity" from="0.9" to="0" dur="1.2s" fill="freeze" />
          </circle>
          <circle cx={x} cy={y} r="5" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.7">
            <animate attributeName="r" from="5" to="50" dur="1.5s" fill="freeze" />
            <animate attributeName="opacity" from="0.7" to="0" dur="1.5s" fill="freeze" />
          </circle>
          {[0.3, 0.6, 0.9].map((delay, i) => (
            <circle key={i} cx={x} cy={y} r="10" fill="none" stroke="#22C55E" strokeWidth="0.8" opacity="0">
              <animate attributeName="r" from="10" to="45" begin={`${delay}s`} dur="1s" fill="freeze" />
              <animate attributeName="opacity" from="0.5" to="0" begin={`${delay}s`} dur="1s" fill="freeze" />
            </circle>
          ))}
        </g>
      )
    case 'combat_flash':
      return (
        <circle cx={x} cy={y} r="2" fill="#F59E0B" opacity="0.8">
          <animate attributeName="r" from="2" to="15" dur="0.3s" fill="freeze" />
          <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" fill="freeze" />
        </circle>
      )
    case 'conquer_glow':
      return (
        <g>
          <circle cx={x} cy={y} r="5" fill="#3B82F6" opacity="0.6">
            <animate attributeName="r" values="5;20;15;20" dur="1.2s" fill="freeze" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.2s" fill="freeze" />
          </circle>
          <circle cx={x} cy={y} r="3" fill="none" stroke="#60A5FA" strokeWidth="1.5">
            <animate attributeName="r" from="3" to="25" dur="0.8s" fill="freeze" />
            <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" fill="freeze" />
          </circle>
        </g>
      )
    case 'enemy_attack':
      return (
        <circle cx={x} cy={y} r="2" fill="#EF4444" opacity="0.7">
          <animate attributeName="r" from="2" to="18" dur="0.5s" fill="freeze" />
          <animate attributeName="opacity" from="0.7" to="0" dur="0.8s" fill="freeze" />
        </circle>
      )
    case 'enemy_reinforce':
      return (
        <circle cx={x} cy={y} r="2" fill="#EF4444" opacity="0.3">
          <animate attributeName="r" from="2" to="12" dur="0.4s" fill="freeze" />
          <animate attributeName="opacity" from="0.3" to="0" dur="0.6s" fill="freeze" />
        </circle>
      )
    default:
      return null
  }
}

function WorldMap({ territories, hoveredTerritory, setHoveredTerritory, onTerritoryClick, onAllyClick, attackFrom, fortifyFrom, dragGuardRef, highlightedTargets, mapAnimations, onCentroidsReady }) {
  const [worldFeatures, setWorldFeatures] = useState([])
  const [centroids, setCentroids] = useState({})
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const [zoom, setZoom] = useState(() => isMobile ? 1.5 : 1.1)
  const [pan, setPan] = useState(() => isMobile ? { x: -30, y: -5 } : { x: 0, y: 0 })
  const containerRef = useRef(null)
  const dragRef = useRef({ dragging: false, wasDragging: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 })
  const tooltipTimerRef = useRef(null)

  // Touch tap → show tooltip briefly (mobile has no mouseover)
  const handleTouchTap = useCallback((info) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setHoveredTerritory(info)
    tooltipTimerRef.current = setTimeout(() => setHoveredTerritory(null), 1800)
  }, [setHoveredTerritory])

  useEffect(() => {
    return () => { if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current) }
  }, [])

  // Projection: Natural Earth → fits nicely in SVG
  const projection = useMemo(() => {
    return geoNaturalEarth1()
      .scale(150)
      .translate([450, 260])
  }, [])

  const pathGen = useMemo(() => geoPath(projection), [projection])

  // Clamp pan so it doesn't go out of bounds
  const clampPan = useCallback((px, py, z) => {
    const vw = 900 / z
    const vh = 520 / z
    const maxPanX = (900 - vw) / 2
    const maxPanY = (520 - vh) / 2
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, px)),
      y: Math.max(-maxPanY, Math.min(maxPanY, py)),
    }
  }, [])

  // Attach wheel listener (zoom toward cursor) + mouse drag for panning
  const mapLoaded = worldFeatures.length > 0
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const delta = e.deltaY > 0 ? -0.15 : 0.15
      setZoom(prev => {
        const next = Math.max(1, Math.min(2.5, prev + delta))
        // When zooming out to 1, reset pan
        if (next <= 1) setPan({ x: 0, y: 0 })
        // Clamp existing pan for new zoom level
        else setPan(p => clampPan(p.x, p.y, next))
        return next
      })
    }

    const onMouseDown = (e) => {
      // Left-click starts potential drag (only activates after 4px movement to avoid eating clicks)
      if (e.button === 0) {
        dragRef.current = { pending: true, dragging: false, startX: e.clientX, startY: e.clientY, startPanX: 0, startPanY: 0 }
        setPan(p => {
          dragRef.current.startPanX = p.x
          dragRef.current.startPanY = p.y
          return p
        })
      }
    }

    const onMouseMove = (e) => {
      if (!dragRef.current.pending && !dragRef.current.dragging) return
      // Activate drag only after 4px threshold (so clicks still work)
      if (dragRef.current.pending && !dragRef.current.dragging) {
        const dx = Math.abs(e.clientX - dragRef.current.startX)
        const dy = Math.abs(e.clientY - dragRef.current.startY)
        if (dx + dy < 4) return
        dragRef.current.dragging = true
        dragRef.current.pending = false
        el.style.cursor = 'grabbing'
      }
      const svg = el.querySelector('svg')
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      setZoom(z => {
        if (z <= 1) return z // no pan when not zoomed
        const svgUnitsPerPixelX = (900 / z) / rect.width
        const svgUnitsPerPixelY = (520 / z) / rect.height
        const dx = (e.clientX - dragRef.current.startX) * svgUnitsPerPixelX
        const dy = (e.clientY - dragRef.current.startY) * svgUnitsPerPixelY
        setPan(clampPan(
          dragRef.current.startPanX - dx,
          dragRef.current.startPanY - dy,
          z
        ))
        return z
      })
    }

    const onMouseUp = () => {
      dragRef.current.pending = false
      if (dragRef.current.dragging) {
        dragRef.current.dragging = false
        if (dragGuardRef) dragGuardRef.current.wasDragging = true
        el.style.cursor = ''
        // Reset wasDragging after click event fires (click fires after mouseup)
        requestAnimationFrame(() => {
          if (dragGuardRef) dragGuardRef.current.wasDragging = false
        })
      }
    }

    // Touch handlers for pinch-zoom and drag-pan
    let touchStartDist = 0
    let touchStartZoom = 1
    let touchStartPan = { x: 0, y: 0 }

    const getTouchDist = (t) => {
      const dx = t[0].clientX - t[1].clientX
      const dy = t[0].clientY - t[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        touchStartDist = getTouchDist(e.touches)
        setZoom(z => { touchStartZoom = z; return z })
        setPan(p => { touchStartPan = { ...p }; return p })
      } else if (e.touches.length === 1) {
        dragRef.current = {
          pending: true, dragging: false,
          startX: e.touches[0].clientX, startY: e.touches[0].clientY,
          startPanX: 0, startPanY: 0,
        }
        setPan(p => { dragRef.current.startPanX = p.x; dragRef.current.startPanY = p.y; return p })
      }
    }

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        e.preventDefault()
        const dist = getTouchDist(e.touches)
        const scale = dist / touchStartDist
        const newZoom = Math.max(1, Math.min(2.5, touchStartZoom * scale))
        setZoom(newZoom)
        if (newZoom <= 1) setPan({ x: 0, y: 0 })
        else setPan(clampPan(touchStartPan.x, touchStartPan.y, newZoom))
      } else if (e.touches.length === 1 && (dragRef.current.pending || dragRef.current.dragging)) {
        const dx = Math.abs(e.touches[0].clientX - dragRef.current.startX)
        const dy = Math.abs(e.touches[0].clientY - dragRef.current.startY)
        if (dragRef.current.pending && !dragRef.current.dragging && dx + dy >= 8) {
          dragRef.current.dragging = true
          dragRef.current.pending = false
        }
        if (dragRef.current.dragging) {
          e.preventDefault()
          const svg = el.querySelector('svg')
          if (!svg) return
          const rect = svg.getBoundingClientRect()
          setZoom(z => {
            if (z <= 1) return z
            const svgPxX = (900 / z) / rect.width
            const svgPxY = (520 / z) / rect.height
            const mx = (e.touches[0].clientX - dragRef.current.startX) * svgPxX
            const my = (e.touches[0].clientY - dragRef.current.startY) * svgPxY
            setPan(clampPan(dragRef.current.startPanX - mx, dragRef.current.startPanY - my, z))
            return z
          })
        }
      }
    }

    const onTouchEnd = () => {
      touchStartDist = 0
      dragRef.current.pending = false
      if (dragRef.current.dragging) {
        if (dragGuardRef) dragGuardRef.current.wasDragging = true
        dragRef.current.dragging = false
        requestAnimationFrame(() => {
          if (dragGuardRef) dragGuardRef.current.wasDragging = false
        })
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [mapLoaded, clampPan])

  // Load world atlas on mount
  useEffect(() => {
    fetch(WORLD_URL)
      .then(r => r.json())
      .then(topo => {
        const geo = feature(topo, topo.objects.countries)
        setWorldFeatures(geo.features)

        // Pre-compute centroids for labeling
        const c = {}
        for (const f of geo.features) {
          const mapping = ISO_TO_GAME[f.id]
          if (mapping && (mapping.type === 'territory' || mapping.id)) {
            const centroid = pathGen.centroid(f)
            if (centroid && !isNaN(centroid[0])) {
              c[mapping.id || f.id] = centroid
            }
          }
        }
        // Manual offsets for overlapping Middle East labels
        if (c.iraq) { c.iraq = [c.iraq[0], c.iraq[1] + 8] }
        if (c.iran) { c.iran = [c.iran[0] + 20, c.iran[1] - 10] }
        if (c.yemen) { c.yemen = [c.yemen[0], c.yemen[1] + 20] }
        if (c.syria) { c.syria = [c.syria[0] - 10, c.syria[1] - 18] }
        if (c.libya) { c.libya = [c.libya[0] - 22, c.libya[1]] }
        if (c.afghanistan) { c.afghanistan = [c.afghanistan[0] + 22, c.afghanistan[1]] }
        if (c.somalia) { c.somalia = [c.somalia[0], c.somalia[1] + 20] }
        // USA offset — push label slightly down-left to avoid Canada overlap
        if (c.usa) { c.usa = [c.usa[0] - 10, c.usa[1] + 10] }
        setCentroids(c)
        if (onCentroidsReady) onCentroidsReady(c)
      })
      .catch(() => {})
  }, [pathGen, onCentroidsReady])

  // Build neighbor connection lines (deduplicated)
  const connections = useMemo(() => {
    const seen = new Set()
    const lines = []
    for (const [id, t] of Object.entries(territories)) {
      if (t.owner === 'ally') continue // allies don't have connections
      for (const nId of t.neighbors || []) {
        const key = [id, nId].sort().join('-')
        if (seen.has(key)) continue
        seen.add(key)
        const neighbor = territories[nId]
        if (!neighbor) continue
        const c1 = centroids[id]
        const c2 = centroids[nId]
        if (!c1 || !c2) continue
        lines.push({ x1: c1[0], y1: c1[1], x2: c2[0], y2: c2[1], key })
      }
    }
    return lines
  }, [territories, centroids])

  // Dynamic viewBox for zoom + pan
  const vw = 900 / zoom
  const vh = 520 / zoom
  const vx = (900 - vw) / 2 + pan.x
  const vy = (520 - vh) / 2 + pan.y

  if (worldFeatures.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className="text-green-400 text-xs animate-pulse tracking-wider">LOADING WORLD MAP...</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center p-0" style={{ touchAction: 'none' }}>
      <svg
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        className="w-full h-full"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#22C55E" strokeWidth="0.3" opacity="0.15" />
          </pattern>
        </defs>
        <rect x={vx} y={vy} width={vw} height={vh} fill="url(#map-grid)" />

        {/* All world countries */}
        {worldFeatures.map((f, idx) => {
          const d = pathGen(f)
          if (!d) return null
          const k = `c-${f.id || idx}`

          const mapping = ISO_TO_GAME[f.id]

          // Allied country — green
          if (mapping?.type === 'ally') {
            const ally = territories[mapping.id]
            const isHovered = hoveredTerritory?.id === mapping.id
            return (
              <path key={k} d={d}
                fill="#22C55E"
                fillOpacity={isHovered ? 0.55 : 0.35}
                stroke="#4ADE80"
                strokeWidth={isHovered ? 1.5 : 0.8}
                strokeOpacity={isHovered ? 0.9 : 0.6}
                className="cursor-pointer"
                onClick={() => { if (dragGuardRef?.current?.wasDragging) return; onAllyClick && onAllyClick(mapping.id) }}
                onMouseEnter={() => setHoveredTerritory({ id: mapping.id, type: 'ally', name: ally?.name || 'Israel', label: ally?.clickMessage || 'Allied nation' })}
                onMouseLeave={() => setHoveredTerritory(null)}
              />
            )
          }

          // Attackable territory or player base
          if (mapping?.type === 'territory') {
            const t = territories[mapping.id]
            if (!t) return <path key={k} d={d} fill="#6B7280" fillOpacity={0.12} stroke="#6B7280" strokeWidth={0.3} strokeOpacity={0.3} />
            const colors = OWNER_COLORS[t.owner] || { fill: '#6B7280', stroke: '#9CA3AF' }
            const isHovered = hoveredTerritory?.id === mapping.id
            const isSelected = attackFrom === mapping.id || fortifyFrom === mapping.id
            const isHighlighted = highlightedTargets?.has(mapping.id)
            return (
              <path key={k} d={d}
                fill={isHighlighted ? '#F59E0B' : colors.fill}
                fillOpacity={isSelected ? 0.7 : isHighlighted ? 0.35 : isHovered ? 0.55 : 0.4}
                stroke={isSelected ? '#F59E0B' : isHighlighted ? '#FBBF24' : colors.stroke}
                strokeWidth={isSelected ? 2 : isHighlighted ? 1.8 : isHovered ? 1.5 : 0.8}
                strokeOpacity={isSelected ? 1 : isHighlighted ? 0.9 : isHovered ? 0.9 : 0.6}
                className="cursor-pointer"
                onClick={() => { if (dragGuardRef?.current?.wasDragging) return; onTerritoryClick(mapping.id) }}
                onMouseEnter={() => setHoveredTerritory({ id: mapping.id, type: 'territory', ...t })}
                onMouseLeave={() => setHoveredTerritory(null)}
                onTouchEnd={(e) => { if (!dragGuardRef?.current?.wasDragging) { e.stopPropagation(); handleTouchTap({ id: mapping.id, type: 'territory', ...t }) } }}
              />
            )
          }

          // Neutral country with humor tooltip
          if (mapping?.type === 'neutral') {
            const n = NEUTRAL_LABELS[mapping.id]
            return (
              <path key={k} d={d}
                fill="#6B7280" fillOpacity={hoveredTerritory?.id === mapping.id ? 0.25 : 0.12}
                stroke="#6B7280" strokeWidth={0.3} strokeOpacity={0.3}
                className="cursor-default"
                onMouseEnter={() => n && setHoveredTerritory({ id: mapping.id, type: 'neutral', ...n })}
                onMouseLeave={() => setHoveredTerritory(null)}
                onTouchEnd={(e) => { if (n) { e.stopPropagation(); handleTouchTap({ id: mapping.id, type: 'neutral', ...n }) } }}
              />
            )
          }

          // Everything else — dark gray
          return (
            <path key={k} d={d}
              fill="#6B7280" fillOpacity={0.12}
              stroke="#6B7280" strokeWidth={0.3} strokeOpacity={0.3}
            />
          )
        })}

        {/* Fallback markers for tiny countries not in 110m */}
        {Object.entries(territories).map(([id, t]) => {
          if (t.owner === 'ally') return null // allies rendered via world features
          // Only render fallback if no world feature rendered this territory
          const hasFeature = worldFeatures.some(f => ISO_TO_GAME[f.id]?.id === id)
          if (hasFeature) return null
          const c = centroids[id]
          if (!c) return null
          const colors = OWNER_COLORS[t.owner] || { fill: '#6B7280', stroke: '#9CA3AF' }
          const isHovered = hoveredTerritory?.id === id
          const isSelected = attackFrom === id || fortifyFrom === id
          return (
            <circle key={`fallback-${id}`}
              cx={c[0]} cy={c[1]} r={5}
              fill={colors.fill}
              fillOpacity={isSelected ? 0.7 : isHovered ? 0.55 : 0.4}
              stroke={isSelected ? '#F59E0B' : colors.stroke}
              strokeWidth={isSelected ? 2 : 1}
              className="cursor-pointer"
              onClick={() => { if (dragGuardRef?.current?.wasDragging) return; onTerritoryClick(id) }}
              onMouseEnter={() => setHoveredTerritory({ id, type: 'territory', ...t })}
              onMouseLeave={() => setHoveredTerritory(null)}
            />
          )
        })}

        {/* Fallback markers for allied countries not in 110m */}
        {Object.entries(territories).map(([id, t]) => {
          if (t.owner !== 'ally') return null
          const hasFeature = worldFeatures.some(f => ISO_TO_GAME[f.id]?.id === id)
          if (hasFeature) return null
          // Hardcoded positions for small allies
          const allyPositions = { israel: [495, 220] }
          const pos = allyPositions[id]
          if (!pos) return null
          const isHovered = hoveredTerritory?.id === id
          return (
            <g key={`ally-fallback-${id}`}>
              <circle
                cx={pos[0]} cy={pos[1]} r={5}
                fill="#22C55E"
                fillOpacity={isHovered ? 0.6 : 0.4}
                stroke="#4ADE80"
                strokeWidth={isHovered ? 1.5 : 1}
                className="cursor-pointer"
                onClick={() => { if (dragGuardRef?.current?.wasDragging) return; onAllyClick && onAllyClick(id) }}
                onMouseEnter={() => setHoveredTerritory({ id, type: 'ally', name: t.name, label: t.clickMessage })}
                onMouseLeave={() => setHoveredTerritory(null)}
              />
              {/* Also set centroid for label if not computed */}
            </g>
          )
        })}

        {/* Neighbor connection lines */}
        {connections.map(line => (
          <line
            key={line.key}
            x1={line.x1} y1={line.y1}
            x2={line.x2} y2={line.y2}
            stroke="#22C55E"
            strokeWidth="0.8"
            opacity="0.2"
            strokeDasharray="4 4"
          />
        ))}

        {/* Territory labels (troops, names, etc.) on top of real country shapes */}
        {Object.entries(territories).map(([id, t]) => {
          if (t.owner === 'ally') return null // allies don't get troop labels
          const c = centroids[id]
          if (!c) return null
          const cx = c[0]
          const cy = c[1]
          const colors = OWNER_COLORS[t.owner] || { fill: '#6B7280', stroke: '#9CA3AF', text: '#E5E7EB' }
          const isSelected = attackFrom === id || fortifyFrom === id
          const diff = t.difficulty ? DIFFICULTY_BADGE[t.difficulty] : null

          return (
            <g key={`label-${id}`}
              className="cursor-pointer"
              onClick={() => { if (dragGuardRef?.current?.wasDragging) return; onTerritoryClick(id) }}
              onMouseEnter={() => setHoveredTerritory({ id, type: 'territory', ...t })}
              onMouseLeave={() => setHoveredTerritory(null)}
              onTouchEnd={(e) => { if (!dragGuardRef?.current?.wasDragging) { e.stopPropagation(); handleTouchTap({ id, type: 'territory', ...t }) } }}
            >
              {/* Label background */}
              <rect
                x={cx - 19} y={cy - 10}
                width={38} height={22}
                rx={2}
                fill="#0A0E0B"
                fillOpacity={0.8}
                stroke={isSelected ? '#F59E0B' : colors.stroke}
                strokeWidth={isSelected ? 1.5 : 0.5}
                strokeOpacity={isSelected ? 1 : 0.4}
              />

              {/* Country name */}
              <text
                x={cx} y={cy - 2}
                textAnchor="middle"
                fontSize="5"
                fontWeight="bold"
                fill={colors.text}
                opacity="0.9"
              >
                {t.name}
              </text>

              {/* Troop count */}
              <text
                x={cx} y={cy + 7}
                textAnchor="middle"
                fontSize="7"
                fontWeight="bold"
                fill={colors.text}
              >
                {t.troops > 0 ? `▣ ${t.troops}` : '× 0'}
              </text>

              {/* Status indicators */}
              {(t.building || t.shield || t.irradiated > 0) && (
                <text
                  x={cx} y={cy + 18}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#F59E0B"
                >
                  {t.building ? (t.building === 'factory' ? '⌂' : '⏣') : ''}
                  {t.shield ? ' ◇' : ''}
                  {t.irradiated > 0 ? ' ✶' : ''}
                </text>
              )}

              {/* Difficulty badge */}
              {diff && t.owner === 'enemy' && (
                <text
                  x={cx + 26} y={cy - 5}
                  textAnchor="start"
                  fontSize="5"
                  fill={diff.color}
                  fontWeight="bold"
                >
                  {diff.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Israel ally label */}
        {(() => {
          const israelData = territories.israel
          const c = centroids.israel || [495, 220] // fallback if too small for 110m
          if (!israelData) return null
          const ic = [c[0] + 12, c[1] - 14] // offset to avoid overlapping Iraq/Syria
          return (
            <g key="label-israel"
              className="cursor-pointer"
              onClick={() => { if (dragGuardRef?.current?.wasDragging) return; onAllyClick && onAllyClick('israel') }}
              onMouseEnter={() => setHoveredTerritory({ id: 'israel', type: 'ally', name: 'Israel', label: israelData.clickMessage })}
              onMouseLeave={() => setHoveredTerritory(null)}
            >
              {/* Leader line from label to actual country */}
              <line x1={c[0]} y1={c[1]} x2={ic[0]} y2={ic[1]} stroke="#4ADE80" strokeWidth={0.5} opacity={0.3} />
              <rect
                x={ic[0] - 14} y={ic[1] - 6}
                width={28} height={13}
                rx={2}
                fill="#0A0E0B"
                fillOpacity={0.8}
                stroke="#4ADE80"
                strokeWidth={0.5}
                strokeOpacity={0.5}
              />
              <text
                x={ic[0]} y={ic[1] + 3}
                textAnchor="middle"
                fontSize="5"
                fontWeight="bold"
                fill="#DCFCE7"
                opacity="0.9"
              >
                Israel ★
              </text>
            </g>
          )
        })()}

        {/* Animation overlay */}
        {mapAnimations && mapAnimations.map(anim => (
          <MapAnimation key={anim.id} anim={anim} />
        ))}
      </svg>

      {/* Zoom indicator */}
      {(Math.abs(zoom - (isMobile ? 1.5 : 1.1)) > 0.05) && (
        <div className="absolute top-2 right-2 z-30 bg-bg-card/80 border border-green-500/20 px-2 py-1 text-[9px] text-green-400">
          ZOOM: {zoom.toFixed(1)}x │ <span className="hidden sm:inline">Drag to pan │ </span><span className="sm:hidden">Pinch/drag │ </span><button onClick={() => { setZoom(isMobile ? 1.5 : 1.1); setPan(isMobile ? { x: -30, y: -5 } : { x: 0, y: 0 }) }} className="text-text-dim hover:text-green-400 cursor-pointer">RESET</button>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredTerritory && (() => {
        const live = hoveredTerritory.type === 'territory' ? territories[hoveredTerritory.id] : null
        const t = live || hoveredTerritory
        return (
          <div
            className="absolute z-30 pointer-events-none bg-bg-card/95 border border-green-500/30 px-3 py-2 sm:px-5 sm:py-4 text-xs sm:text-base max-w-[90vw] sm:max-w-[380px]"
            style={{
              left: '50%',
              bottom: '8px',
              transform: 'translateX(-50%)',
            }}
          >
            {hoveredTerritory.type === 'neutral' ? (
              <>
                <div className="text-text-dim font-bold">{t.name}</div>
                <div className="text-green-400 mt-0.5">"{t.label}"</div>
              </>
            ) : hoveredTerritory.type === 'ally' ? (
              <>
                <div className="text-green-400 font-bold">{t.name} <span className="text-xs text-green-400/60">ALLY</span></div>
                <div className="text-green-300 mt-0.5 italic">"{t.label || t.clickMessage}"</div>
                <div className="text-text-dim mt-1">Click for foreign aid</div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold" style={{ color: OWNER_COLORS[t.owner]?.text || '#E5E7EB' }}>
                    {t.name}
                  </span>
                  {t.difficulty && (
                    <span style={{ color: DIFFICULTY_BADGE[t.difficulty]?.color }}>
                      {DIFFICULTY_BADGE[t.difficulty]?.label}
                    </span>
                  )}
                </div>
                <div className="text-text-dim mt-1 space-y-0.5">
                  <div>Troops: ▣ {t.troops} │ Owner: {t.owner}</div>
                  {t.building && <div>Building: {t.building === 'factory' ? '⌂ Factory' : '⏣ Refinery'}</div>}
                  {t.shield && <div>◇ Shield active</div>}
                  {t.irradiated > 0 && <div className="text-gold-accent">✶ Irradiated ({t.irradiated} turns)</div>}
                  {t.excuse && <div className="text-red-400 mt-1 italic">"{t.excuse}"</div>}
                </div>
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}

const PHASE_LABELS = {
  build: 'BUILD',
  strike: 'STRIKE',
  attack: 'ATTACK',
  fortify: 'FORTIFY',
  enemy_turn: 'ENEMY TURN',
}

// ----------------------------------------------------------
// DICE COMBAT OVERLAY — shows animated dice results
// ----------------------------------------------------------
function DiceCombatOverlay({ data, onDone }) {
  const [phase, setPhase] = useState('rolling') // rolling → result
  const [displayDice, setDisplayDice] = useState({ a: [], d: [] })

  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!data) return
    // Rolling phase: random dice for 600ms
    let frame = 0
    let doneTimer = null
    const interval = setInterval(() => {
      setDisplayDice({
        a: Array.from({ length: data.aRolls.length }, () => randInt(1, 6)),
        d: Array.from({ length: data.dRolls.length }, () => randInt(1, 6)),
      })
      frame++
      if (frame >= 8) {
        clearInterval(interval)
        setDisplayDice({ a: data.aRolls, d: data.dRolls })
        setPhase('result')
        doneTimer = setTimeout(() => onDoneRef.current(), 1500)
      }
    }, 75)
    return () => { clearInterval(interval); if (doneTimer) clearTimeout(doneTimer) }
  }, [data])

  if (!data) return null

  const DICE_FACES = ['', '\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685']
  const dice = phase === 'result' ? { a: data.aRolls, d: data.dRolls } : displayDice

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 pointer-events-none">
      <div className="border border-gold-accent/40 bg-bg-card/95 px-8 py-5 text-center">
        <div className="text-[10px] text-text-dim tracking-widest mb-3">DICE COMBAT</div>
        <div className="flex items-center gap-6 justify-center mb-3">
          {/* Attacker dice */}
          <div>
            <div className="text-[9px] text-blue-player mb-1 tracking-wider">ATTACKER</div>
            <div className="flex gap-1 justify-center">
              {dice.a.map((v, i) => (
                <span key={i} className={`text-3xl ${phase === 'result' && i < Math.min(data.aRolls.length, data.dRolls.length) && data.aRolls[i] > data.dRolls[i] ? 'text-green-400' : phase === 'result' ? 'text-red-400' : 'text-blue-player'}`}>
                  {DICE_FACES[v] || v}
                </span>
              ))}
            </div>
          </div>
          <span className="text-text-dim text-lg font-bold">VS</span>
          {/* Defender dice */}
          <div>
            <div className="text-[9px] text-red-enemy mb-1 tracking-wider">DEFENDER</div>
            <div className="flex gap-1 justify-center">
              {dice.d.map((v, i) => (
                <span key={i} className={`text-3xl ${phase === 'result' && i < Math.min(data.aRolls.length, data.dRolls.length) && data.dRolls[i] >= data.aRolls[i] ? 'text-green-400' : phase === 'result' ? 'text-red-400' : 'text-red-enemy'}`}>
                  {DICE_FACES[v] || v}
                </span>
              ))}
            </div>
          </div>
        </div>
        {phase === 'result' && (
          <div className="text-xs text-gold-accent mt-2">
            {data.conquered ? `TERRITORY CONQUERED!` : `You: -${data.aLoss} │ Enemy: -${data.dLoss}`}
          </div>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------
// ACTION FEEDBACK — temporary message banner
// ----------------------------------------------------------
function ActionFeedback({ message }) {
  if (!message) return null
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-bg-card/95 border border-gold-accent/40 px-4 py-2 text-xs text-gold-accent max-w-md text-center">
      {message}
    </div>
  )
}

// ----------------------------------------------------------
// EVENT POPUP — dramatic overlay for random events
// ----------------------------------------------------------
const EVENT_LABELS = {
  double_income: 'DOUBLE INCOME THIS TURN', add_150: '+150 WARISK', add_100: '+100 WARISK', add_80: '+80 WARISK',
  lose_50: '-50 WARISK', enemy_plus1: 'ALL ENEMIES +1 TROOP', recruit_2: '+2 TROOPS TO RANDOM TERRITORY',
  free_missile: 'FREE MISSILE', free_nuke: 'FREE NUKE',
  enemy_lose_troops: 'ENEMY LOSES TROOPS', shield_random: 'FREE SHIELD DEPLOYED',
  building_destroyed: 'ENEMY BUILDING DESTROYED', enemy_infight: 'ENEMIES FIGHT EACH OTHER',
  boost_all: '+1 TROOP ALL TERRITORIES', enemy_strike: 'ENEMY RAIDS YOUR OUTPOST',
  halve_cost: '50% OFF NEXT PURCHASE', extra_income: 'TRIPLE INCOME THIS TURN', none: 'NO GAMEPLAY EFFECT',
}
const POSITIVE_EFFECTS = new Set(['double_income','add_150','add_100','add_80','recruit_2','free_missile','free_nuke','enemy_lose_troops','shield_random','building_destroyed','enemy_infight','boost_all','halve_cost','extra_income'])
const NEGATIVE_EFFECTS = new Set(['lose_50','enemy_plus1','enemy_strike'])

function EventPopup({ event, onDone }) {
  const [visible, setVisible] = useState(true)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDoneRef.current(), 300)
    }, 2500)
    return () => clearTimeout(t)
  }, [])

  if (!event) return null
  const isPos = POSITIVE_EFFECTS.has(event.effect)
  const isNeg = NEGATIVE_EFFECTS.has(event.effect)

  return (
    <div className={`absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className={`border-2 bg-bg-card/95 px-6 py-4 sm:px-10 sm:py-6 max-w-sm sm:max-w-md text-center event-popup-enter ${
        isPos ? 'border-green-500/60' : isNeg ? 'border-red-enemy/60' : 'border-gold-accent/40'
      }`}>
        <div className="text-[10px] tracking-[0.3em] text-text-dim mb-2">INTELLIGENCE REPORT</div>
        <div className={`text-sm sm:text-base font-bold mb-3 ${
          isPos ? 'text-green-400' : isNeg ? 'text-red-400' : 'text-gold-accent'
        }`}>
          {event.text}
        </div>
        <div className={`text-xs tracking-wider ${
          isPos ? 'text-green-400/70' : isNeg ? 'text-red-400/70' : 'text-text-dim'
        }`}>
          {EVENT_LABELS[event.effect] || event.effect.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------
// MISSION BRIEFING — tutorial overlay on first turn
// ----------------------------------------------------------
function MissionBriefing({ onDismiss }) {
  const [page, setPage] = useState(0)

  const pages = [
    {
      title: 'MISSION BRIEFING',
      subtitle: 'CLASSIFIED // EYES ONLY',
      content: (
        <>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
            <span>Welcome, Commander. You control the <span className="text-blue-player font-bold">United States</span>.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
            <span>Your mission: conquer all <span className="text-red-enemy font-bold">{TOTAL_ATTACKABLE} enemy territories</span> on the map.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
            <span><span className="text-red-400">Red</span> = Enemy. <span className="text-blue-player">Blue</span> = Yours. <span className="text-green-400">Green</span> = Ally. Click to interact.</span>
          </div>
          <div className="border border-gold-accent/30 bg-gold-accent/5 px-3 py-2 mt-2">
            <div className="text-xs text-gold-accent font-bold mb-1">ECONOMY</div>
            <div className="text-sm text-text-dim">Base income: <span className="text-gold-accent"><img src="/warisk-coin.png" alt="W" className="w-3.5 h-3.5 inline-block align-text-bottom" />3/s</span> + <span className="text-gold-accent"><img src="/warisk-coin.png" alt="W" className="w-3.5 h-3.5 inline-block align-text-bottom" />1/s</span> per territory owned. Build <span className="text-green-400">Factories</span> (+<img src="/warisk-coin.png" alt="W" className="w-3.5 h-3.5 inline-block align-text-bottom" />4/s) and <span className="text-green-400">Refineries</span> (+<img src="/warisk-coin.png" alt="W" className="w-3.5 h-3.5 inline-block align-text-bottom" />10/s) for more.</div>
          </div>
        </>
      ),
    },
    {
      title: 'TURN PHASES',
      subtitle: 'EACH TURN HAS 5 PHASES',
      content: (
        <>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 font-bold flex-shrink-0">BUILD</span>
            <span className="text-text-dim">— Buy troops, factories, refineries, shields. Place on YOUR territories.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-orange-400 font-bold flex-shrink-0">STRIKE</span>
            <span className="text-text-dim">— Buy drones, missiles, nukes, sanctions. Target ENEMY territories.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-red-400 font-bold flex-shrink-0">ATTACK</span>
            <span className="text-text-dim">— Click your territory, then adjacent enemy. Dice combat decides the battle.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-blue-player font-bold flex-shrink-0">FORTIFY</span>
            <span className="text-text-dim">— Move troops between your adjacent territories. Then end turn.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-red-enemy font-bold flex-shrink-0">ENEMY</span>
            <span className="text-text-dim">— The AI strikes back. <span className="text-red-400">Iran</span> is the final boss.</span>
          </div>
        </>
      ),
    },
    {
      title: 'STRATEGY GUIDE',
      subtitle: 'HOW TO WIN',
      content: (
        <>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
            <span>Weaken enemies with <span className="text-orange-400">STRIKE</span> before sending troops in <span className="text-red-400">ATTACK</span>.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
            <span>Dice combat: you roll up to 3, defender up to 2. Ties go to defender.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
            <span>Click <span className="text-green-400">Israel</span> (green ally) every few turns for bonus <img src="/warisk-coin.png" alt="W" className="w-3.5 h-3.5 inline-block align-text-bottom" />WARISK.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-main/90">
            <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>
            <span>Scroll wheel to zoom. Drag to pan the map.</span>
          </div>
          <div className="border border-gold-accent/30 bg-gold-accent/5 px-3 py-2 mt-2">
            <div className="text-xs text-gold-accent font-bold mb-1">PRO TIP</div>
            <div className="text-sm text-text-dim">Conquer easy territories first (Venezuela, Panama, Greenland) to build income. Save nukes for heavily fortified targets like Iran.</div>
          </div>
        </>
      ),
    },
  ]

  const p = pages[page]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="border border-green-500/40 bg-bg-card/95 max-w-lg w-full mx-4">
        {/* Header */}
        <div className="border-b border-green-500/20 px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-base text-green-400 font-bold tracking-wider"
              style={{ fontFamily: 'var(--font-military)' }}
            >
              {p.title}
            </div>
            <div className="text-xs text-text-dim tracking-widest">{p.subtitle}</div>
          </div>
          <div className="text-xs text-text-dim">{page + 1}/{pages.length}</div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-3">
          {p.content}
        </div>

        {/* Footer buttons */}
        <div className="border-t border-green-500/20 px-6 py-3 flex items-center justify-between">
          {page > 0 ? (
            <button
              onClick={() => setPage(page - 1)}
              className="text-xs border border-text-dim/30 text-text-dim px-5 py-2 hover:bg-white/5 transition-all cursor-pointer tracking-wider"
            >
              ◂ BACK
            </button>
          ) : <div />}
          {page < pages.length - 1 ? (
            <button
              onClick={() => setPage(page + 1)}
              className="text-xs border border-green-500/40 bg-green-500/10 text-green-400 px-5 py-2 hover:bg-green-500/20 transition-all cursor-pointer tracking-wider btn-war"
            >
              NEXT ▸
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="text-sm border-2 border-green-500/40 bg-green-500/10 text-green-400 px-6 py-2.5 hover:bg-green-500/20 transition-all cursor-pointer tracking-wider font-bold btn-war"
            >
              BEGIN OPERATION ▸
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ----------------------------------------------------------
// GAME TERMINAL — event log above action bar
// ----------------------------------------------------------
function GameTerminal({ log }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [log.length])

  return (
    <div className="relative z-10 border-t border-green-500/20 bg-black/80 flex-shrink-0" style={{ height: '70px' }}>
      <div
        ref={scrollRef}
        className="game-terminal overflow-y-auto px-4 py-2 h-full"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {log.length === 0 ? (
          <div className="text-xs text-gray-600 leading-relaxed">Awaiting transmission...</div>
        ) : log.map((entry, i) => (
          <div key={i} className={`text-xs terminal-line leading-relaxed ${
            entry.type === 'player' ? 'text-green-400' :
            entry.type === 'enemy' ? 'text-red-400' :
            entry.type === 'event' ? 'text-yellow-400' :
            entry.type === 'israel' ? 'text-green-300' :
            'text-gray-400'
          }`}>
            {entry.text}
          </div>
        ))}
      </div>
    </div>
  )
}

const MAX_TERMINAL = 50
function addTerminalEntry(prev, type, text) {
  const log = [...prev, { type, text }]
  return log.length > MAX_TERMINAL ? log.slice(-MAX_TERMINAL) : log
}

// ----------------------------------------------------------
// PHASE FLOW
// ----------------------------------------------------------
const PHASE_ORDER = ['build', 'strike', 'attack', 'fortify', 'enemy_turn']

function nextPhase(current) {
  const idx = PHASE_ORDER.indexOf(current)
  return PHASE_ORDER[(idx + 1) % PHASE_ORDER.length]
}

function GameScreen({ game, setGame, wariskPerSec, playerTerritories, enemyTerritories, onVictory, onDefeat, onMenu, musicOn, toggleMusic }) {
  const [hoveredTerritory, setHoveredTerritory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [attackFrom, setAttackFrom] = useState(null)
  const [fortifyFrom, setFortifyFrom] = useState(null)
  const [fortifyTo, setFortifyTo] = useState(null)
  const [fortifyAmount, setFortifyAmount] = useState(1)
  const [shaking, setShaking] = useState(false)
  const [showBriefing, setShowBriefing] = useState(() => !localStorage.getItem('warisk_briefing_seen'))
  const [diceData, setDiceData] = useState(null)
  const [mapCentroids, setMapCentroids] = useState({})
  const [mapAnimations, setMapAnimations] = useState([])
  const [activeEvent, setActiveEvent] = useState(null)
  const animIdRef = useRef(0)
  const feedbackTimer = useRef(null)
  const mapDragRef = useRef({ wasDragging: false })

  const addMapAnimation = useCallback((type, fromId, toId) => {
    const from = mapCentroids[fromId || 'usa']
    const to = mapCentroids[toId]
    if (!from && !to) return
    const id = ++animIdRef.current
    const anim = {
      id, type,
      x: to ? to[0] : from[0],
      y: to ? to[1] : from[1],
      fromX: from ? from[0] : undefined,
      fromY: from ? from[1] : undefined,
    }
    setMapAnimations(prev => {
      const active = [...prev, anim]
      return active.length > 4 ? active.slice(-4) : active
    })
    const durations = {
      deploy_pulse: 800, build_flash: 600, shield_dome: 1000,
      drone_fly: 1200, missile_arc: 1500, nuke_blast: 2000,
      combat_flash: 500, conquer_glow: 1200, enemy_attack: 800, enemy_reinforce: 600,
    }
    setTimeout(() => {
      setMapAnimations(prev => prev.filter(a => a.id !== id))
    }, durations[type] || 800)
  }, [mapCentroids])

  const conquered = Object.values(game.territories)
    .filter(t => t.attackable && t.owner === 'player').length

  // Compute highlighted targets (valid neighbors for attack/fortify)
  const highlightedTargets = useMemo(() => {
    const targets = new Set()
    if (attackFrom && game.phase === 'attack') {
      const src = game.territories[attackFrom]
      if (src) {
        for (const nId of src.neighbors || []) {
          if (game.territories[nId]?.owner === 'enemy') targets.add(nId)
        }
      }
    }
    if (fortifyFrom && game.phase === 'fortify' && !fortifyTo) {
      const src = game.territories[fortifyFrom]
      if (src) {
        for (const nId of src.neighbors || []) {
          if (game.territories[nId]?.owner === 'player') targets.add(nId)
        }
      }
    }
    return targets
  }, [attackFrom, fortifyFrom, fortifyTo, game.phase, game.territories])

  // Clean up feedback timer on unmount
  useEffect(() => {
    return () => clearTimeout(feedbackTimer.current)
  }, [])

  // Victory detection — all attackable territories conquered
  useEffect(() => {
    if (conquered >= TOTAL_ATTACKABLE) {
      SFX.victory()
      const timer = setTimeout(() => onVictory(), 1500)
      return () => clearTimeout(timer)
    }
  }, [conquered, onVictory])

  // Defeat detection — USA has 0 troops
  useEffect(() => {
    const usa = game.territories.usa
    if (usa && usa.troops <= 0) {
      SFX.nuke()
      const timer = setTimeout(() => onDefeat(), 2000)
      return () => clearTimeout(timer)
    }
  }, [game.territories.usa?.troops, onDefeat])

  // Show temporary feedback message
  const showFeedback = useCallback((msg) => {
    setFeedback(msg)
    clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2500)
  }, [])

  const shakeTimer = useRef(null)
  const triggerShake = useCallback(() => {
    if (shakeTimer.current) clearTimeout(shakeTimer.current)
    setShaking(true)
    shakeTimer.current = setTimeout(() => setShaking(false), 200)
  }, [])

  // Filter shop items by current phase
  const phaseItems = useMemo(() => {
    return Object.entries(SHOP).filter(([, item]) => item.phase === game.phase)
  }, [game.phase])

  // Compute effective cost (accounts for free strike flags)
  const getEffectiveCost = useCallback((key) => {
    if (key === 'missile' && game.freeMissile) return 0
    if (key === 'nuke' && game.freeNuke) return 0
    const baseCost = SHOP[key]?.cost ?? 0
    if (game.halveCost && baseCost > 0) return Math.floor(baseCost / 2)
    return baseCost
  }, [game.freeMissile, game.freeNuke, game.halveCost])

  // Handle ally click (Israel foreign aid)
  const handleAllyClick = useCallback((id) => {
    if (game.phase === 'enemy_turn') return
    const ally = game.territories[id]
    if (!ally || ally.owner !== 'ally') return

    if (ally.cooldown > 0) {
      showFeedback(`Israel is on cooldown. ${ally.cooldown} turns remaining. "Even allies have limits."`)
      return
    }

    const amount = randInt(50, 100)
    setGame(prev => ({
      ...prev,
      warisk: prev.warisk + amount,
      territories: {
        ...prev.territories,
        [id]: { ...prev.territories[id], cooldown: 3 },
      },
    }))
    SFX.money()
    const messages = [
      `Israel sends Ⓦ${amount} in 'foreign aid'. Don't ask where it came from.`,
      `Ⓦ${amount} deposited from Israeli defense budget. "It's complicated."`,
      `Israel wires Ⓦ${amount}. Congress: "We don't see anything."`,
      `Ⓦ${amount} from Israel. Strings attached. Many, many strings.`,
    ]
    showFeedback(pickRandom(messages))
  }, [game.phase, game.territories, setGame, showFeedback])

  // Handle shop item click
  const handleShopClick = useCallback((key) => {
    const item = SHOP[key]
    if (!item) return

    // UN Resolution — does nothing
    if (item.action === 'nothing') {
      showFeedback('The UN expressed deep concern. Nothing happened.')
      return
    }

    // Check affordability (with free strike flags)
    const cost = getEffectiveCost(key)
    if (game.warisk < cost) {
      showFeedback(`Not enough Ⓦ. Need Ⓦ${cost}, have Ⓦ${game.warisk}.`)
      return
    }

    // Select the item — player must click a territory next
    SFX.click()
    setSelectedItem(key)
    const freeTag = cost === 0 && item.cost > 0 ? ' (FREE!)' : ''
    if (item.phase === 'build') {
      showFeedback(`Select one of YOUR territories to place ${item.name}${freeTag}`)
    } else {
      showFeedback(`Select an ENEMY territory to target with ${item.name}${freeTag}`)
    }
  }, [game.warisk, showFeedback, getEffectiveCost])

  // Handle territory click — execute the selected item action
  const handleTerritoryClick = useCallback((id) => {
    // FORTIFY PHASE — move troops between adjacent owned territories
    if (game.phase === 'fortify') {
      const territory = game.territories[id]
      if (!territory) return

      if (!fortifyFrom) {
        if (territory.owner !== 'player') {
          showFeedback('Select one of YOUR territories (blue) to move troops from.')
          return
        }
        if (territory.troops < 2) {
          showFeedback(`${territory.name} needs at least 2 troops to transfer. Must leave 1 behind.`)
          return
        }
        const hasOwnNeighbor = (territory.neighbors || []).some(nId => {
          const n = game.territories[nId]
          return n && n.owner === 'player'
        })
        if (!hasOwnNeighbor) {
          showFeedback(`${territory.name} has no adjacent friendly territories.`)
          return
        }
        setFortifyFrom(id)
        showFeedback(`Moving from ${territory.name} (▣ ${territory.troops}). Click adjacent friendly territory.`)
        return
      }

      if (id === fortifyFrom) {
        setFortifyFrom(null)
        setFeedback(null)
        return
      }

      if (territory.owner !== 'player') {
        showFeedback('Select a FRIENDLY territory (blue) to move troops to.')
        return
      }
      const source = game.territories[fortifyFrom]
      if (!source || source.troops < 2) {
        showFeedback('Source territory no longer has enough troops.')
        setFortifyFrom(null)
        return
      }
      if (!(source.neighbors || []).includes(id)) {
        showFeedback(`${territory.name} is not adjacent to ${source.name}.`)
        return
      }

      // Open fortify panel to choose amount
      setFortifyTo(id)
      setFortifyAmount(Math.max(1, source.troops - 1))
      return
    }

    // ATTACK PHASE — two-step: select attacker territory, then target
    if (game.phase === 'attack') {
      const territory = game.territories[id]
      if (!territory) return

      if (!attackFrom) {
        // Step 1: select source (player) territory
        if (territory.owner !== 'player') {
          showFeedback('Select one of YOUR territories (blue) to attack from.')
          return
        }
        if (territory.troops < 2) {
          showFeedback(`${territory.name} needs at least 2 troops to attack. Must leave 1 behind.`)
          return
        }
        const hasEnemyNeighbor = (territory.neighbors || []).some(nId => {
          const n = game.territories[nId]
          return n && n.owner === 'enemy'
        })
        if (!hasEnemyNeighbor) {
          showFeedback(`${territory.name} has no adjacent enemy territories.`)
          return
        }
        setAttackFrom(id)
        showFeedback(`Attacking from ${territory.name} (▣ ${territory.troops}). Click adjacent enemy.`)
        return
      }

      // Clicked same territory — cancel selection
      if (id === attackFrom) {
        setAttackFrom(null)
        setFeedback(null)
        return
      }

      // Step 2: select target (enemy) territory
      if (territory.owner !== 'enemy') {
        showFeedback('Select an ENEMY territory (red) to attack.')
        return
      }
      const source = game.territories[attackFrom]
      if (!source || source.troops < 2) {
        showFeedback(`Source territory no longer has enough troops.`)
        setAttackFrom(null)
        return
      }
      if (!(source.neighbors || []).includes(id)) {
        showFeedback(`${territory.name} is not adjacent to ${source.name}.`)
        return
      }

      // DICE COMBAT
      const aDice = Math.min(source.troops - 1, 3)
      const dDice = Math.min(territory.troops, 2)
      const aRolls = Array.from({ length: aDice }, () => randInt(1, 6)).sort((a, b) => b - a)
      const dRolls = Array.from({ length: dDice }, () => randInt(1, 6)).sort((a, b) => b - a)

      const pairs = Math.min(aRolls.length, dRolls.length)
      let aLoss = 0
      let dLoss = 0
      for (let i = 0; i < pairs; i++) {
        if (aRolls[i] > dRolls[i]) dLoss++
        else aLoss++ // ties go to defender
      }

      const newATroops = source.troops - aLoss
      const newDTroops = territory.troops - dLoss

      // Show dice animation + sound
      const conquered = newDTroops <= 0
      setDiceData({ aRolls, dRolls, aLoss, dLoss, conquered })
      if (conquered) SFX.conquer(); else SFX.hit()
      addMapAnimation('combat_flash', null, id)

      if (conquered) {
        // TERRITORY CONQUERED
        const moveTroops = Math.min(aDice, newATroops - 1) || 1
        const msg = territory.conqueredMsg || pickRandom(CONQUEST_MESSAGES).replace('{country}', territory.name)
        setGame(prev => ({
          ...prev,
          conqueredCount: prev.conqueredCount + 1,
          territories: {
            ...prev.territories,
            [attackFrom]: { ...prev.territories[attackFrom], troops: Math.max(1, newATroops - moveTroops) },
            [id]: {
              ...prev.territories[id],
              troops: moveTroops,
              owner: 'player',
              shield: false,
            },
          },
          newsQueue: capNews([...prev.newsQueue, msg]),
          terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} ATTACK] ${territory.name} CONQUERED! [${aRolls}] vs [${dRolls}]`),
        }))
        showFeedback(`CONQUERED! [${aRolls}] vs [${dRolls}] — ${msg}`)
        triggerShake()
        addMapAnimation('conquer_glow', null, id)
      } else {
        // Battle continues — both sides take losses
        const headline = pickRandom(territory.headlines || GENERIC_HEADLINES)
        setGame(prev => ({
          ...prev,
          territories: {
            ...prev.territories,
            [attackFrom]: { ...prev.territories[attackFrom], troops: newATroops },
            [id]: { ...prev.territories[id], troops: newDTroops },
          },
          newsQueue: capNews([...prev.newsQueue, headline]),
          terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} ATTACK] Battle at ${territory.name}: You -${aLoss}, Enemy -${dLoss}`),
        }))
        showFeedback(`Battle! [${aRolls}] vs [${dRolls}] — You: -${aLoss}, Enemy: -${dLoss}`)
        triggerShake()
      }

      setAttackFrom(null)
      return
    }

    if (!selectedItem) return

    const item = SHOP[selectedItem]
    if (!item) return

    const territory = game.territories[id]
    if (!territory) return

    // Compute effective cost (free strike flags)
    const cost = getEffectiveCost(selectedItem)

    // Re-check affordability (money may have changed since selection)
    if (cost > 0 && game.warisk < cost) {
      showFeedback(`Not enough Ⓦ. Need Ⓦ${cost}, have Ⓦ${game.warisk}.`)
      setSelectedItem(null)
      return
    }

    // BUILD PHASE ACTIONS
    if (game.phase === 'build') {
      // Must target own territory
      if (territory.owner !== 'player') {
        showFeedback('Select one of YOUR territories (blue).')
        return
      }

      if (item.action === 'deploy') {
        // Deploy troop
        SFX.deploy()
        addMapAnimation('deploy_pulse', null, id)
        setGame(prev => ({
          ...prev,
          warisk: prev.warisk - cost, halveCost: false,
          totalTroopsDeployed: prev.totalTroopsDeployed + 1,
          territories: {
            ...prev.territories,
            [id]: { ...prev.territories[id], troops: prev.territories[id].troops + 1 },
          },
          terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} BUILD] Troop deployed to ${territory.name}`),
        }))
        showFeedback(`+1 troop deployed to ${territory.name}. "Another brave volunteer."`)
        setSelectedItem(null)
        return
      }

      if (item.action === 'build_structure') {
        const buildingType = selectedItem // 'factory' or 'refinery'
        if (territory.building) {
          showFeedback(`${territory.name} already has a ${territory.building}. One building per territory.`)
          return
        }
        if (territory.irradiated > 0) {
          showFeedback(`${territory.name} is irradiated. Can't build for ${territory.irradiated} more turns.`)
          return
        }
        SFX.build()
        addMapAnimation('build_flash', null, id)
        setGame(prev => ({
          ...prev,
          warisk: prev.warisk - cost, halveCost: false,
          territories: {
            ...prev.territories,
            [id]: { ...prev.territories[id], building: buildingType },
          },
          terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} BUILD] ${buildingType === 'factory' ? 'Factory' : 'Refinery'} constructed in ${territory.name}`),
        }))
        const msg = buildingType === 'factory'
          ? `Factory built in ${territory.name}. "Lockheed Martin opens new branch."`
          : `Refinery built in ${territory.name}. "Definitely not why we invaded."`
        showFeedback(msg)
        setSelectedItem(null)
        return
      }

      if (item.action === 'defend') {
        if (territory.shield) {
          showFeedback(`${territory.name} already has a shield active.`)
          return
        }
        SFX.shieldUp()
        addMapAnimation('shield_dome', null, id)
        setGame(prev => ({
          ...prev,
          warisk: prev.warisk - cost, halveCost: false,
          territories: {
            ...prev.territories,
            [id]: { ...prev.territories[id], shield: true },
          },
          terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} BUILD] Missile Shield activated in ${territory.name}`),
        }))
        showFeedback(`Missile shield activated in ${territory.name}. "Iron Dome but expensive."`)
        setSelectedItem(null)
        return
      }
    }

    // STRIKE PHASE ACTIONS
    if (game.phase === 'strike') {
      if (territory.owner !== 'enemy') {
        showFeedback('Select an ENEMY territory (red) to strike.')
        return
      }

      if (territory.troops <= 0 && selectedItem !== 'sanctions') {
        showFeedback(`${territory.name} has no troops left. Use ATTACK phase to claim it.`)
        setSelectedItem(null)
        return
      }

      if (item.action === 'strike') {
        // Drone Strike: kill 1-3 troops
        if (selectedItem === 'drone') {
          SFX.drone()
          addMapAnimation('drone_fly', 'usa', id)
          const shielded = territory.shield
          if (shielded) {
            setGame(prev => ({
              ...prev,
              warisk: prev.warisk - cost, halveCost: false,
              totalDrones: prev.totalDrones + 1,
              territories: {
                ...prev.territories,
                [id]: { ...prev.territories[id], shield: false },
              },
              terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} STRIKE] Drone intercepted by ${territory.name}'s shield`),
            }))
            showFeedback(`Drone intercepted by ${territory.name}'s shield. Shield destroyed.`)
            setSelectedItem(null)
            return
          }
          const kills = Math.min(randInt(1, 2), territory.troops)
          const droneConquered = territory.troops - kills <= 0
          setGame(prev => ({
            ...prev,
            warisk: prev.warisk - cost, halveCost: false,
            totalDrones: prev.totalDrones + 1,
            conqueredCount: droneConquered ? prev.conqueredCount + 1 : prev.conqueredCount,
            territories: {
              ...prev.territories,
              [id]: {
                ...prev.territories[id],
                troops: droneConquered ? 1 : prev.territories[id].troops - kills,
                ...(droneConquered ? { owner: 'player', shield: false } : {}),
              },
            },
            terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} STRIKE] Drone strike on ${territory.name}: ${kills} troops killed${droneConquered ? ' — CONQUERED!' : ''}`),
          }))
          showFeedback(droneConquered ? `Drone eliminated all troops in ${territory.name}! CONQUERED!` : `Drone strike on ${territory.name}! -${kills} troops. "Surgical precision."`)
          SFX.explosion()
          if (droneConquered) triggerShake()
          setSelectedItem(null)
          return
        }

        // Tactical Missile: kill 2-5 troops
        if (selectedItem === 'missile') {
          SFX.missileSound()
          addMapAnimation('missile_arc', 'usa', id)
          const shielded = territory.shield
          if (shielded) {
            setGame(prev => ({
              ...prev,
              warisk: prev.warisk - cost, halveCost: false,
              freeMissile: false,
              totalMissiles: prev.totalMissiles + 1,
              territories: {
                ...prev.territories,
                [id]: { ...prev.territories[id], shield: false },
              },
              terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} STRIKE] Missile intercepted by ${territory.name}'s shield`),
            }))
            showFeedback(`Missile intercepted by ${territory.name}'s shield. Shield destroyed.`)
            setSelectedItem(null)
            return
          }
          const kills = Math.min(randInt(3, 5), territory.troops)
          const missileConquered = territory.troops - kills <= 0
          setGame(prev => ({
            ...prev,
            warisk: prev.warisk - cost, halveCost: false,
            freeMissile: false,
            totalMissiles: prev.totalMissiles + 1,
            conqueredCount: missileConquered ? prev.conqueredCount + 1 : prev.conqueredCount,
            territories: {
              ...prev.territories,
              [id]: {
                ...prev.territories[id],
                troops: missileConquered ? 1 : prev.territories[id].troops - kills,
                ...(missileConquered ? { owner: 'player', shield: false } : {}),
              },
            },
            terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} STRIKE] Missile strike on ${territory.name}: ${kills} troops killed${missileConquered ? ' — CONQUERED!' : ''}`),
          }))
          showFeedback(missileConquered ? `Missile destroyed all troops in ${territory.name}! CONQUERED!` : `Missile strikes ${territory.name}! -${kills} troops. "Collateral damage is a feature."`)
          SFX.explosion()
          triggerShake()
          setSelectedItem(null)
          return
        }

        // Nuclear Strike: kills ALL troops, irradiates for 3 turns, destroys buildings
        if (selectedItem === 'nuke') {
          const troopsBefore = territory.troops
          setGame(prev => ({
            ...prev,
            warisk: prev.warisk - cost, halveCost: false,
            freeNuke: false,
            totalNukes: prev.totalNukes + 1,
            conqueredCount: prev.territories[id].owner === 'enemy' ? prev.conqueredCount + 1 : prev.conqueredCount,
            territories: {
              ...prev.territories,
              [id]: {
                ...prev.territories[id],
                troops: 1,
                owner: 'player',
                shield: false,
                building: null,
                irradiated: 3,
              },
            },
            terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} STRIKE] ☢ NUCLEAR STRIKE on ${territory.name}: ${troopsBefore} troops eliminated — CONQUERED!`),
          }))
          showFeedback(`NUCLEAR STRIKE on ${territory.name}! -${troopsBefore} troops. Irradiated for 3 turns. "Democracy has been delivered."`)
          SFX.nuke()
          addMapAnimation('nuke_blast', null, id)
          triggerShake()
          setSelectedItem(null)
          return
        }
      }

      if (item.action === 'debuff') {
        if (!territory.building) {
          showFeedback(`${territory.name} has no buildings to sanction.`)
          return
        }
        const bldg = territory.building
        setGame(prev => ({
          ...prev,
          warisk: prev.warisk - cost, halveCost: false,
          territories: {
            ...prev.territories,
            [id]: { ...prev.territories[id], building: null },
          },
          terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} STRIKE] Sanctions on ${territory.name}: ${bldg} destroyed`),
        }))
        showFeedback(`Sanctions imposed on ${territory.name}! ${bldg === 'factory' ? 'Factory' : 'Refinery'} destroyed. "The free market has spoken."`)
        setSelectedItem(null)
        return
      }
    }
  }, [selectedItem, attackFrom, fortifyFrom, game.phase, game.territories, game.warisk, setGame, showFeedback, getEffectiveCost, triggerShake, addMapAnimation])

  // Confirm fortify — move chosen amount of troops
  const confirmFortify = useCallback(() => {
    if (!fortifyFrom || !fortifyTo) return
    setGame(prev => {
      const source = prev.territories[fortifyFrom]
      const target = prev.territories[fortifyTo]
      if (!source || !target) return prev
      const maxMove = source.troops - 1
      if (maxMove <= 0) return prev
      const amount = Math.max(1, Math.min(fortifyAmount, maxMove))
      return {
        ...prev,
        territories: {
          ...prev.territories,
          [fortifyFrom]: { ...source, troops: source.troops - amount },
          [fortifyTo]: { ...target, troops: target.troops + amount },
        },
        terminalLog: addTerminalEntry(prev.terminalLog, 'player', `[T${String(prev.turn).padStart(2,'0')} FORTIFY] ${amount} troops moved from ${source.name} to ${target.name}`),
      }
    })
    showFeedback(`Troops moved. "Strategic redeployment."`)
    setFortifyFrom(null)
    setFortifyTo(null)
    setFortifyAmount(1)
  }, [fortifyFrom, fortifyTo, fortifyAmount, setGame, showFeedback])

  const cancelFortify = useCallback(() => {
    setFortifyTo(null)
    setFortifyAmount(1)
  }, [])

  // Phase advance (enemy_turn is handled by AI useEffect, not this button)
  const handleNextPhase = useCallback(() => {
    setSelectedItem(null)
    setAttackFrom(null)
    setFortifyFrom(null)
    setFortifyTo(null)
    setFortifyAmount(1)
    setFeedback(null)
    setGame(prev => ({ ...prev, phase: nextPhase(prev.phase) }))
  }, [setGame])

  // ----------------------------------------------------------
  // ENEMY TURN AI — auto-runs when phase is enemy_turn
  // ----------------------------------------------------------
  useEffect(() => {
    if (game.phase !== 'enemy_turn') return

    const aiActions = []
    const terminalEntries = []
    let recapturedCount = 0
    const t = {} // build updated territories
    for (const [id, ter] of Object.entries(game.territories)) {
      t[id] = { ...ter }
    }
    const tn = game.turn

    // Tick ally cooldowns
    for (const [id, ter] of Object.entries(t)) {
      if (ter.owner === 'ally' && ter.cooldown > 0) {
        t[id] = { ...t[id], cooldown: t[id].cooldown - 1 }
      }
    }

    // 1. Reinforce: based on difficulty setting
    const reinforceRate = DIFFICULTY_SETTINGS[game.difficulty]?.reinforceEvery || 2
    if (tn % reinforceRate === 0) {
      for (const [id, ter] of Object.entries(t)) {
        if (ter.owner === 'enemy' && ter.attackable && ter.irradiated === 0) {
          t[id] = { ...t[id], troops: t[id].troops + 1 }
        }
      }
      aiActions.push('Enemy forces reinforced (+1 each)')
      terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] All enemy territories reinforced +1 troop` })
      const reinforceTargets = Object.keys(t).filter(id => t[id].owner === 'enemy' && t[id].attackable && t[id].irradiated === 0)
      if (reinforceTargets.length > 0) addMapAnimation('enemy_reinforce', null, pickRandom(reinforceTargets))
    }

    // 2. Enemy builds: every 3 turns, a random enemy territory gets a factory/refinery
    if (tn % 3 === 0) {
      const buildCandidates = Object.entries(t).filter(
        ([, ter]) => ter.owner === 'enemy' && ter.attackable && !ter.building && ter.irradiated === 0
      )
      if (buildCandidates.length > 0) {
        const [bid] = pickRandom(buildCandidates)
        const bType = Math.random() < 0.6 ? 'factory' : 'refinery'
        t[bid] = { ...t[bid], building: bType }
        aiActions.push(`${t[bid].name} built a ${bType}. Sanctions might help.`)
        terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] ${t[bid].name} constructed a ${bType}` })
      }
    }

    // 2b. Enemy shield repair: if broken + enemy has money equivalent (turn-based proxy)
    if (tn % 4 === 0) {
      const shieldCandidates = Object.entries(t).filter(
        ([, ter]) => ter.owner === 'enemy' && ter.attackable && !ter.shield && ter.troops >= 8
      )
      if (shieldCandidates.length > 0) {
        const [sid] = pickRandom(shieldCandidates)
        t[sid] = { ...t[sid], shield: true }
        aiActions.push(`${t[sid].name} deployed a missile shield.`)
        terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] ${t[sid].name} deployed missile shield` })
      }
    }

    // 3. Boss retaliation: Iran fires at player territories (expanded targeting)
    if (t.iran && t.iran.owner === 'enemy' && t.iran.troops >= 8) {
      // Iran can target neighbors AND their neighbors (extended range)
      const directTargets = (t.iran.neighbors || []).filter(nId => t[nId]?.owner === 'player')
      const extendedTargets = []
      for (const nId of t.iran.neighbors || []) {
        for (const nnId of t[nId]?.neighbors || []) {
          if (t[nnId]?.owner === 'player' && !directTargets.includes(nnId)) extendedTargets.push(nnId)
        }
      }
      const allTargets = [...directTargets, ...extendedTargets]
      if (allTargets.length > 0) {
        const tid = pickRandom(allTargets)
        if (t[tid].shield) {
          t[tid] = { ...t[tid], shield: false }
          aiActions.push(`Iran launched missile at ${t[tid].name} — Shield absorbed!`)
          terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] Iran missile at ${t[tid].name} — shield absorbed` })
        } else {
          const dmg = Math.min(randInt(1, 3), t[tid].troops)
          if (dmg > 0) {
            t[tid] = { ...t[tid], troops: t[tid].troops - dmg }
            const hl = pickRandom(DEFENSE_HEADLINES).replace('{country}', 'Iran')
            aiActions.push(`${hl} -${dmg} in ${t[tid].name}`)
            terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] Iran attacks ${t[tid].name}: -${dmg} troops` })
            addMapAnimation('enemy_attack', null, tid)
          }
        }
      }
    }

    // 3b. Iraq retaliation: Iraq also fires back
    if (t.iraq && t.iraq.owner === 'enemy' && t.iraq.troops >= 6 && Math.random() < 0.5) {
      const iraqTargets = (t.iraq.neighbors || []).filter(nId => t[nId]?.owner === 'player')
      if (iraqTargets.length > 0) {
        const tid = pickRandom(iraqTargets)
        const dmg = Math.min(randInt(1, 2), t[tid].troops)
        if (dmg > 0) {
          t[tid] = { ...t[tid], troops: t[tid].troops - dmg }
          aiActions.push(`Iraq strikes ${t[tid].name}! -${dmg} troops`)
          terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] Iraq strikes ${t[tid].name}: -${dmg} troops` })
          addMapAnimation('enemy_attack', null, tid)
        }
      }
    }

    // 4. Enemy counter-attack: LOWERED threshold — attack when troops > target troops (was +2)
    for (const [id, ter] of Object.entries(t)) {
      if (ter.owner !== 'enemy' || !ter.attackable || ter.troops < 3) continue
      // Smarter targeting: prioritize weakest player territory (skip already-zeroed targets)
      const weakTargets = (ter.neighbors || []).filter(nId => {
        const n = t[nId]
        return n && n.owner === 'player' && n.troops > 0 && ter.troops > n.troops
      })
      if (weakTargets.length === 0) continue
      // Sort by fewest troops (target weakest)
      weakTargets.sort((a, b) => t[a].troops - t[b].troops)
      const tid = weakTargets[0]
      const target = t[tid]

      // Can attempt USA attack if 8+ troop advantage
      if (tid === 'usa' && ter.troops - target.troops < 8) continue

      const aDice = Math.min(ter.troops - 1, 3)
      const dDice = Math.min(target.troops, 2)
      const aRolls = Array.from({ length: aDice }, () => randInt(1, 6)).sort((a, b) => b - a)
      const dRolls = Array.from({ length: dDice }, () => randInt(1, 6)).sort((a, b) => b - a)
      let aLoss = 0, dLoss = 0
      for (let i = 0; i < Math.min(aRolls.length, dRolls.length); i++) {
        if (aRolls[i] > dRolls[i]) dLoss++
        else aLoss++
      }
      const newEnemyTroops = t[id].troops - aLoss
      const newPlayerTroops = t[tid].troops - dLoss
      t[id] = { ...t[id], troops: newEnemyTroops }
      addMapAnimation('enemy_attack', null, tid)

      if (newPlayerTroops <= 0 && tid === 'usa') {
        // USA has fallen!
        t[tid] = { ...t[tid], troops: 0 }
        aiActions.push(`CRITICAL: ${ter.name} has overrun the homeland!`)
        terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] ★ THE HOMELAND HAS FALLEN ★` })
      } else if (newPlayerTroops <= 0) {
        // Enemy recaptures non-USA territory
        recapturedCount++
        const moveTroops = Math.min(3, newEnemyTroops - 1) || 1
        t[id] = { ...t[id], troops: newEnemyTroops - moveTroops }
        t[tid] = { ...t[tid], troops: moveTroops, owner: 'enemy', shield: false }
        aiActions.push(`ALERT: ${ter.name} recaptured ${t[tid].name}! [${aRolls}] vs [${dRolls}]`)
        terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] ${ter.name} RECAPTURED ${t[tid].name}!` })
      } else {
        t[tid] = { ...t[tid], troops: newPlayerTroops }
        const hl = pickRandom(DEFENSE_HEADLINES).replace('{country}', ter.name)
        aiActions.push(`${hl} [${aRolls}] vs [${dRolls}]`)
        terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] ${ter.name} attacks ${t[tid].name}: You -${dLoss}` })
      }
    }

    // 5. Enemy fortify: move spare troops between connected enemy territories
    const enemyIds = Object.entries(t).filter(([, ter]) => ter.owner === 'enemy' && ter.attackable).map(([id]) => id)
    for (const eid of enemyIds) {
      const eter = t[eid]
      if (eter.troops < 4) continue
      // Find neighbor enemy territory with fewer troops
      const weakNeighbors = (eter.neighbors || []).filter(nId =>
        t[nId]?.owner === 'enemy' && t[nId]?.attackable && t[nId].troops < eter.troops - 2
      )
      if (weakNeighbors.length > 0 && Math.random() < 0.3) {
        const target = pickRandom(weakNeighbors)
        const move = Math.min(2, eter.troops - 2)
        if (move > 0) {
          t[eid] = { ...t[eid], troops: t[eid].troops - move }
          t[target] = { ...t[target], troops: t[target].troops + move }
          terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] ${eter.name} fortifies ${t[target].name} +${move} troops` })
        }
      }
    }

    if (aiActions.length === 0) {
      aiActions.push('Enemy forces regroup. No hostile action this turn.')
      terminalEntries.push({ type: 'enemy', text: `[T${String(tn).padStart(2,'0')} ENEMY] Forces regroup. No hostile action.` })
    }

    // Israel message every 3-4 turns
    let israelBonus = 0
    if (tn % 3 === 0 || (tn % 4 === 0 && Math.random() < 0.5)) {
      const msg = pickRandom(ISRAEL_MESSAGES)
      israelBonus = Math.random() < 0.4 ? randInt(30, 80) : 0
      terminalEntries.push({ type: 'israel', text: `[T${String(tn).padStart(2,'0')} ISRAEL] ${msg}${israelBonus > 0 ? ` (+Ⓦ${israelBonus})` : ''}` })
    }

    // Apply AI changes + Israel bonus in one call
    setGame(prev => ({
      ...prev,
      territories: t,
      conqueredCount: Math.max(0, prev.conqueredCount - recapturedCount),
      warisk: prev.warisk + israelBonus,
      newsQueue: capNews([...prev.newsQueue, ...aiActions]),
      terminalLog: [...prev.terminalLog, ...terminalEntries].slice(-MAX_TERMINAL),
    }))
    showFeedback(aiActions.join(' │ '))

    // Auto-advance to BUILD after delay + random event (30% chance)
    const willTriggerEvent = Math.random() < 0.3
    const selectedEvent = willTriggerEvent ? pickRandom(EVENTS) : null

    const timer = setTimeout(() => {
      setGame(prev => {
        const updated = {}
        for (const [id, ter] of Object.entries(prev.territories)) {
          updated[id] = {
            ...ter,
            irradiated: ter.irradiated > 0 ? ter.irradiated - 1 : 0,
          }
        }
        const next = {
          ...prev,
          phase: 'build',
          turn: prev.turn + 1,
          territories: updated,
          doubleIncome: false,
          tripleIncome: false,
        }

        if (selectedEvent) {
          next.newsQueue = capNews([...next.newsQueue, selectedEvent.text])

          switch (selectedEvent.effect) {
            case 'double_income':
              next.doubleIncome = true
              break
            case 'add_150':
              next.warisk = (next.warisk || prev.warisk) + 150
              break
            case 'add_100':
              next.warisk = (next.warisk || prev.warisk) + 100
              break
            case 'add_80':
              next.warisk = (next.warisk || prev.warisk) + 80
              break
            case 'lose_50':
              next.warisk = Math.max(0, (next.warisk || prev.warisk) - 50)
              break
            case 'enemy_plus1':
              for (const [id, ter] of Object.entries(next.territories)) {
                if (ter.owner === 'enemy' && ter.attackable) {
                  next.territories[id] = { ...ter, troops: ter.troops + 1 }
                }
              }
              break
            case 'recruit_2': {
              const playerIds = Object.entries(next.territories)
                .filter(([, ter]) => ter.owner === 'player')
                .map(([id]) => id)
              if (playerIds.length > 0) {
                const rid = pickRandom(playerIds)
                next.territories[rid] = { ...next.territories[rid], troops: next.territories[rid].troops + 2 }
              }
              break
            }
            case 'free_missile':
              next.freeMissile = true
              break
            case 'free_nuke':
              next.freeNuke = true
              break
            case 'enemy_lose_troops': {
              const eLoseIds = Object.entries(next.territories)
                .filter(([, ter]) => ter.owner === 'enemy' && ter.attackable && ter.troops > 1)
                .map(([id]) => id)
              if (eLoseIds.length > 0) {
                const rid = pickRandom(eLoseIds)
                const loss = Math.min(randInt(2, 3), next.territories[rid].troops - 1)
                next.territories[rid] = { ...next.territories[rid], troops: next.territories[rid].troops - loss }
              }
              break
            }
            case 'shield_random': {
              const shieldIds = Object.entries(next.territories)
                .filter(([, ter]) => ter.owner === 'player' && !ter.shield)
                .map(([id]) => id)
              if (shieldIds.length > 0) {
                const rid = pickRandom(shieldIds)
                next.territories[rid] = { ...next.territories[rid], shield: true }
              }
              break
            }
            case 'building_destroyed': {
              const bldgIds = Object.entries(next.territories)
                .filter(([, ter]) => ter.owner === 'enemy' && ter.building)
                .map(([id]) => id)
              if (bldgIds.length > 0) {
                const rid = pickRandom(bldgIds)
                next.territories[rid] = { ...next.territories[rid], building: null }
              }
              break
            }
            case 'enemy_infight': {
              const fightable = Object.entries(next.territories)
                .filter(([, ter]) => ter.owner === 'enemy' && ter.attackable && ter.troops > 2)
                .map(([id]) => id)
              if (fightable.length >= 2) {
                const a = pickRandom(fightable)
                const b = pickRandom(fightable.filter(x => x !== a))
                if (b) {
                  const lossA = Math.min(randInt(1, 2), next.territories[a].troops - 1)
                  const lossB = Math.min(randInt(1, 2), next.territories[b].troops - 1)
                  next.territories[a] = { ...next.territories[a], troops: next.territories[a].troops - lossA }
                  next.territories[b] = { ...next.territories[b], troops: next.territories[b].troops - lossB }
                }
              }
              break
            }
            case 'boost_all':
              for (const [id, ter] of Object.entries(next.territories)) {
                if (ter.owner === 'player') {
                  next.territories[id] = { ...ter, troops: ter.troops + 1 }
                }
              }
              break
            case 'enemy_strike': {
              const strikeIds = Object.entries(next.territories)
                .filter(([, ter]) => ter.owner === 'player' && ter.troops > 1)
                .map(([id]) => id)
              if (strikeIds.length > 0) {
                const rid = pickRandom(strikeIds)
                const loss = Math.min(randInt(1, 2), next.territories[rid].troops - 1)
                next.territories[rid] = { ...next.territories[rid], troops: next.territories[rid].troops - loss }
              }
              break
            }
            case 'halve_cost':
              next.halveCost = true
              break
            case 'extra_income':
              next.tripleIncome = true
              break
            default: // 'none'
              break
          }

          next.terminalLog = addTerminalEntry(next.terminalLog || prev.terminalLog, 'event', `[T${String(next.turn).padStart(2,'0')} EVENT] ${selectedEvent.text}`)
        }

        return next
      })

      if (selectedEvent) {
        showFeedback(`EVENT: ${selectedEvent.text}`)
        SFX.eventAlert()
        setActiveEvent(selectedEvent)
      }
    }, 3000)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.phase])

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden ${shaking ? 'screen-shake' : ''}`}>
      {/* News Ticker */}
      <NewsTicker extraHeadlines={game.newsQueue} />

      {/* Top bar — live data */}
      <div className="relative z-10 border-b border-green-500/20 bg-bg-card/80 px-3 py-1">
        {/* Row 1: status + money */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-dim tracking-wider uppercase flex items-center gap-1.5">
            <span className="text-green-400">◆</span>
            <span className="hidden sm:inline">OPERATION ACTIVE │ </span>
            {conquered}/{TOTAL_ATTACKABLE} LIBERATED
          </div>
          <div className="text-sm text-gold-accent font-bold flex items-center gap-1">
            <img src="/warisk-coin.png" alt="W" className="w-4 h-4 inline-block" />
            {game.warisk}
            <span className="text-xs text-gold-accent/60">(+{game.tripleIncome ? wariskPerSec * 3 : game.doubleIncome ? wariskPerSec * 2 : wariskPerSec}/s{game.tripleIncome ? ' x3!' : game.doubleIncome ? ' x2!' : ''})</span>
          </div>
          <div className="text-xs text-text-dim flex items-center gap-1.5">
            <span className="hidden sm:inline">TURN {game.turn} │ </span>
            <span className="sm:hidden">T{game.turn} │ </span>
            {PHASE_LABELS[game.phase]}
            <button
              onClick={toggleMusic}
              className={`text-xs border px-2 py-0.5 cursor-pointer transition-all font-bold ${
                musicOn
                  ? 'border-green-500/60 text-green-400 hover:bg-green-500/10'
                  : 'border-gray-neutral/20 text-text-dim/40 hover:bg-gray-neutral/10'
              }`}
              title={musicOn ? 'Mute music' : 'Play music'}
            >
              {musicOn ? '♫' : '♪'}
              <span className="hidden sm:inline ml-1 text-[10px] tracking-widest">{musicOn ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* USA low troops warning */}
      {game.territories.usa && game.territories.usa.troops <= 3 && game.territories.usa.troops > 0 && (
        <div className="relative z-20 text-center py-1.5 bg-red-enemy/15 border-b border-red-enemy/30 animate-pulse">
          <span className="text-[11px] text-red-400 font-bold tracking-wider">
            ⚠ WARNING: USA HOMELAND DEFENSE CRITICAL — {game.territories.usa.troops} TROOP{game.territories.usa.troops !== 1 ? 'S' : ''} REMAINING ⚠
          </span>
        </div>
      )}

      {/* Feedback banner */}
      <ActionFeedback message={feedback} />

      {/* Instruction hint when item selected */}
      {selectedItem && (
        <div className="relative z-20 text-center py-1 bg-gold-accent/10 border-b border-gold-accent/20">
          <span className="text-xs text-gold-accent">
            ▸ {SHOP[selectedItem].name} selected — click a territory │
          </span>
          <button
            onClick={() => { setSelectedItem(null); setFeedback(null) }}
            className="text-xs text-red-400 ml-2 underline cursor-pointer"
          >
            cancel
          </button>
        </div>
      )}

      {/* Instruction hint for BUILD phase */}
      {game.phase === 'build' && !selectedItem && (
        <div className="relative z-20 text-center py-1 bg-green-500/10 border-b border-green-500/20">
          <span className="text-xs text-green-400">
            <span className="hidden sm:inline">▸ Buy items below, then click YOUR territory to place them. Click NEXT PHASE when done.</span>
            <span className="sm:hidden">▸ Buy below → tap YOUR territory</span>
          </span>
        </div>
      )}

      {/* Instruction hint for STRIKE phase */}
      {game.phase === 'strike' && !selectedItem && (
        <div className="relative z-20 text-center py-1 bg-red-enemy/10 border-b border-red-enemy/20">
          <span className="text-xs text-red-400">
            <span className="hidden sm:inline">▸ Buy weapons below, then click an ENEMY territory to strike. Click NEXT PHASE when done.</span>
            <span className="sm:hidden">▸ Buy weapon → tap ENEMY territory</span>
          </span>
        </div>
      )}

      {/* Instruction hint for ATTACK phase */}
      {game.phase === 'attack' && !selectedItem && (
        <div className="relative z-20 text-center py-1 bg-gold-accent/10 border-b border-gold-accent/20">
          <span className="text-xs text-gold-accent">
            {attackFrom
              ? <><span className="hidden sm:inline">{`▸ Attacking from ${game.territories[attackFrom]?.name} — click adjacent enemy territory │`}</span><span className="sm:hidden">{`▸ From ${game.territories[attackFrom]?.name} → tap enemy`}</span></>
              : <><span className="hidden sm:inline">▸ Click one of YOUR territories to attack from (or NEXT PHASE to skip)</span><span className="sm:hidden">▸ Tap YOUR territory to attack</span></>}
          </span>
          {attackFrom && (
            <button
              onClick={() => { setAttackFrom(null); setFeedback(null) }}
              className="text-xs text-red-400 ml-2 underline cursor-pointer"
            >
              cancel
            </button>
          )}
        </div>
      )}

      {/* Instruction hint for FORTIFY phase */}
      {game.phase === 'fortify' && !selectedItem && (
        <div className="relative z-20 text-center py-1 bg-blue-player/10 border-b border-blue-player/20">
          <span className="text-xs text-blue-player">
            {fortifyFrom
              ? <><span className="hidden sm:inline">{`▸ Moving from ${game.territories[fortifyFrom]?.name} — click adjacent friendly territory │`}</span><span className="sm:hidden">{`▸ From ${game.territories[fortifyFrom]?.name} → tap friendly`}</span></>
              : <><span className="hidden sm:inline">▸ Click a territory to move troops from (or END TURN to skip)</span><span className="sm:hidden">▸ Tap territory to move troops</span></>}
          </span>
          {fortifyFrom && (
            <button
              onClick={() => { setFortifyFrom(null); setFeedback(null) }}
              className="text-xs text-red-400 ml-2 underline cursor-pointer"
            >
              cancel
            </button>
          )}
        </div>
      )}

      {/* World Map */}
      <div className="relative z-10 flex-1 overflow-hidden min-h-0">
        <WorldMap
          territories={game.territories}
          hoveredTerritory={hoveredTerritory}
          setHoveredTerritory={setHoveredTerritory}
          onTerritoryClick={handleTerritoryClick}
          onAllyClick={handleAllyClick}
          attackFrom={attackFrom}
          fortifyFrom={fortifyFrom}
          dragGuardRef={mapDragRef}
          highlightedTargets={highlightedTargets}
          mapAnimations={mapAnimations}
          onCentroidsReady={setMapCentroids}
        />
      </div>

      {/* Game Terminal — event log */}
      <GameTerminal log={game.terminalLog || []} />

      {/* Action bar — redesigned bigger */}
      <div className="relative z-10 flex-shrink-0 border-t-2 border-green-500/40 bg-bg-card/95 action-bar-glow py-0.5">
        {/* Phase indicators */}
        <div className="flex items-center justify-between px-2 sm:px-4 pt-1 pb-0.5">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            {PHASE_ORDER.map(p => (
              <span
                key={p}
                className={`text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 whitespace-nowrap ${
                  p === game.phase
                    ? 'text-green-400 phase-active font-bold'
                    : 'text-text-dim/40'
                }`}
              >
                {p === game.phase ? '◆' : '◇'} <span className="hidden sm:inline">{PHASE_LABELS[p]}</span><span className="sm:hidden">{PHASE_LABELS[p].split(' ')[0].slice(0,3)}</span>
              </span>
            ))}
          </div>
          {game.phase === 'enemy_turn' ? (
            <span className="text-sm sm:text-lg text-red-enemy/60 px-3 sm:px-8 py-1 sm:py-3 tracking-wider animate-pulse font-bold whitespace-nowrap">
              ENEMY...
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* ABORT — only visible on mobile here */}
              <button
                onClick={onMenu}
                className="sm:hidden flex-shrink-0 text-xs border border-red-enemy/30 text-red-enemy/60 px-2 py-1.5 hover:bg-red-enemy/10 transition-all cursor-pointer"
              >
                ✕
              </button>
              <button
                onClick={handleNextPhase}
                disabled={!!diceData}
                className={`text-xs sm:text-sm border-2 px-3 sm:px-6 py-1.5 transition-all tracking-wider font-bold next-phase-btn btn-war whitespace-nowrap ${
                  diceData
                    ? 'border-gray-neutral/30 bg-gray-neutral/10 text-text-dim/40 cursor-not-allowed'
                    : 'border-green-500/50 bg-green-500/15 text-green-400 hover:bg-green-500/25 hover:border-green-500/70 cursor-pointer'
                }`}
              >
                <span className="hidden sm:inline">{game.phase === 'fortify' ? 'END TURN ▸' : 'NEXT PHASE ▸'}</span>
                <span className="sm:hidden">{game.phase === 'fortify' ? 'END ▸' : 'NEXT ▸'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-4 h-px bg-green-500/15" />

        {/* Shop items for current phase */}
        <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1 overflow-x-auto">
          {phaseItems.map(([key, item]) => {
            const effectiveCost = getEffectiveCost(key)
            const canAfford = game.warisk >= effectiveCost
            const isFree = effectiveCost === 0 && item.cost > 0
            const isSelected = selectedItem === key
            return (
              <button
                key={key}
                onClick={() => handleShopClick(key)}
                className={`flex-shrink-0 border px-3 sm:px-6 py-2 sm:py-3.5 text-xs sm:text-base transition-all cursor-pointer flex items-center gap-1.5 sm:gap-3 btn-war ${
                  isSelected
                    ? 'border-gold-accent/70 bg-gold-accent/20 text-gold-accent'
                    : canAfford
                      ? 'border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/15'
                      : 'border-gray-neutral/20 bg-transparent text-text-dim/40 cursor-not-allowed'
                }`}
              >
                <span className="font-bold">
                  <span className="hidden sm:inline">{item.name}</span>
                  <span className="sm:hidden">{SHOP_SHORT[key] || item.name}</span>
                </span>
                <span className={`flex items-center gap-1 ${canAfford ? 'text-gold-accent/70' : 'text-text-dim/30'}`}>
                  {isFree ? 'FREE' : <><img src="/warisk-coin.png" alt="W" className="w-3 h-3 sm:w-4 sm:h-4 inline-block" />{effectiveCost}</>}
                  {game.halveCost && effectiveCost > 0 && effectiveCost < item.cost && (
                    <span className="text-[8px] text-green-400 discount-badge">-50%</span>
                  )}
                </span>
              </button>
            )
          })}

          {/* Spacer + ABORT (desktop only — mobile ABORT is in phase row) */}
          <div className="flex-1" />
          <button
            onClick={onMenu}
            className="hidden sm:block flex-shrink-0 text-xs sm:text-base border border-red-enemy/30 text-red-enemy/60 px-3 sm:px-6 py-2 sm:py-3.5 hover:bg-red-enemy/10 transition-all cursor-pointer"
          >
            ABORT
          </button>
        </div>
      </div>
      {/* Dice combat overlay */}
      {diceData && (
        <DiceCombatOverlay data={diceData} onDone={() => setDiceData(null)} />
      )}

      {/* Fortify panel — choose troop amount */}
      {fortifyFrom && fortifyTo && (() => {
        const src = game.territories[fortifyFrom]
        const tgt = game.territories[fortifyTo]
        if (!src || !tgt) return null
        const maxMove = src.troops - 1
        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="border border-blue-player/40 bg-bg-card/95 p-6 min-w-[300px] max-w-sm">
              <div className="text-sm text-blue-player font-bold tracking-wider mb-4">TROOP TRANSFER</div>
              <div className="text-xs text-text-dim mb-1">From: <span className="text-text-main">{src.name} (▣ {src.troops})</span></div>
              <div className="text-xs text-text-dim mb-4">To: <span className="text-text-main">{tgt.name} (▣ {tgt.troops})</span></div>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setFortifyAmount(a => Math.max(1, a - 1))}
                  className="text-lg border border-blue-player/30 bg-blue-player/10 text-blue-player w-8 h-8 flex items-center justify-center hover:bg-blue-player/20 cursor-pointer"
                >-</button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-blue-player">{Math.min(fortifyAmount, maxMove)}</div>
                  <div className="text-[9px] text-text-dim">of {maxMove} available</div>
                </div>
                <button
                  onClick={() => setFortifyAmount(a => Math.min(maxMove, a + 1))}
                  className="text-lg border border-blue-player/30 bg-blue-player/10 text-blue-player w-8 h-8 flex items-center justify-center hover:bg-blue-player/20 cursor-pointer"
                >+</button>
              </div>
              {/* Quick buttons */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setFortifyAmount(1)} className="flex-1 text-[10px] border border-blue-player/20 text-blue-player/60 py-1 hover:bg-blue-player/10 cursor-pointer">MIN</button>
                <button onClick={() => setFortifyAmount(Math.ceil(maxMove / 2))} className="flex-1 text-[10px] border border-blue-player/20 text-blue-player/60 py-1 hover:bg-blue-player/10 cursor-pointer">HALF</button>
                <button onClick={() => setFortifyAmount(maxMove)} className="flex-1 text-[10px] border border-blue-player/20 text-blue-player/60 py-1 hover:bg-blue-player/10 cursor-pointer">MAX</button>
              </div>
              <div className="flex gap-2">
                <button onClick={confirmFortify} className="flex-1 border border-green-500/40 bg-green-500/10 text-green-400 py-2 text-xs tracking-wider hover:bg-green-500/20 cursor-pointer">TRANSFER</button>
                <button onClick={cancelFortify} className="flex-1 border border-red-enemy/30 text-red-enemy/60 py-2 text-xs tracking-wider hover:bg-red-enemy/10 cursor-pointer">CANCEL</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Event popup overlay */}
      {activeEvent && (
        <EventPopup event={activeEvent} onDone={() => setActiveEvent(null)} />
      )}

      {/* Mission Briefing overlay — shows on first load */}
      {showBriefing && (
        <MissionBriefing onDismiss={() => { setShowBriefing(false); localStorage.setItem('warisk_briefing_seen', '1') }} />
      )}
    </div>
  )
}

function DefeatScreen({ game, onMenu, onReplay }) {
  const conquered = Object.values(game.territories).filter(t => t.attackable && t.owner === 'player').length
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid-defeat" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EF4444" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-defeat)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="text-3xl md:text-5xl text-red-enemy"
          style={{ fontFamily: 'var(--font-military)' }}
        >
          MISSION FAILED
        </div>

        <div className="text-sm text-text-dim tracking-widest">
          ★ THE HOMELAND HAS FALLEN ★
        </div>

        <div className="border border-red-enemy/20 bg-bg-card/80 p-6 min-w-[300px] text-center">
          <div className="text-xs text-red-400 mb-4 tracking-wider">AFTER-ACTION REPORT</div>
          <div className="space-y-2 text-sm text-text-dim">
            <p>The United States has been overrun.</p>
            <p className="text-red-400 italic">"We came, we saw, we got our butts kicked."</p>
            <p className="text-[10px] mt-4 opacity-60">Turn {game.turn} │ Territories liberated: {conquered}</p>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={onReplay}
            className="border border-red-enemy/40 bg-red-enemy/10 text-red-400 px-6 py-2 text-xs tracking-widest uppercase hover:bg-red-enemy/20 transition-all cursor-pointer"
          >
            ▸ TRY AGAIN
          </button>
          <button
            onClick={onMenu}
            className="border border-gray-neutral/40 bg-gray-neutral/10 text-text-dim px-6 py-2 text-xs tracking-widest uppercase hover:bg-gray-neutral/20 transition-all cursor-pointer"
          >
            MAIN MENU
          </button>
          <button
            onClick={() => {
              const joke = pickRandom(DEFEAT_JOKES)
              const text = `🇺🇸 I lost the homeland on WARISK.FUN...\n\nLiberated ${conquered}/${TOTAL_ATTACKABLE} in ${game.turn} turns before falling.\n\n"${joke}"\n\nPlay free: warisk.fun`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
            }}
            className="border border-red-enemy/40 bg-red-enemy/10 text-red-400 px-6 py-2 text-xs tracking-widest uppercase hover:bg-red-enemy/20 transition-all cursor-pointer"
          >
            SHARE ON 𝕏
          </button>
        </div>
      </div>
    </div>
  )
}

function VictoryScreen({ game, onMenu, onReplay }) {
  const conquered = Object.values(game.territories).filter(t => t.attackable && t.owner === 'player').length
  const rank = getTitle(game.turn)
  const starsStr = '★'.repeat(rank.stars) + '☆'.repeat(5 - rank.stars)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid-victory" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22C55E" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-victory)" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="text-3xl md:text-5xl text-gold-accent"
          style={{ fontFamily: 'var(--font-military)' }}
        >
          FREEDOM DELIVERED
        </div>

        <div className="text-sm text-text-dim tracking-widest">
          ★ MISSION COMPLETE ★
        </div>

        {/* Rank */}
        <div className="text-center">
          <div className="text-gold-accent text-lg">{starsStr}</div>
          <div className="text-text-main text-sm tracking-wider">{rank.title}</div>
        </div>

        {/* Stats */}
        <div className="border border-green-500/20 bg-bg-card/80 p-6 min-w-[300px]">
          <div className="text-xs text-text-dim mb-4 tracking-wider">OPERATION SUMMARY</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-text-dim">Countries liberated:</span>
              <span>{conquered}/{TOTAL_ATTACKABLE}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-text-dim">Turns:</span>
              <span>{game.turn}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-text-dim">Nukes launched:</span>
              <span>{game.totalNukes}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-text-dim">Drones sent:</span>
              <span>{game.totalDrones}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-text-dim">Missiles fired:</span>
              <span>{game.totalMissiles}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-text-dim">Troops deployed:</span>
              <span>{game.totalTroopsDeployed}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-text-dim flex items-center gap-1"><img src="/warisk-coin.png" alt="W" className="w-4 h-4" />WARISK earned:</span>
              <span className="text-gold-accent">{game.totalWariskEarned}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-text-dim">Casualties:</span>
              <span className="text-red-enemy">CLASSIFIED</span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {(() => {
          const board = getLeaderboard()
          if (board.length === 0) return null
          return (
            <div className="border border-gold-accent/20 bg-bg-card/80 p-4 min-w-[300px]">
              <div className="text-xs text-gold-accent mb-3 tracking-wider">TOP OPERATIONS</div>
              <div className="space-y-1">
                {board.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span className="text-text-dim">
                      #{i + 1} │ {entry.turns} turns │ {(entry.difficulty || 'normal').toUpperCase()}
                    </span>
                    <span className="text-text-dim/50">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Buttons */}
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={onReplay}
            className="border border-green-500/40 bg-green-500/10 text-green-400 px-6 py-2 text-xs tracking-widest uppercase hover:bg-green-500/20 transition-all cursor-pointer"
          >
            ▸ NEW OPERATION
          </button>
          <button
            onClick={onMenu}
            className="border border-gray-neutral/40 bg-gray-neutral/10 text-text-dim px-6 py-2 text-xs tracking-widest uppercase hover:bg-gray-neutral/20 transition-all cursor-pointer"
          >
            MAIN MENU
          </button>
          <button
            onClick={() => {
              const jokes = VICTORY_JOKES[rank.stars] || VICTORY_JOKES[0]
              const joke = pickRandom(jokes)
              const starEmojis = '⭐'.repeat(rank.stars)
              const text = `🇺🇸 I liberated the world in ${game.turn} turns on WARISK.FUN!\n\nRank: ${rank.title} ${starEmojis}\nNukes: ${game.totalNukes} | Drones: ${game.totalDrones} | Missiles: ${game.totalMissiles}\n\n"${joke}"\n\nPlay free: warisk.fun`
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
            }}
            className="border border-green-500/40 bg-green-500/10 text-green-400 px-6 py-2 text-xs tracking-widest uppercase hover:bg-green-500/20 transition-all cursor-pointer"
          >
            SHARE ON 𝕏
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// APP — Top-level state machine
// ============================================================

// ----------------------------------------------------------
// SAVE / LOAD — localStorage persistence
// ----------------------------------------------------------
const SAVE_KEY = 'warisk_save'
const LEADERBOARD_KEY = 'warisk_leaderboard'

function saveGame(game) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)) } catch {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY) } catch {}
}

function getLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function addLeaderboardEntry(entry) {
  try {
    const board = getLeaderboard()
    board.push(entry)
    board.sort((a, b) => a.turns - b.turns)
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 10)))
  } catch {}
}

function createInitialGameState(difficulty = 'normal') {
  const diff = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.normal
  const territories = createInitialTerritories()
  // Scale enemy troops by difficulty
  for (const [id, t] of Object.entries(territories)) {
    if (t.owner === 'enemy' && t.attackable) {
      territories[id] = { ...t, troops: Math.max(1, Math.round(t.troops * diff.troopMult)) }
    }
  }
  return {
    phase: 'build',
    turn: 1,
    difficulty,
    warisk: diff.startMoney,
    territories,
    conqueredCount: 0,
    totalNukes: 0,
    totalDrones: 0,
    totalMissiles: 0,
    totalTroopsDeployed: 0,
    totalWariskEarned: 0,
    newsQueue: [],
    terminalLog: [],
    freeMissile: false,
    freeNuke: false,
    doubleIncome: false,
    halveCost: false,
    tripleIncome: false,
  }
}

export default function App() {
  const [screen, setScreen] = useState('menu')
  const [game, setGame] = useState(createInitialGameState)
  const [hasSave, setHasSave] = useState(() => !!loadGame())
  const [musicOn, setMusicOn] = useState(false)

  const toggleMusic = useCallback(() => {
    if (MusicEngine.isPlaying) {
      MusicEngine.stop()
      setMusicOn(false)
    } else {
      MusicEngine.start()
      setMusicOn(true)
    }
  }, [])

  // Count player territories and compute income
  const playerTerritories = Object.entries(game.territories)
    .filter(([, t]) => t.owner === 'player')
  const enemyTerritories = Object.entries(game.territories)
    .filter(([, t]) => t.owner === 'enemy')

  const wariskPerSec = BASE_INCOME
    + (playerTerritories.length * 1)
    + playerTerritories.reduce((sum, [, t]) => {
        if (t.building === 'factory') return sum + 4
        if (t.building === 'refinery') return sum + 10
        return sum
      }, 0)

  // Economy tick — runs every second while in game screen
  const wariskPerSecRef = useRef(wariskPerSec)
  wariskPerSecRef.current = wariskPerSec

  // Auto-save every 5 seconds while in game — use ref so interval isn't reset on every game update
  const gameRef = useRef(game)
  gameRef.current = game
  useEffect(() => {
    if (screen !== 'game') return
    const interval = setInterval(() => {
      saveGame(gameRef.current)
      setHasSave(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [screen])

  useEffect(() => {
    if (screen !== 'game') return
    const interval = setInterval(() => {
      setGame(prev => {
        const income = prev.tripleIncome ? wariskPerSecRef.current * 3 : prev.doubleIncome ? wariskPerSecRef.current * 2 : wariskPerSecRef.current
        return {
          ...prev,
          warisk: prev.warisk + income,
          totalWariskEarned: prev.totalWariskEarned + income,
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [screen])

  const goToGame = useCallback((difficulty = 'normal') => {
    setGame(createInitialGameState(difficulty))
    clearSave()
    setScreen('game')
  }, [])

  const resumeGame = useCallback(() => {
    const saved = loadGame()
    if (saved) {
      setGame(saved)
      setScreen('game')
    }
  }, [])

  const goToVictory = useCallback(() => {
    clearSave(); setHasSave(false)
    addLeaderboardEntry({
      turns: gameRef.current.turn,
      difficulty: gameRef.current.difficulty || 'normal',
      nukes: gameRef.current.totalNukes,
      date: new Date().toLocaleDateString(),
    })
    setScreen('victory')
  }, [])
  const goToDefeat = useCallback(() => { clearSave(); setHasSave(false); setScreen('defeat') }, [])
  const goToMenu = useCallback(() => { MusicEngine.stop(); setMusicOn(false); setScreen('menu') }, [])

  return (
    <div className="bg-bg min-h-screen">
      {screen === 'menu' && (
        <MenuScreen onStart={goToGame} hasSave={hasSave} onResume={resumeGame} />
      )}
      {screen === 'game' && (
        <GameScreen
          game={game}
          setGame={setGame}
          wariskPerSec={wariskPerSec}
          playerTerritories={playerTerritories}
          enemyTerritories={enemyTerritories}
          onVictory={goToVictory}
          onDefeat={goToDefeat}
          onMenu={goToMenu}
          musicOn={musicOn}
          toggleMusic={toggleMusic}
        />
      )}
      {screen === 'victory' && (
        <VictoryScreen
          game={game}
          onMenu={goToMenu}
          onReplay={() => goToGame(game.difficulty || 'normal')}
        />
      )}
      {screen === 'defeat' && (
        <DefeatScreen
          game={game}
          onMenu={goToMenu}
          onReplay={() => goToGame(game.difficulty || 'normal')}
        />
      )}
    </div>
  )
}
