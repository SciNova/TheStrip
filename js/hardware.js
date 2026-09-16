import { Command, InputEvent, Button, ButtonEvent } from './system.js';

export const PcbPanelModel = Object.freeze({
	NONE: 'NONE',
	ABCD: 'ABCD',
	ABC: 'ABC',
	A: 'A',
	UD: 'UD',
	LR: 'LR',
	LRA: 'LRA',
	UDA: 'UDA',
	EE: 'EE',
});

class PcbPanel {
	constructor(model, pressCommands) {
		this.model = model;
		this.pressCommands = pressCommands;
	}
}

export class PcbPanelABCD extends PcbPanel {
	constructor() {
		super(PcbPanelModel.ABCD, [Command.A_PRESS, Command.B_PRESS, Command.C_PRESS, Command.D_PRESS]);
	}
}

export class PcbPanelABC extends PcbPanel {
	constructor() {
		super(PcbPanelModel.ABC, [Command.A_PRESS, Command.B_PRESS, Command.C_PRESS]);
	}
}

export class PcbPanelA extends PcbPanel {
	constructor() {
		super(PcbPanelModel.A, [Command.A_PRESS]);
	}
}

export class PcbPanelUD extends PcbPanel {
	constructor() {
		super(PcbPanelModel.UD, [Command.UP_PRESS, Command.DOWN_PRESS]);
	}
}

export class PcbPanelLR extends PcbPanel {
	constructor() {
		super(PcbPanelModel.LR, [Command.LEFT_PRESS, Command.RIGHT_PRESS]);
	}
}

export class PcbPanelLRA extends PcbPanel {
	constructor() {
		super(PcbPanelModel.LRA, [Command.LEFT_PRESS, Command.RIGHT_PRESS, Command.A_PRESS]);
	}
}

export class PcbPanelUDA extends PcbPanel {
	constructor() {
		super(PcbPanelModel.UDA, [Command.UP_PRESS, Command.DOWN_PRESS, Command.A_PRESS]);
	}
}

export class PcbPanelEE extends PcbPanel {
	constructor() {
		super(PcbPanelModel.EE, []);
	}
}

export const PANEL_CLASSES = Object.freeze({
	ABCD: PcbPanelABCD,
	ABC: PcbPanelABC,
	A: PcbPanelA,
	UD: PcbPanelUD,
	LR: PcbPanelLR,
	LRA: PcbPanelLRA,
	UDA: PcbPanelUDA,
	EE: PcbPanelEE,
});

const DIRECTION_COMMANDS = [
	Command.UP_PRESS, Command.DOWN_PRESS, Command.LEFT_PRESS, Command.RIGHT_PRESS,
	Command.FIRE_PRESS, Command.FIRE2_PRESS,
];

export class ControlPad {
	constructor(system) {
		this.system = system;
		this.id = 0;
		this.panel = null;
		this.buttons = [];
		this.pressedState = [];
		this.directionButtons = DIRECTION_COMMANDS.map(() => new Button());
		this.directionPressedState = new Array(DIRECTION_COMMANDS.length).fill(false);
	}

	update() {
		this.buttons = this.panel ? this.panel.pressCommands.map(() => new Button()) : [];
		this.pressedState = new Array(this.buttons.length).fill(false);
	}

	setButtonPressed(index, pressed) {
		this.pressedState[index] = pressed;
	}

	setDirectionPressed(index, pressed) {
		this.directionPressedState[index] = pressed;
	}

	poll(now) {
		if (this.panel) {
			for (let i = 0; i < this.buttons.length; i++) {
				const event = this.buttons[i].process(this.pressedState[i], now);
				if (event === ButtonEvent.PRESS) {
					this.system.handleCommand(this.id, new InputEvent(this.panel.pressCommands[i]));
				} else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) {
					this.system.handleCommand(this.id, new InputEvent(this.panel.pressCommands[i] + 1));
				}
			}
		}

		for (let i = 0; i < this.directionButtons.length; i++) {
			const event = this.directionButtons[i].process(this.directionPressedState[i], now);
			if (event === ButtonEvent.PRESS) {
				this.system.handleCommand(this.id, new InputEvent(DIRECTION_COMMANDS[i]));
			} else if (event === ButtonEvent.RELEASE || event === ButtonEvent.HOLDRELEASE) {
				this.system.handleCommand(this.id, new InputEvent(DIRECTION_COMMANDS[i] + 1));
			}
		}
	}
}
