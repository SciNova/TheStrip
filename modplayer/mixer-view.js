/**
 * Draws one oscilloscope trace per currently-reserved track across the
 * whole Mixer, regardless of which Tracker each one belongs to - so
 * selecting a second song just widens the strip with its own tracks next
 * to the first song's, and pausing one tracker just flatlines its slice.
 */
class MixerView {
	constructor(container) {
		this.canvas = container;
		this.ctx = this.canvas.getContext('2d');
		this.mixer = null;
		this.running = false;
	}

	attach(mixer) {
		this.mixer = mixer;

		this.resize();
		window.addEventListener('resize', () => this.resize());
		this.start();
	}

	/**
	 * Matches the canvas's internal drawing-buffer width to its actual
	 * displayed (CSS) width, so the scopes stay crisp instead of being
	 * stretched/blurred by the browser from a fixed-size buffer.
	 */
	resize() {
		const displayWidth = Math.floor(this.canvas.clientWidth) || this.canvas.width;

		if (displayWidth && displayWidth !== this.canvas.width) {
			this.canvas.width = displayWidth;
		}
	}

	start() {
		if (this.running) {
			return;
		}

		this.running = true;
		const loop = () => {
			this.renderScope();
			requestAnimationFrame(loop);
		};
		loop();
	}

	/**
	 * render adapted from https://github.com/acarabott/audio-dsp-playground (MIT Licence)
	 */
	renderScope() {
		const mixer = this.mixer;
		const channelCount = mixer ? mixer.currentCapacity : 0;
		const canvasHeight = this.canvas.height;

		this.ctx.fillStyle = "transparent";
		this.ctx.clearRect(0, 0, this.canvas.width, canvasHeight);

		if (!channelCount) {
			return;
		}

		const canvasWidth = this.canvas.width / channelCount;

		for (let i = 0; i < channelCount; ++i) {
			const analyser = mixer.analysers[i];

			if (!analyser) {
				continue;
			}

			const timeData = new Float32Array(analyser.frequencyBinCount);
			let risingEdge = 0;

			analyser.getFloatTimeDomainData(timeData);

			this.ctx.strokeStyle = "rgba(53, 233, 255, 1)";
			this.ctx.fillStyle = "rgba(53, 233, 255, 1)";

			while (timeData[risingEdge] > 0 &&
				risingEdge <= canvasWidth &&
				risingEdge < timeData.length) {
				risingEdge++;
			}

			if (risingEdge >= canvasWidth) { risingEdge = 0; }

			while (timeData[risingEdge] < 0 &&
				risingEdge <= canvasWidth &&
				risingEdge < timeData.length) {
				risingEdge++;
			}

			if (risingEdge >= canvasWidth) { risingEdge = 0; }

			for (let x = risingEdge; x < timeData.length && x - risingEdge < canvasWidth; x++) {
				const y = canvasHeight - (((timeData[x] + 1) / 2) * canvasHeight);
				this.ctx.fillRect(x - risingEdge + i * canvasWidth, y, 1, 1);
			}
		}
	}
}
