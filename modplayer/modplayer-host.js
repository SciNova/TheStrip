/**
 * Thin main-thread shim: owns the AudioContext/node graph and relays
 * messages to the real player (ModPlayer, running inside mod-processor.js
 * on the audio thread). This class is NOT the player - it's the connection
 * to it, plus the one thing that genuinely belongs on the main thread:
 * loading a file into a Song via a format-specific loader.
 */
class ModPlayerHost {
	constructor() {
		this.context = null;
		this.workletNode = null;
		this.filterNode = null;
		this.gainNode = null;
		this.analysers = [];
		this.mixingRate = 44100;
		this.playing = false;
		this.ready = true;
		this.loaded = false;
		this.channels = [];
		this.song = null;
		this.moduleAdded = false;
		this._volume = 1.0;
	}

	get volume() {
		return this._volume;
	}

	set volume(v) {
		this._volume = Math.max(0, Math.min(1, v));
		if (this.gainNode) {
			this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
			this.gainNode.gain.value = this._volume;
		}
	}

	init() {
		this.context = new (window.AudioContext || window.webkitAudioContext)();
		this.mixingRate = this.context.sampleRate;

		return Promise.resolve();
	}

	async loadModule(module) {
		if (!this.ready) {
			return;
		}

		this.ready = false;
		this.loaded = false;
		this.wasPlaying = this.playing;

		this.pause();

		const buffer = typeof module === 'string' ?
			await this.loadBinaryFromURL(module) :
			await this.loadBinaryFromLocalFile(module);

		const song = ModLoader.load(buffer);

		await this.buildGraph(song.channelCount);

		this.song = song;
		this.channels = new Array(song.channelCount).fill(true);

		this.postMessage({
			message: 'loadSong',
			song: song
		});

		this.ready = true;
	}

	async loadBinaryFromURL(url) {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`${response.statusText} (${response.status})`);
		}

		return await response.arrayBuffer();
	}

	loadBinaryFromLocalFile(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e) => resolve(e.target.result);
			reader.onerror = (e) => reject('Error : ' + e.type);
			reader.readAsArrayBuffer(file);
		});
	}

	/**
	 * Builds (or rebuilds, if the channel count changed) the AudioWorkletNode
	 * and one analyser per track. Each track's worklet output is stereo, pre-panned
	 * by the player itself - multiple stereo connections into the same destination
	 * sum natively, so no merger node is needed regardless of channel count.
	 */
	async buildGraph(channelCount) {
		if (this.workletNode) {
			this.workletNode.disconnect();
			this.analysers.forEach((analyser) => analyser.disconnect());
		}

		if (!this.moduleAdded) {
			await this.context.audioWorklet.addModule('note.js');
			await this.context.audioWorklet.addModule('instrument.js');
			await this.context.audioWorklet.addModule('track.js');
			await this.context.audioWorklet.addModule('pattern.js');
			await this.context.audioWorklet.addModule('song.js');
			await this.context.audioWorklet.addModule('mod-processor.js');
			this.moduleAdded = true;
		}

		if (!this.filterNode) {
			this.filterNode = this.context.createBiquadFilter();
			this.filterNode.frequency.value = 22050;
		}

		if (!this.gainNode) {
			this.gainNode = this.context.createGain();
			this.gainNode.gain.value = this._volume;
			this.filterNode.connect(this.gainNode);
			this.gainNode.connect(this.context.destination);
		}

		this.workletNode = new AudioWorkletNode(this.context, 'mod-processor', {
			outputChannelCount: new Array(channelCount).fill(2),
			numberOfInputs: 0,
			numberOfOutputs: channelCount
		});

		this.workletNode.port.onmessage = this.handleMessage.bind(this);
		this.workletNode.port.start();

		this.analysers = [];

		for (let i = 0; i < channelCount; ++i) {
			const analyser = this.context.createAnalyser();
			analyser.fftSize = 256;
			analyser.minDecibels = -90;
			analyser.maxDecibels = -10;
			analyser.smoothingTimeConstant = 0.65;

			this.workletNode.connect(analyser, i, 0);
			this.workletNode.connect(this.filterNode, i);

			this.analysers.push(analyser);
		}

		this.postMessage({
			message: 'init',
			mixingRate: this.mixingRate
		});
	}

	setLowPass(activate) {
		this.filterNode.frequency.value = activate && 6000 || 22050;
	}

	handleMessage(message) {
		switch (message.data.message) {
			case 'songLoaded': {
				this.loaded = true;
				const event = new Event('songLoaded');
				event.data = message.data.data;
				event.data.wasPlaying = this.wasPlaying;
				document.dispatchEvent(event);
				break;
			}

			case 'toggleLowPass':
				this.setLowPass(message.data.data.activate);
				break;

			default: {
				this.loaded = true;
				document.dispatchEvent(new Event(message.data.message));
			}
		}
	}

	postMessage(message) {
		// no-op before the first song's loadModule() has built the graph
		if (!this.workletNode) {
			return;
		}

		this.workletNode.port.postMessage(message);
	}

	play(fadeDuration = 0) {
		if (!this.loaded) {
			console.log('No module loaded');
			return;
		}

		// on Safari macOS/iOS, the audioContext is suspended if it's not created
		// in the event handler of a user action: we attempt to resume it.
		if (this.context.state === 'suspended') {
			this.context.resume();
		}

		console.log('Playing module...');

		if (this.playing) {
			this.pause(fadeDuration);
			return;
		}

		this.playing = true;
		this.fadeIn(fadeDuration);
		this.sendPlayingStatus();
	}

	stop(fadeDuration = 0) {
		console.log('Stopping playback');

		const finish = () => {
			this.playing = false;
			this.sendPlayingStatus();
			if (this.ready) {
				this.postMessage({
					message: 'reset'
				});
			}
			this.setLowPass(false);
		};

		if (fadeDuration > 0 && this.playing) {
			this.fadeOut(fadeDuration);
			setTimeout(finish, fadeDuration * 1000);
		} else {
			finish();
		}
	}

	pause(fadeDuration = 0) {
		console.log('Pausing module...');

		if (fadeDuration > 0) {
			this.fadeOut(fadeDuration);
			setTimeout(() => {
				this.playing = false;
				this.sendPlayingStatus();
			}, fadeDuration * 1000);
		} else {
			this.playing = false;
			this.sendPlayingStatus();
		}
	}

	fadeIn(duration) {
		this.fadeTo(0, this._volume, duration);
	}

	fadeOut(duration) {
		this.fadeTo(this.gainNode ? this.gainNode.gain.value : this._volume, 0, duration);
	}

	fadeTo(startVolume, targetVolume, duration) {
		if (!this.gainNode) {
			return;
		}

		const now = this.context.currentTime;
		this.gainNode.gain.cancelScheduledValues(now);
		this.gainNode.gain.setValueAtTime(startVolume, now);

		if (duration > 0) {
			this.gainNode.gain.linearRampToValueAtTime(targetVolume, now + duration);
		} else {
			this.gainNode.gain.value = targetVolume;
		}
	}

	seek(pattern) {
		if (!this.ready) {
			return;
		}

		this.postMessage({
			message: 'seek',
			position: pattern
		});
	}

	sendPlayingStatus() {
		this.postMessage({
			message: 'setPlay',
			playing: this.playing
		});
	}

	setPlayingChannels(channels) {
		this.postMessage({
			message: 'setPlayingChannels',
			channels: channels
		});

		this.channels = channels;
	}
}
