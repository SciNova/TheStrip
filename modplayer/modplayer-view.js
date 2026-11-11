class ModPlayerView {
	constructor(container) {
		this.canvas = container;
		this.ctx = this.canvas.getContext('2d');
		this.player = null;
	}

	attach(player) {
		this.player = player;

		this.resize();
		window.addEventListener('resize', () => this.resize());

		document.addEventListener('songLoaded', () => {
			if (!this.player.playing) {
				this.renderScope();
			}
		});
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

			if (this.player && !this.player.playing) {
				this.renderScope();
			}
		}
	}

	start() {
		if (this.player && this.player.playing) {
			this.renderScope();
			requestAnimationFrame(this.start.bind(this));
		}
	}

	/**
	 * render adapted from https://github.com/acarabott/audio-dsp-playground (MIT Licence)
	 */
	renderScope() {
		const player = this.player;
		const channelCount = player.song ? player.song.channelCount : 0;
		const canvasWidth = this.canvas.width / (channelCount || 1);
		const canvasHeight = this.canvas.height;

		this.ctx.fillStyle = "transparent";
		this.ctx.clearRect(0, 0, this.canvas.width, canvasHeight);

		for (let i = 0; i < channelCount; ++i) {
			const analyser = player.analysers[i];

			if (!analyser) {
				continue;
			}

			if (!player.channels[i]) {
				this.ctx.font = "18px Arial";
				this.ctx.fillText('MUTE', 40 + i * canvasWidth, 70);
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
