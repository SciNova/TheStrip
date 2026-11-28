import { WiredConsoleView } from './WiredConsoleView.js';
import { SystemState } from '../core/System.js';
import { GameId } from '../core/Game.js';
import { Sample } from '../core/audio/Sample.js';

// Every game, already linked in - same as every game header being
// #include-d into the MCU sketch. Nothing is ever loaded at runtime;
// System.load() just picks one of these already-resolved classes.
import { WhiteLight } from '../apps/WhiteLight/WhiteLight.js';
import { ColorLight } from '../apps/ColorLight/ColorLight.js';
import { Moodlight } from '../apps/Moodlight/Moodlight.js';
import { StopWatch } from '../apps/StopWatch/StopWatch.js';
import { Dices } from '../apps/Dices/Dices.js';
import { Slots } from '../apps/Slots/Slots.js';
import { Darts } from '../apps/Darts/Darts.js';
import { SimonSays } from '../apps/SimonSays/SimonSays.js';
import { Stack } from '../apps/Stack/Stack.js';
import { FlappyBird } from '../apps/FlappyBird/FlappyBird.js';
import { Dino } from '../apps/Dino/Dino.js';
import { Race } from '../apps/Race/Race.js';
import { Pacman } from '../apps/Pacman/Pacman.js';
import { DemoScene } from '../apps/DemoScene/DemoScene.js';

import { Bomberman } from '../drafts/Bomberman/Bomberman.js';
import { Breakout } from '../drafts/Breakout/Breakout.js';
import { Golf } from '../drafts/Golf/Golf.js';
import { MemoryMatch } from '../drafts/MemoryMatch/MemoryMatch.js';
import { Shooters } from '../drafts/Shooters/Shooters.js';
import { Test } from '../drafts/Test/Test.js';
import { AsteroidsZ } from '../drafts/AsteroidsZ/AsteroidsZ.js';
import { Blackjack } from '../drafts/Blackjack/Blackjack.js';
import { Cars } from '../drafts/Cars/Cars.js';
import { CentipedeZ } from '../drafts/CentipedeZ/CentipedeZ.js';
import { Drag } from '../drafts/Drag/Drag.js';
import { Fishing } from '../drafts/Fishing/Fishing.js';
import { Frogger } from '../drafts/Frogger/Frogger.js';
import { LunarLander } from '../drafts/LunarLander/LunarLander.js';
import { MissileCommand } from '../drafts/MissileCommand/MissileCommand.js';
import { Pachinko } from '../drafts/Pachinko/Pachinko.js';
import { Pinball } from '../drafts/Pinball/Pinball.js';
import { Pong } from '../drafts/Pong/Pong.js';
import { QuickDraw } from '../drafts/QuickDraw/QuickDraw.js';
import { RhythmTap } from '../drafts/RhythmTap/RhythmTap.js';
import { Shuffleboard } from '../drafts/Shuffleboard/Shuffleboard.js';
import { Sprint } from '../drafts/Sprint/Sprint.js';
import { Submarine } from '../drafts/Submarine/Submarine.js';
import { TowerDefense } from '../drafts/TowerDefense/TowerDefense.js';
import { TreasureHunt } from '../drafts/TreasureHunt/TreasureHunt.js';
import { TugOfWar } from '../drafts/TugOfWar/TugOfWar.js';
import { WhackAMole } from '../drafts/WhackAMole/WhackAMole.js';
import { Highway2D } from '../drafts/Highway2D/Highway2D.js';
import { Maze2D } from '../drafts/Maze2D/Maze2D.js';
import { Shooter2D } from '../drafts/Shooter2D/Shooter2D.js';
import { Snake2D } from '../drafts/Snake2D/Snake2D.js';
import { SpaceInvaders2D } from '../drafts/SpaceInvaders2D/SpaceInvaders2D.js';

const GAMES = {
	[GameId.WHITE_LIGHT]: WhiteLight,
	[GameId.COLOR_LIGHT]: ColorLight,
	[GameId.MOODLIGHT]: Moodlight,
	[GameId.STOPWATCH]: StopWatch,
	[GameId.DICES]: Dices,
	[GameId.SLOTS]: Slots,
	[GameId.DARTS]: Darts,
	[GameId.SIMON_SAYS]: SimonSays,
	[GameId.STACK]: Stack,
	[GameId.FLAPPY_BIRD]: FlappyBird,
	[GameId.DINO]: Dino,
	[GameId.RACE]: Race,
	[GameId.PACMAN]: Pacman,
	[GameId.DEMO_SCENE]: DemoScene,
	[GameId.DRAFT_BOMBERMAN]: Bomberman,
	[GameId.DRAFT_BREAKOUT]: Breakout,
	[GameId.DRAFT_GOLF]: Golf,
	[GameId.DRAFT_MEMORY_MATCH]: MemoryMatch,
	[GameId.DRAFT_SHOOTERS]: Shooters,
	[GameId.DRAFT_TEST]: Test,
	[GameId.DRAFT_ASTEROIDS_Z]: AsteroidsZ,
	[GameId.DRAFT_BLACKJACK]: Blackjack,
	[GameId.DRAFT_CARS]: Cars,
	[GameId.DRAFT_CENTIPEDE_Z]: CentipedeZ,
	[GameId.DRAFT_DRAG]: Drag,
	[GameId.DRAFT_FISHING]: Fishing,
	[GameId.DRAFT_FROGGER]: Frogger,
	[GameId.DRAFT_LUNAR_LANDER]: LunarLander,
	[GameId.DRAFT_MISSILE_COMMAND]: MissileCommand,
	[GameId.DRAFT_PACHINKO]: Pachinko,
	[GameId.DRAFT_PINBALL]: Pinball,
	[GameId.DRAFT_PONG]: Pong,
	[GameId.DRAFT_QUICK_DRAW]: QuickDraw,
	[GameId.DRAFT_RHYTHM_TAP]: RhythmTap,
	[GameId.DRAFT_SHUFFLEBOARD]: Shuffleboard,
	[GameId.DRAFT_SPRINT]: Sprint,
	[GameId.DRAFT_SUBMARINE]: Submarine,
	[GameId.DRAFT_TOWER_DEFENSE]: TowerDefense,
	[GameId.DRAFT_TREASURE_HUNT]: TreasureHunt,
	[GameId.DRAFT_TUG_OF_WAR]: TugOfWar,
	[GameId.DRAFT_WHACK_A_MOLE]: WhackAMole,
	[GameId.DRAFT_HIGHWAY_2D]: Highway2D,
	[GameId.DRAFT_MAZE_2D]: Maze2D,
	[GameId.DRAFT_SHOOTER_2D]: Shooter2D,
	[GameId.DRAFT_SNAKE_2D]: Snake2D,
	[GameId.DRAFT_SPACE_INVADERS_2D]: SpaceInvaders2D,
};

export class Application {
	constructor() {
		this.GAMES = GAMES;
		this.consoleView = null;
		this.lastLoggedLineCount = -1;
	}

	async setup(resolution) {
		if (this.consoleView && this.consoleView.console.system.state !== SystemState.OFF) {
			return;
		}

		if (this.consoleView) {
			this.consoleView.deregisterHandlers();
		}

		this.consoleView = new WiredConsoleView(resolution);
		this.consoleView.console.system.GAMES = this.GAMES;

		// Audio only ever turns on in response to a real Power button
		// press (System.handleCommand's POWER_SHORT_PRESS calling
		// audio.on()) - never eagerly here, since the system itself
		// starts powered off.

		await this.consoleView.renderPad(0);
		await this.consoleView.renderPad(1);

		this.consoleView.setStripContainer(document.getElementById('strip'));

		this.debugPanel = document.getElementById('debug');
		this.debugInfo = document.getElementById('debugInfo');
		this.debugLog = document.getElementById('debugLog');

		const menuToggle = document.getElementById('menuToggle');
		const panelSwapHome = document.getElementById('panelSwapHome');
		const panelSwapGuest = document.getElementById('panelSwapGuest');
		const debugToggle = document.getElementById('debugToggle');
		const hideToggle = document.getElementById('hideToggle');
		const nav = document.getElementById('nav');

		menuToggle.addEventListener('click', () => {
			nav.classList.toggle('open');
		});

		panelSwapHome.addEventListener('click', () => {
			this.consoleView.padViews[0].swapPanel();
		});

		panelSwapGuest.addEventListener('click', () => {
			this.consoleView.padViews[1].swapPanel();
		});

		debugToggle.addEventListener('click', () => {
			this.debugPanel.classList.toggle('open');
		});

		hideToggle.addEventListener('click', () => {
			document.body.classList.toggle('hiddenUI');
		});
	}

	startLoop() {
		const frame = () => {
			this.loop();
			this.animationFrame = requestAnimationFrame(frame);
		};
		this.animationFrame = requestAnimationFrame(frame);
	}

	stopLoop() {
		cancelAnimationFrame(this.animationFrame);
	}

	async startAudioLoop() {
		const audio = this.consoleView.console.system.audio;
		if (!audio.context) {
			audio.context = new AudioContext();
			Sample.system = this.consoleView.console.system;
			await audio.context.audioWorklet.addModule('/browser/AudioWorklet.js?v=' + Date.now());
			audio.node = new AudioWorkletNode(audio.context, 'audio-processor', {
				numberOfInputs: 0,
				numberOfOutputs: 1,
				outputChannelCount: [2],
			});
			audio.node.port.onmessage = audio.handleMessage.bind(audio);
			audio.node.connect(audio.context.destination);
			audio.postMessage({ action: 'start' });
			audio.loadSamples();
		}
		await audio.context.resume();
	}

	async stopAudioLoop() {
		const audio = this.consoleView.console.system.audio;
		if (audio.context) {
			await audio.context.suspend();
		}
	}

	async loadGame(gameId) {
		if (!this.consoleView) {
			await this.setup(120);
		}
		this.consoleView.console.system.loadGame(gameId);
		document.getElementById('nav').classList.remove('open');
	}

	updateDebug() {
		if (!this.debugPanel.classList.contains('open')) {
			return;
		}
		const game = this.consoleView.console.system.game;
		let info =
			`clock.timestamp: ${this.consoleView.console.system.clock.timestamp.toFixed(3)}\n` +
			`system.uptime: ${this.consoleView.console.system.uptime.toFixed(3)}\n` +
			`system.state: ${this.consoleView.console.system.state}\n` +
			`game.state: ${game ? game.state : '-'}\n` +
			`game.time: ${game ? game.time.toFixed(3) : '-'}\n` +
			`game.level: ${game ? game.level : '-'}`;

		if (game?.tracker) {
			info +=
				`\ntracker.position: ${game.tracker.position.toFixed(3)}\n` +
				`tracker.segment: ${game.tracker.segment}\n` +
				`tracker.bar: ${game.tracker.bar}\n` +
				`tracker.beat: ${game.tracker.beat}`;
		}
		this.debugInfo.textContent = info;

		const lines = this.consoleView.console.system.logLines;
		if (lines.length !== this.lastLoggedLineCount) {
			this.lastLoggedLineCount = lines.length;
			this.debugLog.textContent = lines.join('\n');
			this.debugLog.scrollTop = this.debugLog.scrollHeight;
		}
	}

	loop() {
		this.consoleView.console.loop();
		this.consoleView.updateView();
		this.updateDebug();

		const audio = this.consoleView.console.system.audio;
		const isRunning = audio.context && audio.context.state === 'running';
		if (this.consoleView.console.system.state === SystemState.OFF) {
			if (isRunning) this.stopAudioLoop();
		} else if (!isRunning) {
			this.startAudioLoop();
		}
	}
}
