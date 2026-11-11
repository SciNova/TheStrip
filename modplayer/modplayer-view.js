class ModPlayerView {
	constructor(container) {
		this.canvas = container;
		this.ctx = this.canvas.getContext('2d');
		this.canvasWidth = this.canvas.width / 4;
		this.canvasHeight = this.canvas.height;
		this.player = null;
	}

	attach(player) {
		this.player = player;

		document.addEventListener('moduleLoaded', () => {
			if (!this.player.playing) {
				this.renderScope();
			}
		});
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
		let toRender;

		if (player.audioWorkletSupport) {
			toRender = [
				{ label: "chan 1", analyser: player.analysers[0], style: "rgba(53, 233, 255, 1)", edgeThreshold: 0, pos: 0 },
				{ label: "chan 2", analyser: player.analysers[1], style: "rgba(53, 233, 255, 1)", edgeThreshold: 0, pos: 1 },
				{ label: "chan 3", analyser: player.analysers[2], style: "rgba(53, 233, 255, 1)", edgeThreshold: 0, pos: 2 },
				{ label: "chan 4", analyser: player.analysers[3], style: "rgba(53, 233, 255, 1)", edgeThreshold: 0, pos: 3 }
			];
		} else {
			toRender = [
				{ label: "left", analyser: player.analysers[0], style: "rgba(53, 233, 255, 1)", edgeThreshold: 0, pos: 0 },
				{ label: "right", analyser: player.analysers[1], style: "rgba(53, 233, 255, 1)", edgeThreshold: 0, pos: 3 }
			];
		}

		this.ctx.fillStyle = "transparent";
		this.ctx.clearRect(0, 0, this.canvasWidth * 4, this.canvasHeight);

		toRender.forEach(({ analyser, label, style = "rgb(43, 156, 212)", edgeThreshold = 0, pos }, i) => {
			if (analyser === undefined) { return; }

			this.ctx.font = "12px Verdana";
			this.ctx.fillStyle = "rgba(255,255,255,0.8)";
			this.ctx.textAlign = "left";
			this.ctx.fillText(label, 46 + pos * this.canvasWidth, 15);

			if (!player.channels[i]) {
				this.ctx.font = "18px Arial";
				this.ctx.fillText('MUTE', 40 + pos * this.canvasWidth, 70);
				return;
			}

			const timeData = new Float32Array(analyser.frequencyBinCount);
			let risingEdge = 0;

			analyser.getFloatTimeDomainData(timeData);

			this.ctx.strokeStyle = style;
			this.ctx.fillStyle = style;

			while (timeData[risingEdge] > 0 &&
				risingEdge <= this.canvasWidth &&
				risingEdge < timeData.length) {
				risingEdge++;
			}

			if (risingEdge >= this.canvasWidth) { risingEdge = 0; }

			while (timeData[risingEdge] < edgeThreshold &&
				risingEdge <= this.canvasWidth &&
				risingEdge < timeData.length) {
				risingEdge++;
			}

			if (risingEdge >= this.canvasWidth) { risingEdge = 0; }

			for (let x = risingEdge; x < timeData.length && x - risingEdge < this.canvasWidth; x++) {
				const y = this.canvasHeight - (((timeData[x] + 1) / 2) * this.canvasHeight);
				this.ctx.fillRect(x - risingEdge + pos * this.canvasWidth, y, 1, 1);
			}
		});
	}
}
