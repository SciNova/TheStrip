import { Audio as CoreAudio } from '../core/audio/Audio.js';
import { Tracker } from '../core/audio/Tracker.js';
import { Track } from '../core/audio/Track.js';
import { SoundEvent } from '../core/audio/SoundEvent.js';
import { Clock } from '../core/Clock.js';

function reconstructTrack(data) {
	const track = new Track();
	track.tempo = data.tempo;
	track.beatsPerMeasure = data.beatsPerMeasure;
	track.segments = data.segments.map((bars) =>
		bars.map((channels) =>
			channels.map((events) =>
				events.map((e) => new SoundEvent(e.sound, e.note, e.position, e.duration, e.volume, e.offset))
			)
		)
	);
	return track;
}

class Game {
	constructor() {
		this.sounds = new Array(CoreAudio.CHANNELS).fill(null);
		this.trackers = [];
		this.freeChannels = CoreAudio.CHANNELS;
	}
}

class System {
	constructor() {
		this.clock = new Clock();
		this.clock.now = () => currentTime;
		this.audio = null;
		this.sounds = new Array(CoreAudio.CHANNELS).fill(null);
		this.trackers = [];
		this.freeChannels = CoreAudio.CHANNELS;
		this.game = null;
		this.games = {};
	}

	loop() {
		this.clock.update();
	}

	loadGame(gameId) {
		if (gameId === null) {
			this.game = null;
			return;
		}
		let instance = this.games[gameId];
		if (!instance) {
			instance = new Game();
			this.games[gameId] = instance;
		}
		this.game = instance;
	}
}

export class AudioWorklet extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = this.handleMessage.bind(this);

		this.enabled = true;

		this.system = new System();
		this.engine = new CoreAudio(this.system);
		this.engine.sampleRate = sampleRate;
		this.system.audio = this.engine;

		this._samples = new Float32Array(128);
	}

	handleMessage(event) {
		try {
			const message = event.data;

			if (message.type === 'sampleData') {
				console.log('received sample data', message.id, message.data.length, 'frames');
				this.engine.data[message.id] = message.data;
				return;
			}

			if (message.type === 'track') {
				const tracker = new Tracker(this.engine, reconstructTrack(message.data), message.channel);
				tracker.id = message.id;
				return;
			}

			if (message.action === 'playTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				tracker.play(message.segment, message.segments, message.loop);
				return;
			}

			if (message.action === 'stopTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				if (tracker) {
					tracker.stop();
				}
				return;
			}

			if (message.action === 'pauseTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				if (tracker) {
					tracker.pause();
				}
				return;
			}

			if (message.action === 'resumeTrack') {
				const tracker = (this.system.game ?? this.system).trackers.find((t) => t.id === message.id);
				if (tracker) {
					tracker.resume();
				}
				return;
			}

			if (message.action === 'start') {
				this.enabled = true;
			} else if (message.action === 'loadGame') {
				this.system.loadGame(message.id);
			} else if (message.action === 'playSynth') {
				this.engine.playSynth(message.patch, message.frequency);
			} else if (message.action === 'playSynthCustom') {
				this.engine.playSynthCustom(message.waveform, message.frequency, message.duration, message.attack, message.decay, message.sustain, message.release,
					message.lfoWaveform, message.lfoFrequency, message.lfoDestination, message.lfoAmount, message.lfoSync,
					message.cutoff, message.resonance, message.instrument, message.offset);
			} else if (message.action === 'playSample') {
				this.engine.playSample(message.id, message.note, message.rate, message.loop, message.duration, message.volume,
					message.lfoWaveform, message.lfoFrequency, message.lfoDestination, message.lfoAmount, message.lfoSync,
					message.cutoff, message.resonance, message.offset);
			} else if (message.action === 'noteOff') {
				this.engine.noteOff();
			} else if (message.action === 'stop') {
				this.engine.stop();
			}
		} catch (error) {
			console.error('handleMessage error:', error, JSON.stringify(event.data));
		}
	}

	process(inputs, outputs) {
		if (!this.enabled) {
			return true;
		}

		try {
			this.system.loop();

			const frameCount = (outputs[0] && outputs[0][0]) ? outputs[0][0].length : 0;
			const samples = this._samples;
			for (let i = 0; i < frameCount; i++) {
				samples[i] = this.engine.render();
			}

			for (const output of outputs) {
				for (const channel of output) {
					channel.set(samples.subarray(0, frameCount));
				}
			}
		} catch (error) {
			console.error('process error:', error);
		}

		return true;
	}
}

registerProcessor('audio-processor', AudioWorklet);
