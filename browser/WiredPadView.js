import { Command } from '../core/Command.js';
import { Button } from '../core/Button.js';
import { PcbPanelModel, PANEL_CLASSES } from './Panel.js';

export class WiredPadView {
	static _svgs = {};

	constructor(container, pad) {
		this.container = container;
		this.pad = pad;
		this.panel = null;
		this.attachSystemHandlers();
	}

	update() {
	}

	attachSystemHandlers() {
		const elements = this.container.querySelectorAll('[data-sys]');

		elements[0].addEventListener('mousedown', () => { this.pad.console.inputs[this.pad.id][Button.POWER] = true; });
		elements[0].addEventListener('mouseup', () => { this.pad.console.inputs[this.pad.id][Button.POWER] = false; });
		elements[0].addEventListener('touchstart', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.POWER] = true; });
		elements[0].addEventListener('touchend', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.POWER] = false; });

		elements[1].addEventListener('mousedown', () => { this.pad.console.inputs[this.pad.id][Button.MENU] = true; });
		elements[1].addEventListener('mouseup', () => { this.pad.console.inputs[this.pad.id][Button.MENU] = false; });
		elements[1].addEventListener('touchstart', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.MENU] = true; });
		elements[1].addEventListener('touchend', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.MENU] = false; });

		elements[2].addEventListener('mousedown', () => { this.pad.console.inputs[this.pad.id][Button.PAUSE] = true; });
		elements[2].addEventListener('mouseup', () => { this.pad.console.inputs[this.pad.id][Button.PAUSE] = false; });
		elements[2].addEventListener('touchstart', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.PAUSE] = true; });
		elements[2].addEventListener('touchend', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.PAUSE] = false; });

		elements[3].addEventListener('mousedown', () => { this.pad.console.inputs[this.pad.id][Button.BT] = true; });
		elements[3].addEventListener('mouseup', () => { this.pad.console.inputs[this.pad.id][Button.BT] = false; });
		elements[3].addEventListener('touchstart', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.BT] = true; });
		elements[3].addEventListener('touchend', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][Button.BT] = false; });
	}

	attachPanelHandlers(panelDiv) {
		const elements = panelDiv.querySelectorAll('[data-code]');
		for (let i = 0; i < elements.length; i++) {
			const el = elements[i];
			const command = this.panel.pressCommands[i];

			let buttonId;
			if (command === Command.A_PRESS) {
				buttonId = Button.A;
			} else if (command === Command.B_PRESS) {
				buttonId = Button.B;
			} else if (command === Command.C_PRESS) {
				buttonId = Button.C;
			} else if (command === Command.D_PRESS) {
				buttonId = Button.D;
			} else if (command === Command.FIRE_PRESS) {
				buttonId = Button.FIRE;
			} else if (command === Command.FIRE2_PRESS) {
				buttonId = Button.FIRE2;
			} else if (command === Command.UP_PRESS) {
				buttonId = Button.UP;
			} else if (command === Command.DOWN_PRESS) {
				buttonId = Button.DOWN;
			} else if (command === Command.LEFT_PRESS) {
				buttonId = Button.LEFT;
			} else if (command === Command.RIGHT_PRESS) {
				buttonId = Button.RIGHT;
			}

			el.addEventListener('mousedown', () => { this.pad.console.inputs[this.pad.id][buttonId] = true; });
			el.addEventListener('mouseup', () => { this.pad.console.inputs[this.pad.id][buttonId] = false; });
			el.addEventListener('touchstart', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][buttonId] = true; });
			el.addEventListener('touchend', (e) => { e.preventDefault(); this.pad.console.inputs[this.pad.id][buttonId] = false; });
		}
	}

	async loadSVG(model) {
		if (model === PcbPanelModel.NONE) {
			return '';
		}
		if (!WiredPadView._svgs[model]) {
			const res = await fetch(`/svg/panels/${model}.svg`);
			WiredPadView._svgs[model] = await res.text();
		}
		return WiredPadView._svgs[model];
	}

	async render() {
		const model = this.panel ? this.panel.model : PcbPanelModel.NONE;
		const hasPanel = model !== PcbPanelModel.NONE;

		const panelDiv = this.container.querySelector('div:not(.systemRow)');
		panelDiv.innerHTML = await this.loadSVG(model);
		panelDiv.style.display = hasPanel ? 'block' : 'none';

		const systemRow = this.container.querySelector('.systemRow');
		systemRow.style.display = hasPanel ? 'flex' : 'none';
		const svg = panelDiv.querySelector('svg');
		systemRow.style.width = svg ? `${svg.getBoundingClientRect().width}px` : '';

		if (hasPanel) {
			this.attachPanelHandlers(panelDiv);
		}
	}

	swapPanel() {
		const models = Object.values(PcbPanelModel);
		const currentName = this.panel ? this.panel.model : PcbPanelModel.NONE;
		const idx = models.indexOf(currentName);
		const next = models[(idx + 1) % models.length];

		if (next === PcbPanelModel.NONE) {
			this.panel = null;
		} else {
			const PanelClass = PANEL_CLASSES[next];
			this.panel = new PanelClass();
		}
		this.update();
		this.render();
	}
}
