import { LFO } from './LFO.js';
import { Sound } from './Sound.js';
import { LFODestination } from './LFODestination.js';

export class Audio {
	static CHANNELS = 10;

	constructor(system) {
		this.sampleRate = 48000;
		this.system = system;
		this.timestamp = 0.0;
		this.channels = new Float32Array(Audio.CHANNELS);
		this.data = [];
		this.lfo = new LFO(this);
		this.system.sounds = new Array(Audio.CHANNELS).fill(null);
		this.system.trackers = [];
		this.system.freeChannels = Audio.CHANNELS;
	}

	playSynth(patch, frequency = null) {
		this.playSynthCustom(undefined, frequency ?? patch.frequency, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, patch);
	}

	playSynthCustom(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, patch = null, offset = null) {
		const sound = new Sound(this);
		sound.playSynth(waveform, frequency, duration, attack, decay, sustain, release, lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, patch, offset);
		(this.system.game ?? this.system).sounds[this.freeChannel()] = sound;
	}

	freeChannel() {
		const sounds = (this.system.game ?? this.system).sounds;
		const freeChannels = (this.system.game ?? this.system).freeChannels;
		let index = -1;
		for (let i = 0; i < freeChannels; i++) {
			if (!sounds[i]) {
				index = i;
				break;
			}
		}
		if (index === -1) {
			index = 0;
			for (let i = 1; i < freeChannels; i++) {
				if (sounds[i].timestamp < sounds[index].timestamp) {
					index = i;
				}
			}
		}
		return index;
	}

	playSample(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, offset = null) {
		const sound = new Sound(this);
		sound.playSample(id, note, rate, loop, duration, volume, lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, offset);
		(this.system.game ?? this.system).sounds[this.freeChannel()] = sound;
	}

	render() {
		const sounds = (this.system.game ?? this.system).sounds;
		for (let i = 0; i < sounds.length; i++) {
			this.channels[i] = sounds[i] ? sounds[i].render() : 0.0;
		}
		for (const tracker of (this.system.game ?? this.system).trackers) {
			if (tracker.playing) {
				tracker.render();
			}
		}

		let sum = 0.0;
		for (const value of this.channels) {
			sum += value;
		}

		this.timestamp += 1 / this.sampleRate;
		return sum;
	}

	noteOff() {
		const sounds = (this.system.game ?? this.system).sounds;
		for (const sound of sounds) {
			if (sound) {
				sound.noteOff();
			}
		}
	}

	stop() {
		const sounds = (this.system.game ?? this.system).sounds;
		for (const sound of sounds) {
			if (sound) {
				sound.stop();
			}
		}
	}
}
