import { Command } from './Command.js';
import { Color } from './Color.js';

export class Menu {
	static APPS_BEFORE_GAP = 5;

	constructor(system) {
		this.system = system;
		this.games = [
			{ name: 'WhiteLight', color: 0x7F7F7F },
			{ name: 'ColorLight', color: 0xCEAA68 },
			{ name: 'Moodlight', color: 0xA53FA5 },
			{ name: 'StopWatch', color: 0x6BD1D1 },
			{ name: 'Dices', color: 0x82C2BC },
			{ name: 'Slots', color: 0xBBA570 },
			{ name: 'Darts', color: 0x942E2E },
			{ name: 'SimonSays', color: 0x2D602D },
			{ name: 'Stack', color: 0x111177 },
			{ name: 'FlappyBird', color: 0xE5CCD0 },
			{ name: 'Dino', color: 0xB48AB3 },
			{ name: 'Race', color: 0xC89DC8 },
			{ name: 'Pacman', color: 0xEEEE88 },
			{ name: 'DemoScene', color: 0x532053 },
		];
		this.selected = 0;
	}

	loop() {
		const pixels = this.system.strip.pixels;
		const resolution = this.system.strip.length;
		const numEntries = this.games.length;
		const numSmallGaps = numEntries - 2;
		const numUnits = numEntries + 1;

		const remaining = resolution - numSmallGaps;
		const unitWidth = Math.floor(remaining / numUnits);
		const bigGapWidth = unitWidth + (remaining - unitWidth * numUnits);
		const center = Math.floor(unitWidth / 2);

		let pos = 0;
		for (let g = 0; g < numEntries; g++) {
			for (let i = 0; i < unitWidth; i++) {
				pixels[pos + i] = this.games[g].color;
			}
			if (g === this.selected) {
				pixels[pos + center] = Color.WHITE;
			}
			pos += unitWidth;

			if (g === Menu.APPS_BEFORE_GAP - 1) {
				for (let i = 0; i < bigGapWidth; i++) {
					pixels[pos + i] = Color.BLACK;
				}
				pos += bigGapWidth;
			} else if (g < numEntries - 1) {
				pixels[pos] = Color.BLACK;
				pos += 1;
			}
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.LEFT_PRESS || event.command === Command.A_PRESS || event.command === Command.UP_PRESS) {
			if (this.selected > 0) {
				this.selected -= 1;
				this.system.audio.playSynthCustom('SINUS', 1000, 0.05, 0.0, 0.03, 0.0, 0.02);
			}
		} else if (event.command === Command.RIGHT_PRESS || event.command === Command.B_PRESS || event.command === Command.DOWN_PRESS) {
			if (this.selected < this.games.length - 1) {
				this.selected += 1;
				this.system.audio.playSynthCustom('SINUS', 1000, 0.05, 0.0, 0.03, 0.0, 0.02);
			}
		}
	}
}
