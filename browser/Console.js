import { System } from '../core/System.js';
import { PcbPanelModel, PANEL_CLASSES } from './Panel.js';
import { StripView } from './StripView.js';
import { StripView3D } from './StripView3D.js';

class Console {
	static ARROW_DIRECTION_INDEX = {
		ArrowUp: 0,
		ArrowDown: 1,
		ArrowLeft: 2,
		ArrowRight: 3,
	};

	constructor(resolution) {
		this.system = new System(resolution);
		this.system.load = (path) => fetch(path).then((response) => response.arrayBuffer());
		this.system.clock.now = () => performance.now() / 1000;
		this.pads = [null, null];
		this.stripContainer = null;
		this.view = null;
		this.is3D = false;
		this.composeMode = false;
		this.panelSvgCache = {};
		this.registerHandlers();
	}

	async loadPanelSvg(model) {
		if (model === PcbPanelModel.NONE)
			return '';
		if (!this.panelSvgCache[model]) {
			const res = await fetch(`/svg/panels/${model}.svg`);
			this.panelSvgCache[model] = await res.text();
		}
		return this.panelSvgCache[model];
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
		this.view = new StripView(container, this.system);
		this.is3D = false;
	}

	updateView() {
		if (this.view)
			this.view.update();
	}

	handleKeyDown(e) {
		if (e.key === '+')
			this.swapPanel(0);
		if (e.key === '-')
			this.swapPanel(1);
		if (e.key.toLowerCase() === 'v')
			this.toggle3D();
		if (e.key.toLowerCase() === 'c')
			this.composeMode = !this.composeMode;
		if (e.key === 'F11')
			this.toggleFullscreen();

		const home = this.pads[0];
		const guest = this.pads[1];

		const systemTarget = e.shiftKey ? guest : home;
		if (systemTarget) {
			if (e.key.toLowerCase() === 'p')
				systemTarget.setSystemButtonPressed(0, true);
			if (e.key.toLowerCase() === 'm')
				systemTarget.setSystemButtonPressed(1, true);
			if (e.key === ' ')
				systemTarget.setSystemButtonPressed(2, true);
			if (e.key.toLowerCase() === 'b')
				systemTarget.setSystemButtonPressed(3, true);
		}

		if (home) {
			if (e.key === '1')
				home.setNamedButtonPressed(0, true);
			if (e.key === '2')
				home.setNamedButtonPressed(1, true);
			if (e.key === '3')
				home.setNamedButtonPressed(2, true);
			if (e.key === '4')
				home.setNamedButtonPressed(3, true);
			if (e.key === '5' || e.key === 'Enter')
				home.setDirectionPressed(4, true);
			if (e.key === '6')
				home.setDirectionPressed(5, true);

			const arrowIdx = Console.ARROW_DIRECTION_INDEX[e.key];
			if (arrowIdx !== undefined && !(this.is3D && this.composeMode)) {
				home.setDirectionPressed(arrowIdx, true);
				e.preventDefault();
			}
		}
		if (guest) {
			if (e.key === '7')
				guest.setNamedButtonPressed(0, true);
			if (e.key === '8')
				guest.setNamedButtonPressed(1, true);
			if (e.key === '9')
				guest.setNamedButtonPressed(2, true);
			if (e.key === '0')
				guest.setNamedButtonPressed(3, true);
		}
	}

	handleKeyUp(e) {
		const home = this.pads[0];
		const guest = this.pads[1];

		const systemTarget = e.shiftKey ? guest : home;
		if (systemTarget) {
			if (e.key.toLowerCase() === 'p')
				systemTarget.setSystemButtonPressed(0, false);
			if (e.key.toLowerCase() === 'm')
				systemTarget.setSystemButtonPressed(1, false);
			if (e.key === ' ')
				systemTarget.setSystemButtonPressed(2, false);
			if (e.key.toLowerCase() === 'b')
				systemTarget.setSystemButtonPressed(3, false);
		}

		if (home) {
			if (e.key === '1')
				home.setNamedButtonPressed(0, false);
			if (e.key === '2')
				home.setNamedButtonPressed(1, false);
			if (e.key === '3')
				home.setNamedButtonPressed(2, false);
			if (e.key === '4')
				home.setNamedButtonPressed(3, false);
			if (e.key === '5' || e.key === 'Enter')
				home.setDirectionPressed(4, false);
			if (e.key === '6')
				home.setDirectionPressed(5, false);

			const arrowIdx = Console.ARROW_DIRECTION_INDEX[e.key];
			if (arrowIdx !== undefined && !(this.is3D && this.composeMode)) {
				home.setDirectionPressed(arrowIdx, false);
				e.preventDefault();
			}
		}
		if (guest) {
			if (e.key === '7')
				guest.setNamedButtonPressed(0, false);
			if (e.key === '8')
				guest.setNamedButtonPressed(1, false);
			if (e.key === '9')
				guest.setNamedButtonPressed(2, false);
			if (e.key === '0')
				guest.setNamedButtonPressed(3, false);
		}
	}

	swapPanel(index) {
		const ctrl = this.pads[index];
		if (!ctrl) return;

		const models = Object.values(PcbPanelModel);
		const currentName = ctrl.panel ? ctrl.panel.model : PcbPanelModel.NONE;
		const idx = models.indexOf(currentName);
		const next = models[(idx + 1) % models.length];

		if (next === PcbPanelModel.NONE) {
			ctrl.panel = null;
		} else {
			const PanelClass = PANEL_CLASSES[next];
			ctrl.panel = new PanelClass();
		}
		ctrl.update();
		this.renderPad(index);
	}

	async renderPad(index) {
		const id = index === 0 ? 'pad' : 'pad2';
		const div = document.getElementById(id);
		const ctrl = this.pads[index];
		if (!div || !ctrl)
			return;
		const model = ctrl.panel ? ctrl.panel.model : PcbPanelModel.NONE;
		div.innerHTML = await this.loadPanelSvg(model);
		const hasPanel = model !== PcbPanelModel.NONE;
		div.style.display = hasPanel ? 'block' : 'none';

		const systemRow = document.querySelector(`.systemRow[data-pad="${index}"]`);
		if (systemRow) {
			systemRow.style.display = hasPanel ? 'flex' : 'none';
			const svg = div.querySelector('svg');
			systemRow.style.width = svg ? `${svg.getBoundingClientRect().width}px` : '';
		}

		this._updateHandlers(index);
	}

	_updateHandlers(index) {
		const id = index === 0 ? 'pad' : 'pad2';
		const div = document.getElementById(id);
		if (!div)
			return;
		const ctrl = this.pads[index];
		if (!ctrl)
			return;
		const elements = div.querySelectorAll('[data-code]');
		for (let i = 0; i < elements.length; i++) {
			const el = elements[i];
			const idx = i;
			el.addEventListener('mousedown', () => {
				ctrl.setButtonPressed(idx, true);
			});
			el.addEventListener('mouseup', () => {
				ctrl.setButtonPressed(idx, false);
			});
			el.addEventListener('touchstart', (e) => {
				e.preventDefault();
				ctrl.setButtonPressed(idx, true);
			});
			el.addEventListener('touchend', (e) => {
				e.preventDefault();
				ctrl.setButtonPressed(idx, false);
			});
		}
	}

	toggle3D() {
		if (!this.stripContainer)
			return;

		if (this.view)
			this.view.cleanup();

		this.is3D = !this.is3D;
		this.view = this.is3D
			? new StripView3D(this.stripContainer, this.system, () => this.composeMode)
			: new StripView(this.stripContainer, this.system);
	}

	toggleFullscreen() {
		if (!document.fullscreenElement)
			document.documentElement.requestFullscreen();
		else
			document.exitFullscreen();
	}
}

export { Console, StripView, StripView3D };
