/**
 * MathQuest - SoundEngine
 * Sons sintéticos via Web Audio API (zero arquivos externos)
 */
const SoundEngine = (() => {
    'use strict';

    let audioCtx = null;
    let muted = false;
    const STORAGE_KEY = 'mathquest_sound_muted';

    function init() {
        muted = localStorage.getItem(STORAGE_KEY) === 'true';
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('[SoundEngine] Web Audio API não suportada');
        }
    }

    function isMuted() { return muted; }

    function toggleMute() {
        muted = !muted;
        localStorage.setItem(STORAGE_KEY, muted);
        return muted;
    }

    function ensureCtx() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
        ensureCtx(); if (!audioCtx || muted) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
    }

    // ACERTO: triade maior ascendente (C-E-G)
    function playSuccess() {
        playTone(523.25, 0.15, 'sine', 0.3, 0);      // C5
        playTone(659.25, 0.15, 'sine', 0.3, 0.1);     // E5
        playTone(783.99, 0.2, 'sine', 0.3, 0.2);      // G5
    }

    // ERRO: tom descendente suave (não punitivo)
    function playError() {
        playTone(440, 0.2, 'sine', 0.2, 0);           // A4
        playTone(349.23, 0.25, 'sine', 0.2, 0.15);    // F4
    }

    // CONQUISTA: fanfarra (C-E-G-C-E)
    function playAchievement() {
        playTone(523.25, 0.12, 'triangle', 0.3, 0);
        playTone(659.25, 0.12, 'triangle', 0.3, 0.1);
        playTone(783.99, 0.12, 'triangle', 0.3, 0.2);
        playTone(1046.5, 0.15, 'triangle', 0.3, 0.3);
        playTone(1318.5, 0.2, 'triangle', 0.3, 0.4);
    }

    // LEVEL UP: ascendente triunfal
    function playLevelUp() {
        playTone(392, 0.15, 'sine', 0.3, 0);          // G4
        playTone(523.25, 0.15, 'sine', 0.3, 0.12);    // C5
        playTone(659.25, 0.15, 'sine', 0.3, 0.24);    // E5
        playTone(783.99, 0.2, 'sine', 0.3, 0.36);     // G5
    }

    // CLICK: tick sutil
    function playClick() {
        playTone(800, 0.05, 'square', 0.1, 0);
    }

    return { init, isMuted, toggleMute, playSuccess, playError, playAchievement, playLevelUp, playClick };
})();

document.addEventListener('DOMContentLoaded', () => SoundEngine.init());
