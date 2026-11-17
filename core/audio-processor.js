import { Note } from './audio-common.js';

const Waveform = Object.freeze({
	SINUS: 'SINUS',
	SQUARE: 'SQUARE',
	SAWTOOTH: 'SAWTOOTH',
});

class Clock {
	constructor() {
		this.time = 0.0;
		this.timestamp = 0.0;
		this.delta = 0.0;
		this.update();
	}

	update() {
		const now = currentTime;
		this.delta = now - this.timestamp;
		this.timestamp = now;
		this.time = now;
	}
}

class System {
	constructor() {
		this.clock = new Clock();
		this.audio = null;
	}

	loop() {
		this.clock.update();
	}
}

class Sound {
	constructor() {
		this.playing = false;
	}

	stop() {
		this.playing = false;
	}
}

class SynthSound extends Sound {
	static VOLUME = 0.2;

	constructor(audio) {
		super();
		this.audio = audio;
		this.waveform = null;
		this.frequency = 0.0;
		this.duration = null;
		this.timestamp = 0.0;
		this.phase = 0.0;
	}

	play(waveform, frequency, duration = null) {
		this.waveform = waveform;
		this.frequency = frequency;
		this.duration = duration;
		this.timestamp = this.audio.system.clock.time;
		this.phase = 0.0;
		this.playing = true;
	}

	render() {
		if (!this.playing) {
			return 0.0;
		}
		if (this.duration !== null && (this.audio.system.clock.time - this.timestamp) >= this.duration) {
			this.stop();
			return 0.0;
		}

		let value;
		switch (this.waveform) {
			case Waveform.SINUS:
				value = Math.sin(2 * Math.PI * this.phase);
				break;
			case Waveform.SQUARE:
				value = this.phase < 0.5 ? 1.0 : -1.0;
				break;
			case Waveform.SAWTOOTH:
				value = 2 * this.phase - 1.0;
				break;
		}

		this.phase = (this.phase + this.frequency / sampleRate) % 1.0;
		return value * SynthSound.VOLUME;
	}
}

class Synth {
	static SLOT_COUNT = 10;

	constructor(audio) {
		this.audio = audio;
		this.sounds = new Array(Synth.SLOT_COUNT).fill(null);
		this.enabled = false;
	}

	start() {
		this.enabled = true;
	}

	play(waveform, frequency, duration = null, slot = null) {
		if (!this.enabled) {
			return;
		}

		let index;
		if (slot !== null) {
			index = Synth.SLOT_COUNT - slot;
		} else {
			index = this.sounds.findIndex((sound) => !sound || !sound.playing);
			if (index === -1) {
				index = 0;
				for (let i = 1; i < this.sounds.length; i++) {
					if (this.sounds[i].timestamp < this.sounds[index].timestamp) {
						index = i;
					}
				}
			}
		}

		const sound = new SynthSound(this.audio);
		sound.play(waveform, frequency, duration);
		this.sounds[index] = sound;
	}

	stop(slot = null) {
		if (slot === null) {
			this.enabled = false;
			for (const sound of this.sounds) {
				if (sound) {
					sound.stop();
				}
			}
			return;
		}

		const index = Synth.SLOT_COUNT - slot;
		if (this.sounds[index]) {
			this.sounds[index].stop();
		}
	}

	render() {
		const values = [];
		for (const sound of this.sounds) {
			if (sound && sound.playing) {
				values.push(sound.render());
			}
		}
		return values;
	}
}

class SamplerSound extends Sound {
	static VOLUME = 0.6;

	constructor(audio) {
		super();
		this.audio = audio;
		this.id = null;
		this.rate = 1.0;
		this.loop = false;
		this.duration = 0.0;
		this.timestamp = 0.0;
		this.position = 0.0;
	}

	play(id, note = null, rate = null, loop = false, duration = null) {
		this.id = id;
		if (rate !== null) {
			this.rate = rate;
		} else if (note !== null) {
			this.rate = note / Note.C2;
		}
		this.loop = loop;

		const data = this.audio.sampler.data.get(id);
		const naturalDuration = data ? (data.length / this.rate) / sampleRate : 0.0;
		this.duration = duration !== null ? duration : naturalDuration;

		this.timestamp = this.audio.system.clock.time;
		this.position = 0.0;
		this.playing = true;
	}

	render() {
		if (!this.playing) {
			return 0.0;
		}

		const data = this.audio.sampler.data.get(this.id);
		if (!data) {
			this.stop();
			return 0.0;
		}

		let elapsed = this.audio.system.clock.time - this.timestamp;
		if (elapsed >= this.duration) {
			if (!this.loop) {
				this.stop();
				return 0.0;
			}
			this.timestamp = this.audio.system.clock.time;
			this.position = 0.0;
			elapsed = 0.0;
		}

		if (this.position >= data.length) {
			return 0.0;
		}

		const index = Math.floor(this.position);
		const fraction = this.position - index;
		const a = data[index];
		const b = index + 1 < data.length ? data[index + 1] : 0.0;
		const value = a + (b - a) * fraction;

		this.position += this.rate;
		return value * SamplerSound.VOLUME;
	}
}

class Sampler {
	static SLOT_COUNT = 10;
	static READY_DELAY = 2.0;

	constructor(audio) {
		this.audio = audio;
		this.sounds = new Array(Sampler.SLOT_COUNT).fill(null);
		this.timestamp = null;
		this.data = new Map();
	}

	load() {
		this.timestamp = this.audio.system.clock.time;
	}

	get ready() {
		return this.timestamp !== null && (this.audio.system.clock.time - this.timestamp) >= Sampler.READY_DELAY;
	}

	play(id, note = null, rate = null, loop = false, duration = null, slot = null) {
		let index;
		if (slot !== null) {
			index = Sampler.SLOT_COUNT - slot;
		} else {
			index = this.sounds.findIndex((sound) => !sound || !sound.playing);
			if (index === -1) {
				index = 0;
				for (let i = 1; i < this.sounds.length; i++) {
					if (this.sounds[i].timestamp < this.sounds[index].timestamp) {
						index = i;
					}
				}
			}
		}

		const sound = new SamplerSound(this.audio);
		sound.play(id, note, rate, loop, duration);
		this.sounds[index] = sound;
	}

	stop(slot = null) {
		if (slot === null) {
			for (const sound of this.sounds) {
				if (sound) {
					sound.stop();
				}
			}
			return;
		}

		const index = Sampler.SLOT_COUNT - slot;
		if (this.sounds[index]) {
			this.sounds[index].stop();
		}
	}

	render() {
		const values = [];
		for (const sound of this.sounds) {
			if (sound && sound.playing) {
				values.push(sound.render());
			}
		}
		return values;
	}
}

class Audio extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = this.handleMessage.bind(this);

		this.system = new System();
		this.system.audio = this;

		this.synth = new Synth(this);
		this.sampler = new Sampler(this);
	}

	handleMessage(event) {
		try {
			const message = event.data;

			if (message.type === 'sampleData') {
				console.log('received sample data', message.id, message.data.length, 'frames');
				this.sampler.data.set(message.id, message.data);
				return;
			}

			const subsystem = message.target === 'synth' ? this.synth : this.sampler;

			if (message.action === 'start') {
				if (subsystem.start) {
					subsystem.start();
				} else if (subsystem.load) {
					subsystem.load();
				}
			} else if (message.action === 'play') {
				if (message.target === 'synth') {
					subsystem.play(message.waveform, message.frequency, message.duration, message.slot);
				} else {
					subsystem.play(message.id, message.note, message.rate, message.loop, message.duration, message.slot);
				}
			} else if (message.action === 'stop') {
				subsystem.stop(message.slot);
			}
		} catch (error) {
			console.error('handleMessage error:', error, JSON.stringify(event.data));
		}
	}

	process(inputs, outputs) {
		try {
			this.system.loop();

			const frameCount = (outputs[0] && outputs[0][0]) ? outputs[0][0].length : 0;
			const samples = new Float32Array(frameCount);
			for (let i = 0; i < frameCount; i++) {
				const values = [...this.synth.render(), ...this.sampler.render()];
				let sum = 0.0;
				for (const value of values) {
					sum += value;
				}
				samples[i] = sum;
			}

			for (const output of outputs) {
				for (const channel of output) {
					channel.set(samples);
				}
			}
		} catch (error) {
			console.error('process error:', error);
		}

		return true;
	}
}

registerProcessor('audio-processor', Audio);
