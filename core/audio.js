import { SampleID } from './audio-common.js';

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

	play(waveform, frequency, duration = null, slot = null) {
		if (!this.enabled) {
			return;
		}
		this.audio.postMessage({ action: 'play', target: 'synth', waveform, frequency, duration, slot });
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

	play(id, note = null, rate = null, loop = false, duration = null, slot = null) {
		this.audio.postMessage({ action: 'play', target: 'sampler', id, note, rate, loop, duration, slot });
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
