/**
 * Vibrato waveforms, used for the VIBRATO effect
 */
const waveForms = new Array(4);

// Sin waveform
waveForms[0] = new Float32Array(64);
// an amplitude of 64 is supposed to be enough
for (let i = 0; i < waveForms[0].length; ++i) {
	waveForms[0][i] = 64 * Math.sin(Math.PI * 2 * (i / 64));
}

/**
 * The actual tracker/player: holds a Song and renders it sample by sample.
 * Runs on the audio render thread (it IS the AudioWorkletProcessor), so the
 * only way in or out is via postMessage - see handleMessage() below.
 */
class ModPlayer extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessage = this.handleMessage.bind(this);
	}

	handleMessage(event) {
		switch (event.data.message) {
			case 'init':
				this.mixingRate = event.data.mixingRate;
				break;

			case 'loadSong':
				this.prepareSong(event.data.song);
				break;

			case 'setPlay':
				if (this.ready) {
					this.playing = event.data.playing;
				}
				break;

			case 'reset':
				if (this.ready) {
					this.resetValues();
				}
				break;

			case 'setPlayingChannels':
				event.data.channels.forEach((active, i) => {
					const channel = this.channels[i];
					if (channel) {
						channel.off = !active;
					}
				});
				break;

			case 'seek':
				if (this.ready) {
					this.position = Math.max(0, Math.min(event.data.position, this.song.order.length - 1));
					this.patternIndex = this.song.order[this.position];
					this.row = 0;
					this.ticks = 0;
					this.filledSamples = 0;
					this.newTick = true;
					this.rowRepeat = 0;
					this.rowJump = -1;
					this.skipPattern = false;
					this.jumpPattern = -1;
					for (let i = 0; i < this.channels.length; ++i) {
						this.channels[i].loopInitiated = false;
					}
					this.decodeRow();
				}
				break;
		}
	}

	postMessage(message) {
		this.port.postMessage(message);
	}

	process(inputs, outputs) {
		if (this.ready && this.playing) {
			this.mix(outputs);
		} else {
			this.emptyOutputBuffer(outputs);
		}

		return true;
	}

	emptyOutputBuffer(outputs) {
		const bufLength = outputs[0][0].length;

		for (let chan = 0; chan < outputs.length; ++chan) {
			for (let side = 0; side < outputs[chan].length; ++side) {
				for (let i = 0; i < bufLength; ++i) {
					outputs[chan][side][i] = 0.0;
				}
			}
		}
	}

	/**
	 * Receives a freshly loaded Song (already parsed by a format-specific
	 * loader on the main thread - this class never touches raw file bytes)
	 */
	prepareSong(song) {
		this.ready = false;
		this.song = song;
		// NOTE: song.channelCount getter doesn't survive postMessage's structured
		// clone, so it's derived here directly from the cloned plain data instead
		const channelCount = song.patterns.length ? song.patterns[0].tracks.length : 0;

		this.channels = new Array(channelCount);
		this.bpm = 125;
		this.speed = 6;
		this.position = 0;
		this.patternIndex = 0;
		this.row = 0;
		this.samplesPerTick = 0;
		this.filledSamples = 0;
		this.ticks = 0;
		this.newTick = true;
		this.rowRepeat = 0;
		this.rowJump = -1;
		this.skipPattern = false;
		this.jumpPattern = -1;
		this.started = false;

		this.calcTickSpeed();
		this.createChannels();
		this.resetValues();
		this.ready = true;

		this.postMessage({
			message: 'songLoaded',
			data: {
				title: song.title,
				channelCount: channelCount,
				patterns: song.patterns.length,
				positions: song.order.length
			}
		});
	}

	/**
	 * Resets song position to start and speed to default values and decode first row
	 */
	resetValues() {
		this.started = false;
		this.position = 0;
		this.row = 0;
		this.ticks = 0;
		this.filledSamples = 0;
		this.speed = 6;
		this.newTick = true;
		this.rowRepeat = 0;
		this.rowJump = -1;
		this.skipPattern = false;
		this.jumpPattern = -1;
		this.createChannels();
		this.decodeRow();
	}

	createChannels() {
		for (let i = 0; i < this.channels.length; ++i) {
			const channel = {
				instrument: null,
				samplePos: 0,
				period: 0,
				volume: 64,
				pan: 0.5,
				panLeft: Math.SQRT1_2,
				panRight: Math.SQRT1_2,
				slideTo: -1,
				slideSpeed: 0,
				delay: 0,
				vform: 0,
				vdepth: 0,
				vspeed: 0,
				vpos: 0,
				loopInitiated: false,
				id: i,
				cmd: 0
			};

			if (!this.channels[i]) {
				this.channels[i] = channel;
			} else {
				Object.assign(this.channels[i], channel);
			}
		}
	}

	/**
	 * Calculates the number of samples needed per tick
	 */
	calcTickSpeed() {
		this.samplesPerTick = ((this.mixingRate * 60) / this.bpm) / 24;
	}

	/**
	 * Tracker audio mixer
	 *
	 * @param {Float32Array[][]} outputs One stereo output pair per track,
	 * each pre-sized to the render quantum. Called every time the audio
	 * thread needs the buffer filled.
	 */
	mix(outputs) {
		const length = outputs[0][0].length;

		for (let i = 0; i < length; ++i) {
			for (let chan = 0; chan < this.channels.length; ++chan) {
				outputs[chan][0][i] = 0.0;
				outputs[chan][1][i] = 0.0;
			}

			this.tick();

			for (let chan = 0; chan < this.channels.length; ++chan) {
				const channel = this.channels[chan];

				if (this.newTick && channel.cmd) {
					this.executeEffect(channel);
				}

				if (channel.off || !channel.period || !channel.instrument || channel.done || this.ticks < channel.delay) {
					continue;
				}

				const instrument = channel.instrument;

				// actually mix audio: mono sample panned to stereo (constant-power law,
				// gains precomputed once per row in decodeRow() rather than per sample)
				const value = (instrument.data[Math.floor(channel.samplePos)] * channel.volume) / 64.0;

				outputs[chan][0][i] += value * channel.panLeft;
				outputs[chan][1][i] += value * channel.panRight;

				const sampleSpeed = 7093789.2 / ((channel.period * 2) * this.mixingRate);
				channel.samplePos += sampleSpeed;

				// repeat samples
				if (!channel.done) {
					if (!instrument.loopLength && !instrument.loopStart) {
						if (channel.samplePos > instrument.length) {
							channel.samplePos = 0;
							channel.done = true;
						}
					} else if (channel.samplePos >= (instrument.loopStart + instrument.loopLength)) {
						channel.samplePos = instrument.loopStart;
					}
				}
			}

			this.filledSamples++;
			this.newTick = false;
		}
	}

	/**
	 * Called for each sample inside the output audio buffer
	 * This calculates both when to goto next pattern row
	 * and sound playback rate
	 */
	tick() {
		if (this.filledSamples > this.samplesPerTick) {
			this.newTick = true;
			this.ticks++;
			this.filledSamples = 0;
			if (this.ticks > this.speed - 1) {
				this.ticks = 0;

				if (this.rowRepeat <= 0) {
					this.row++;
				}

				if (this.row > 63 || this.skipPattern) {
					this.skipPattern = false;
					if (this.jumpPattern > -1) {
						this.position = this.jumpPattern;
						this.jumpPattern = -1;
						this.getNextPattern();
					} else {
						this.getNextPattern(true);
					}
				}

				if (this.rowJump > -1) {
					this.row = this.rowJump;
					this.rowJump = -1;
				}

				if (this.row > 63) {
					this.row = 0;
				}

				this.decodeRow();
			}
		}
	}

	getNextPattern(updatePos) {
		updatePos && this.position++;

		// Loop ? Use loop parameter
		if (this.position > this.song.order.length - 1) {
			console.log('Warning: last position reached, going back to 0');
			this.position = 0;
		}

		for (let i = 0; i < this.channels.length; ++i) {
			this.channels[i].loopInitiated = false;
		}

		this.patternIndex = this.song.order[this.position];
	}

	decodeRow() {
		if (!this.started) {
			this.started = true;
			this.getNextPattern();
		}

		const pattern = this.song.patterns[this.patternIndex];

		for (let i = 0; i < this.channels.length; ++i) {
			const track = pattern.tracks[i];
			const note = track.notes[this.row];
			const channel = this.channels[i];

			channel.delay = 0;
			channel.pan = track.pan;
			const angle = channel.pan * (Math.PI / 2);
			channel.panLeft = Math.cos(angle);
			channel.panRight = Math.sin(angle);

			if (!note) {
				channel.cmd = 0;
				continue;
			}

			if (note.effect !== Effect.NONE) {
				channel.cmd = note.effect;
				channel.data = note.effectParam;
			} else {
				channel.cmd = 0;
			}

			if (note.instrument) {
				if (channel.cmd !== Effect.PORTAMENTO && channel.cmd !== Effect.VOLUME_SLIDE_PORTAMENTO) {
					channel.samplePos = 0;
				}
				channel.done = false;
				channel.instrument = note.instrument;
				channel.volume = note.instrument.volume;
			}

			if (note.note !== Pitch.NONE) {
				channel.done = false;
				const period = PitchPeriods[note.note];

				// portamento will slide to the period, keep the previous one
				if (channel.cmd !== Effect.PORTAMENTO && channel.cmd !== Effect.VOLUME_SLIDE_PORTAMENTO) {
					channel.period = period;
					channel.samplePos = 0;
				} else {
					channel.slideTo = period;
				}
			}
		}
	}

	executeEffect(channel) {
		try {
			Effects[channel.cmd](this, channel);
		} catch (err) {
			console.warn(`effect not implemented: ${channel.cmd.toString(16).padStart(2, '0')}/${channel.data.toString(16).padStart(2, '0')}`);
		}
	}

	toggleLowPass(enabled) {
		this.postMessage({
			message: 'toggleLowPass',
			data: {
				activate: enabled
			}
		});
	}
}

registerProcessor('mod-processor', ModPlayer);

const Effects = {
	/**
	 * Slide up
	 */
	0x1(Module, channel) {
		if (Module.ticks) {
			channel.period -= channel.data;

			if (channel.period < 113) {
				channel.period = 113;
			}
		}
	},
	/**
	 * Slide down
	 */
	0x2(Module, channel) {
		if (Module.ticks) {
			channel.period += channel.data;

			if (channel.period > 856) {
				channel.period = 856;
			}
		}
	},
	/**
	 * Portamento (slide to note)
	 */
	0x3(Module, channel, doNotInit) {
		// zero tick: init effect
		if (!Module.ticks) {
			if (!doNotInit && channel.data) {
				channel.slideSpeed = channel.data;
			}
			// channel.slideTo = channel.period;
		} else if (channel.slideTo && Module.ticks) {
			if (channel.period < channel.slideTo) {
				channel.period += channel.slideSpeed;
				if (channel.period > channel.slideTo) {
					channel.period = channel.slideTo;
				}
			} else if (channel.period > channel.slideTo) {
				channel.period -= channel.slideSpeed;
				if (channel.period < channel.slideTo) {
					channel.period = channel.slideTo;
				}
			}
		} else {
			console.log('portamento + volume slide: keeping previous values');
		}
	},
	/**
	 * Vibrato
	 */
	0x4(Module, channel) {
		// TODO: finish vibrato
		if (!Module.ticks) {
			var depth = channel.data & 0x0f,
				speed = (channel.data & 0xf0) >> 4;

			// use previous values if speed or depth isn't set
			if (speed && depth) {
				channel.vdepth = depth;
				channel.vspeed = speed;
			}

			// new note: reset vibrato position if retriggered is set
			if (channel.vform > 3) {
				channel.vpos = 0;
			}
		}

		// get current waveform table
		const table = waveForms[channel.vform & 0x3];
		// alter the note's period
		channel.period += (channel.vdepth * table[channel.vpos]) / 63.0;

		// advance vpos at each tick
		channel.vpos += channel.vspeed;
		// wrap around
		if (channel.vpos > 63) {
			channel.vpos = channel.vpos - 64;
		}
	},
	/**
	 * Volume Slide + Portamento (keep previous one)
	 */
	0x5(Module, channel) {
		// perform portamento
		this[0x3](Module, channel);
		// then volume slide
		this[0xA](Module, channel);
	},
	/**
	 * Volume Slide + Vibrato (keep previous)
	 */
	0x6(Module, channel) {
		// perform vibrato
		this[0x4](Module, channel);
		// then volume slide
		this[0xA](Module, channel);
	},
	/**
	 * set sample startOffset
	 */
	0x9(Module, channel) {
		if (!Module.ticks) {
			channel.samplePos = channel.data * 256;
			// does it happen on next line ?
			// channel.done = true;
		}
	},
	/**
	 * Volume slide: happens every non-zero tick
	 */
	0xA(Module, channel) {
		// do not execute effect on tick 0
		if (Module.ticks) {
			let x = channel.data >> 4,
				y = channel.data & 0x0F;

			if (!y) {
				channel.volume += x;
			} else if (!x) {
				channel.volume -= y;
			}

			if (channel.volume > 63) {
				channel.volume = 63;
			} else if (channel.volume < 0) {
				channel.volume = 0;
			}
		}
	},
	/**
	 * Position Jump
	 */
	0xB(Module, channel) {
		if (channel.data >= 0 && channel.data <= Module.song.patterns.length - 1) {
			Module.skipPattern = true;
			Module.jumpPattern = channel.data;
			Module.rowJump = 0;
		}
	},
	/**
	  * Set channel volume
	  */
	0xC(Module, channel) {
		if (!Module.ticks) {
			channel.volume = channel.data;
			if (channel.volume > 63) {
				channel.volume = 63;
			}
		}
	},
	/**
	 * Row jump
	 */
	0xD(Module, channel) {
		if (!Module.ticks) {
			Module.rowJump = ((channel.data & 0xf0) >> 4) * 10 + (channel.data & 0x0f);
			Module.skipPattern = true;
		}
	},
	/**
	 * Toggle low-pass filter
	 */
	0xE0(Module, channel) {
		if (!Module.ticks) {
			console.log('need to toggle lowPass', !!channel.data);
			Module.toggleLowPass(!!channel.data);
		}
	},
	/**
	 * Set Vibrato waveform + retrigger
	 */
	0xE4(Module, channel) {
		if (!Module.ticks) {
			// channel.vform = //
		}
	},
	/**
	 * Loop pattern
	 */
	0xE6(Module, channel) {
		if (!Module.ticks) {
			// called with 0: this is the loop start point
			if (channel.data === 0) {
				if (!channel.loopInitiated) {
					channel.loopInitiated = true;
					channel.loopStart = Module.row;
					channel.loopCount = 0;
				} else {
					if (channel.loops === channel.loopCount) {
						channel.loopInitiated = false;
					}
				}
			} else if (channel.loopInitiated) {
				Module.rowJump = channel.loopStart;
				if (!channel.loopCount) {
					// init loop count
					channel.loopCount = channel.data;
					channel.loops = 1;
				} else {
					channel.loops++;
				}
			}
		}
	},
	/**
	 * Retrigger note every xxxx ticks
	 */
	0xE9(Module, channel) {
		if (!((Module.ticks + 1) % channel.data)) {
			console.log('retriggering note!', Module.ticks + 1);
			// should we use repeat pos (if specified) instead ?)
			channel.samplePos = 0;
			channel.done = false;
		}
	},
	/**
	 * Add to volume
	 */
	0xEA(Module, channel) {
		if (!Module.ticks) {
			channel.volume += channel.data;
			if (channel.volume > 63) {
				channel.volume = 63;
			}
		}
	},
	/**
	 * Decrease volume
	 */
	0xEB(Module, channel) {
		if (!Module.ticks) {
			channel.volume -= channel.data;
			if (channel.volume < 0) {
				channel.volume = 0;
			}
		}
	},
	/**
	 * Delay sample start
	 */
	0xED(Module, channel) {
		if (!Module.ticks) {
			channel.delay = channel.data;
		}
	},
	/**
	 * Repeat Row
	 */
	0xEE(Module, channel) {
		if (!Module.ticks) {
			if (!Module.rowRepeat) {
				Module.rowRepeat = channel.data;
				console.log('setting repeat to', Module.rowRepeat);
			} else if (Module.rowRepeat) {
				Module.rowRepeat--;
			}
		}
	},
	/**
	 *
	 * Change playback speed
	 */
	0xF(Module, channel) {
		if (!Module.ticks) {
			if (channel.data < 32) {
				Module.speed = channel.data;
			} else {
				Module.bpm = channel.data;
				Module.calcTickSpeed();
			}
		}
	}
}
