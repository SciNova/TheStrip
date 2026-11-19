import { SampleID, LFODestination } from './audio-common.js';

export class Sample {
	constructor(path) {
		this.path = path;
		this.data = null;
	}

	get ready() {
		return this.data !== null;
	}

	async load(context) {
		const response = await fetch(this.path, { cache: 'no-store' });
		const arrayBuffer = await response.arrayBuffer();
		const audioBuffer = await context.decodeAudioData(arrayBuffer);
		this.data = audioBuffer.getChannelData(0).slice();
	}
}

class Synth {
	constructor(audio) {
		this.audio = audio;
		this.enabled = false;
	}

	start() {
		this.enabled = true;
		this.audio.postMessage({ action: 'start', target: 'synth' });
	}

	play(patch, frequency = null, slot = null) {
		this.play2(undefined, frequency ?? patch.frequency, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, patch, slot);
	}

	play2(waveform = null, frequency, duration = null, attack = null, decay = null, sustain = null, release = null,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = null, lfoAmount = null, lfoSync = null,
		cutoff = null, resonance = null, patch = null, slot = null) {
		if (!this.enabled) {
			return;
		}
		this.audio.postMessage({
			action: 'play', target: 'synth', waveform, frequency, duration, attack, decay, sustain, release,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, patch, slot,
		});
	}

	noteOff(slot = null) {
		this.audio.postMessage({ action: 'noteOff', target: 'synth', slot });
	}

	stop(slot = null) {
		if (slot === null) {
			this.enabled = false;
		}
		this.audio.postMessage({ action: 'stop', target: 'synth', slot });
	}
}

class Sampler {
	constructor(audio) {
		this.audio = audio;
		this.samples = new Map();
	}

	get ready() {
		return this.samples.size > 0 && [...this.samples.values()].every((sample) => sample.ready);
	}

	start() {
		this.audio.postMessage({ action: 'start', target: 'sampler' });
		this.load();
	}

	load() {
		if (this.samples.size > 0) {
			return;
		}

		for (const key of Object.keys(SampleID)) {
			if (key === 'path' || key === 'duration') {
				continue;
			}

			const id = SampleID[key];
			const sample = new Sample('/sounds/' + SampleID.path[key]);
			this.samples.set(id, sample);
			sample.load(this.audio.context).then(() => {
				console.log('loaded sample', key, sample.path, sample.data.length, 'frames');
				this.audio.postMessage({ type: 'sampleData', id, data: sample.data }, [sample.data.buffer]);
			}).catch((error) => {
				console.error('failed to load sample', key, sample.path, error);
			});
		}
	}

	play(id, slot = null) {
		this.play2(id, undefined, undefined, undefined, undefined, undefined,
			undefined, undefined, undefined, undefined, undefined, undefined, undefined, slot);
	}

	play2(id, note = null, rate = null, loop = false, duration = null, volume = 1.0,
		lfoWaveform = null, lfoFrequency = null, lfoDestination = LFODestination.NONE, lfoAmount = 1.0, lfoSync = false,
		cutoff = null, resonance = null, slot = null) {
		this.audio.postMessage({
			action: 'play', target: 'sampler', id, note, rate, loop, duration, volume,
			lfoWaveform, lfoFrequency, lfoDestination, lfoAmount, lfoSync, cutoff, resonance, slot,
		});
	}

	stop(slot = null) {
		this.audio.postMessage({ action: 'stop', target: 'sampler', slot });
	}
}

export class Audio {
	constructor(system) {
		this.context = null;
		this.node = null;
		this.system = system;
		this.synth = new Synth(this);
		this.sampler = new Sampler(this);
	}

	async init() {
		this.context = new AudioContext();
		await this.context.audioWorklet.addModule('/core/audio-processor.js');
		this.node = new AudioWorkletNode(this.context, 'audio-processor', {
			numberOfInputs: 0,
			numberOfOutputs: 1,
			outputChannelCount: [2],
		});
		this.node.port.onmessage = this.handleMessage.bind(this);
		this.node.connect(this.context.destination);
		await this.context.resume();
	}

	handleMessage(event) {
	}

	postMessage(message, transfer) {
		this.node.port.postMessage(message, transfer);
	}

	stop() {
		this.synth.stop();
		this.sampler.stop();
	}

	play(sound) {
		this.sampler.play(sound);
	}
}
