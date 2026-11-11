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
 * The format-agnostic tracker engine: holds a Song and renders it sample by
 * sample into whatever buffer it's handed. Knows nothing about Web Audio,
 * worklets, or postMessage - a MixerEngine (mixer-engine.js) owns the
 * audio-API side and drives one or more of these. This is the part meant to
 * be the same shape in a C++ port (e.g. for the ESP32); on that platform a
 * Tracker likely just owns its TrackerEngine directly, calling it inline
 * from an I2S fill callback, with no messaging boundary at all.
 */
class TrackerEngine {
	constructor(mixingRate) {
		this.mixingRate = mixingRate;
		this.ready = false;
		this.playing = false;
		// called for out-of-band notifications (songLoaded, toggleLowPass, ...)
		// the owning Mixer sets this to forward them with its own trackerId
		this.onEvent = null;
	}

	/**
	 * Receives a freshly loaded Song (already parsed by a format-specific
	 * loader on the main thread - this class never touches raw file bytes)
	 */
	loadSong(song) {
		this.ready = false;
		this.playing = false;
		this.song = song;
		// NOTE: song.channelCount getter doesn't survive postMessage's structured
		// clone, so it's derived here directly from the cloned plain data instead
		const channelCount = song.patterns.length ? song.patterns[0].tracks.length : 0;

		this.channels = new Array(channelCount);
		this.bpm = song.initialTempo || 125;
		this.speed = song.initialSpeed || 6;
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

		this.emit('songLoaded', {
			title: song.title,
			channelCount: channelCount,
			patterns: song.patterns.length,
			positions: song.order.length
		});
	}

	emit(message, data) {
		if (this.onEvent) {
			this.onEvent(message, data);
		}
	}

	play() {
		if (this.ready) {
			this.playing = true;
		}
	}

	pause() {
		this.playing = false;
	}

	/**
	 * Jumps the playhead to a song position (an index into song.order) and
	 * decodes its first row immediately.
	 */
	seek(position) {
		if (!this.ready) {
			return;
		}

		this.position = Math.max(0, Math.min(position, this.song.order.length - 1));
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

	reset() {
		if (this.ready) {
			this.resetValues();
		}
	}

	setPlayingChannels(channels) {
		channels.forEach((active, i) => {
			const channel = this.channels[i];
			if (channel) {
				channel.off = !active;
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
		this.speed = this.song.initialSpeed || 6;
		this.bpm = this.song.initialTempo || 125;
		this.newTick = true;
		this.rowRepeat = 0;
		this.rowJump = -1;
		this.skipPattern = false;
		this.jumpPattern = -1;
		this.calcTickSpeed();
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
	 * Mixes this tracker's channels into outputs, starting at output index
	 * `offset` - the slice of the Mixer's total output list reserved for it.
	 * Does NOT zero the buffer first: the Mixer does that once for everything.
	 *
	 * @param {Float32Array[][]} outputs The Mixer's full output list, one
	 * stereo pair per reserved track slot, each pre-sized to the render quantum.
	 * @param {number} offset This tracker's first output index within outputs.
	 */
	render(outputs, offset) {
		const length = outputs[offset][0].length;
		// MOD's fixed Amiga PAL clock, used when the song doesn't declare its own
		// (S3M/IT declare their own PC-clock-based one via song.periodClock, since
		// they're tuned to a different hardware reference than the Amiga - see note.js)
		const periodClock = this.song.periodClock || 3546894.6;
		const globalVolume = (this.song.globalVolume != null ? this.song.globalVolume : 64) / 64.0;

		for (let i = 0; i < length; ++i) {
			this.tick();

			for (let chan = 0; chan < this.channels.length; ++chan) {
				const channel = this.channels[chan];
				const out = outputs[offset + chan];

				if (this.newTick && channel.cmd) {
					this.executeEffect(channel);
				}

				if (channel.off || !channel.period || !channel.instrument || channel.done || this.ticks < channel.delay) {
					continue;
				}

				const instrument = channel.instrument;

				// actually mix audio: mono sample panned to stereo (constant-power law,
				// gains precomputed once per row in decodeRow() rather than per sample)
				const value = (instrument.data[Math.floor(channel.samplePos)] * channel.volume * globalVolume) / 64.0;

				out[0][i] += value * channel.panLeft;
				out[1][i] += value * channel.panRight;

				const sampleSpeed = periodClock / (channel.period * this.mixingRate);
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

			// S3M/IT: an explicit volume-column value overrides the instrument's
			// default volume set above. MOD has no volume column, so note.volume
			// is always null there and this never fires.
			if (note.volume !== null) {
				channel.volume = note.volume;
			}

			if (note.note !== Pitch.NONE) {
				if (note.note === Pitch.CUT) {
					channel.volume = 0;
					channel.done = true;
				} else {
					channel.done = false;
					const period = this.song.format === 's3m'
						? periodForS3mNote(note.note, channel.instrument ? channel.instrument.c2spd : 8363)
						: PitchPeriods[note.note];

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
	}

	executeEffect(channel) {
		try {
			Effects[channel.cmd](this, channel);
		} catch (err) {
			console.warn(`effect not implemented: ${channel.cmd.toString(16).padStart(2, '0')}/${channel.data.toString(16).padStart(2, '0')}`);
		}
	}

	toggleLowPass(enabled) {
		this.emit('toggleLowPass', {
			activate: enabled
		});
	}
}

// see note.js for why this is needed (addModule loads files as isolated ES modules)
globalThis.TrackerEngine = TrackerEngine;

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
		}
	},
	/**
	 * Vibrato
	 */
	0x4(Module, channel) {
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
		}
	},
	/**
	 * Volume slide: regular slide happens every non-zero tick, exactly as before.
	 * S3M/XM also use this same byte for a "fine" slide (one nibble is 0xF *and*
	 * the other is non-zero) applied once, on tick 0 - previously always a no-op
	 * tick (both branches below require ticks>0), so adding it here changes
	 * nothing for plain MOD content (0xF0/0x0F, where one nibble is exactly 0,
	 * keep meaning "regular slide by 15" as before - only the genuine fine-slide
	 * byte range, 0xF1-0xFE / 0x1F-0xEF, is new).
	 */
	0xA(Module, channel) {
		const x = channel.data >> 4,
			y = channel.data & 0x0F;

		if (!Module.ticks) {
			if (x === 0xF && y > 0 && y < 0xF) {
				channel.volume -= y;
			} else if (y === 0xF && x > 0 && x < 0xF) {
				channel.volume += x;
			} else {
				return;
			}
		} else if (!y) {
			channel.volume += x;
		} else if (!x) {
			channel.volume -= y;
		} else {
			return;
		}

		if (channel.volume > 63) {
			channel.volume = 63;
		} else if (channel.volume < 0) {
			channel.volume = 0;
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
			Module.toggleLowPass(!!channel.data);
		}
	},
	/**
	 * Set Vibrato waveform + retrigger
	 */
	0xE4(Module, channel) {
		// not implemented
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
			} else if (Module.rowRepeat) {
				Module.rowRepeat--;
			}
		}
	},
	/**
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
	},
	/**
	 * Fine pitch slide up/down: like 0x1/0x2, but applied once, on tick 0 only
	 * (S3M's Fxx/Exx with param >= 0xE0, pre-translated by the loader into a
	 * plain 0-15 amount)
	 */
	[Effect.FINE_SLIDE_UP](Module, channel) {
		if (!Module.ticks) {
			channel.period -= channel.data;
			if (channel.period < 113) {
				channel.period = 113;
			}
		}
	},
	[Effect.FINE_SLIDE_DOWN](Module, channel) {
		if (!Module.ticks) {
			channel.period += channel.data;
			if (channel.period > 856) {
				channel.period = 856;
			}
		}
	},
	/**
	 * Set global (song-wide) volume, 0-64 - S3M's Vxx
	 */
	[Effect.SET_GLOBAL_VOLUME](Module, channel) {
		if (!Module.ticks) {
			Module.song.globalVolume = Math.min(64, channel.data);
		}
	},
	/**
	 * Set channel panning directly - S3M's Xxx (0=left, 255=right)
	 */
	[Effect.SET_PANNING](Module, channel) {
		if (!Module.ticks) {
			channel.pan = Math.min(1, channel.data / 255);
			const angle = channel.pan * (Math.PI / 2);
			channel.panLeft = Math.cos(angle);
			channel.panRight = Math.sin(angle);
		}
	}
}
