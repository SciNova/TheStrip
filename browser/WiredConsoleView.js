import { WiredConsole } from '../core/WiredConsole.js';
import { Button } from '../core/Button.js';
import { StripView } from './StripView.js';
import { StripView3D } from './StripView3D.js';
import { WiredPadView } from './WiredPadView.js';

class WiredConsoleView {
	// Only the view repaint is capped below the display's refresh rate -
	// poll/loop still run every tick. Repainting (the 3D view especially,
	// a full WebGL scene) competes with the browser's own audio engine
	// for the same CPU/GPU, and repainting less often leaves it more room.
	static VIEW_UPDATE_INTERVAL = 1 / 15;

	constructor(resolution) {
		this.console = new WiredConsole(resolution);
		this.console.system.load = (path) => fetch(path).then((response) => response.arrayBuffer());
		this.console.system.clock.now = () => performance.now() / 1000;

		const padColumns = document.querySelectorAll('.padColumn');
		this.padViews = [
			new WiredPadView(padColumns[0], this.console.pads[0]),
			new WiredPadView(padColumns[1], this.console.pads[1]),
		];

		this.stripContainer = null;
		this.view = null;
		this.is3D = false;
		this.composeMode = false;
		this.timestamp = 0;
		this.registerHandlers();
	}

	registerHandlers() {
		this._boundHandleKeyDown = this.handleKeyDown.bind(this);
		this._boundHandleKeyUp = this.handleKeyUp.bind(this);
		document.addEventListener('keydown', this._boundHandleKeyDown);
		document.addEventListener('keyup', this._boundHandleKeyUp);
	}

	deregisterHandlers() {
		document.removeEventListener('keydown', this._boundHandleKeyDown);
		document.removeEventListener('keyup', this._boundHandleKeyUp);
	}

	setStripContainer(container) {
		this.stripContainer = container;
		this.view = new StripView(container, this.console.system);
		this.is3D = false;
	}

	updateView() {
		const now = this.console.system.clock.timestamp;
		if (now - this.timestamp < WiredConsoleView.VIEW_UPDATE_INTERVAL) {
			return;
		}
		this.timestamp = now;
		if (this.view)
			this.view.update();
	}

	handleKeyDown(e) {
		if (e.key === '+')
			this.padViews[0].swapPanel();
		if (e.key === '-')
			this.padViews[1].swapPanel();
		if (e.key.toLowerCase() === 'v')
			this.toggle3D();
		if (e.key.toLowerCase() === 'c')
			this.composeMode = !this.composeMode;
		if (e.key === 'F11')
			this.toggleFullscreen();

		const input = this.console;
		const homeId = this.console.pads[0].id;
		const guestId = this.console.pads[1].id;
		const systemTargetId = e.shiftKey ? guestId : homeId;

		if (e.key.toLowerCase() === 'p') input.inputs[systemTargetId][Button.POWER] = true;
		if (e.key.toLowerCase() === 'm') input.inputs[systemTargetId][Button.MENU] = true;
		if (e.key === ' ') input.inputs[systemTargetId][Button.PAUSE] = true;
		if (e.key.toLowerCase() === 'b') input.inputs[systemTargetId][Button.BT] = true;

		if (e.key === '1') input.inputs[homeId][Button.A] = true;
		if (e.key === '2') input.inputs[homeId][Button.B] = true;
		if (e.key === '3') input.inputs[homeId][Button.C] = true;
		if (e.key === '4') input.inputs[homeId][Button.D] = true;
		if (e.key === '5' || e.key === 'Enter') input.inputs[homeId][Button.FIRE] = true;
		if (e.key === '6') input.inputs[homeId][Button.FIRE2] = true;

		if (!(this.is3D && this.composeMode)) {
			if (e.key === 'ArrowUp') { input.inputs[homeId][Button.UP] = true; e.preventDefault(); }
			if (e.key === 'ArrowDown') { input.inputs[homeId][Button.DOWN] = true; e.preventDefault(); }
			if (e.key === 'ArrowLeft') { input.inputs[homeId][Button.LEFT] = true; e.preventDefault(); }
			if (e.key === 'ArrowRight') { input.inputs[homeId][Button.RIGHT] = true; e.preventDefault(); }
		}

		if (e.key === '7') input.inputs[guestId][Button.A] = true;
		if (e.key === '8') input.inputs[guestId][Button.B] = true;
		if (e.key === '9') input.inputs[guestId][Button.C] = true;
		if (e.key === '0') input.inputs[guestId][Button.D] = true;
	}

	handleKeyUp(e) {
		const input = this.console;
		const homeId = this.console.pads[0].id;
		const guestId = this.console.pads[1].id;
		const systemTargetId = e.shiftKey ? guestId : homeId;

		if (e.key.toLowerCase() === 'p') input.inputs[systemTargetId][Button.POWER] = false;
		if (e.key.toLowerCase() === 'm') input.inputs[systemTargetId][Button.MENU] = false;
		if (e.key === ' ') input.inputs[systemTargetId][Button.PAUSE] = false;
		if (e.key.toLowerCase() === 'b') input.inputs[systemTargetId][Button.BT] = false;

		if (e.key === '1') input.inputs[homeId][Button.A] = false;
		if (e.key === '2') input.inputs[homeId][Button.B] = false;
		if (e.key === '3') input.inputs[homeId][Button.C] = false;
		if (e.key === '4') input.inputs[homeId][Button.D] = false;
		if (e.key === '5' || e.key === 'Enter') input.inputs[homeId][Button.FIRE] = false;
		if (e.key === '6') input.inputs[homeId][Button.FIRE2] = false;

		if (!(this.is3D && this.composeMode)) {
			if (e.key === 'ArrowUp') { input.inputs[homeId][Button.UP] = false; e.preventDefault(); }
			if (e.key === 'ArrowDown') { input.inputs[homeId][Button.DOWN] = false; e.preventDefault(); }
			if (e.key === 'ArrowLeft') { input.inputs[homeId][Button.LEFT] = false; e.preventDefault(); }
			if (e.key === 'ArrowRight') { input.inputs[homeId][Button.RIGHT] = false; e.preventDefault(); }
		}

		if (e.key === '7') input.inputs[guestId][Button.A] = false;
		if (e.key === '8') input.inputs[guestId][Button.B] = false;
		if (e.key === '9') input.inputs[guestId][Button.C] = false;
		if (e.key === '0') input.inputs[guestId][Button.D] = false;
	}

	renderPad(index) {
		return this.padViews[index].render();
	}

	toggle3D() {
		if (!this.stripContainer)
			return;

		if (this.view)
			this.view.cleanup();

		this.is3D = !this.is3D;
		this.view = this.is3D
			? new StripView3D(this.stripContainer, this.console.system, () => this.composeMode)
			: new StripView(this.stripContainer, this.console.system);
	}

	toggleFullscreen() {
		if (!document.fullscreenElement)
			document.documentElement.requestFullscreen();
		else
			document.exitFullscreen();
	}
}

export { WiredConsoleView, StripView, StripView3D };
