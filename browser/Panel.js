import { Command } from '../core/system.js';

export const PcbPanelModel = Object.freeze({
	NONE: 'NONE',
	ABCD: 'ABCD',
	ABC: 'ABC',
	F: 'F',
	UD: 'UD',
	LR: 'LR',
	LRF: 'LRF',
	UDF: 'UDF',
	LRUDFF: 'LRUDFF',
});

class Panel {
	constructor(model, pressCommands) {
		this.model = model;
		this.pressCommands = pressCommands;
	}
}

export class PanelABCD extends Panel {
	constructor() {
		super(PcbPanelModel.ABCD, [Command.A_PRESS, Command.B_PRESS, Command.C_PRESS, Command.D_PRESS]);
	}
}

export class PanelABC extends Panel {
	constructor() {
		super(PcbPanelModel.ABC, [Command.A_PRESS, Command.B_PRESS, Command.C_PRESS]);
	}
}

export class PanelF extends Panel {
	constructor() {
		super(PcbPanelModel.F, [Command.FIRE_PRESS]);
	}
}

export class PanelUD extends Panel {
	constructor() {
		super(PcbPanelModel.UD, [Command.UP_PRESS, Command.DOWN_PRESS]);
	}
}

export class PanelLR extends Panel {
	constructor() {
		super(PcbPanelModel.LR, [Command.LEFT_PRESS, Command.RIGHT_PRESS]);
	}
}

export class PanelLRF extends Panel {
	constructor() {
		super(PcbPanelModel.LRF, [Command.LEFT_PRESS, Command.RIGHT_PRESS, Command.FIRE_PRESS]);
	}
}

export class PanelUDF extends Panel {
	constructor() {
		super(PcbPanelModel.UDF, [Command.UP_PRESS, Command.DOWN_PRESS, Command.FIRE_PRESS]);
	}
}

export class PanelLRUDFF extends Panel {
	constructor() {
		super(PcbPanelModel.LRUDFF, [
			Command.LEFT_PRESS, Command.RIGHT_PRESS, Command.UP_PRESS, Command.DOWN_PRESS,
			Command.FIRE_PRESS, Command.FIRE2_PRESS,
		]);
	}
}

export const PANEL_CLASSES = Object.freeze({
	ABCD: PanelABCD,
	ABC: PanelABC,
	F: PanelF,
	UD: PanelUD,
	LR: PanelLR,
	LRF: PanelLRF,
	UDF: PanelUDF,
	LRUDFF: PanelLRUDFF,
});

