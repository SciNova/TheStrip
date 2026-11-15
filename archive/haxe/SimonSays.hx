import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Audio.Sound;

enum Stage {
	PLAYBACK;
	INPUT;
	RESULT;
	COMPLETE;
}

@:expose
class SimonSays extends Game {
	static var BEEP_DURATION:Float = 0.5;
	static var ENTRY_DURATION:Float = 0.8;
	static var INPUT_TIMEOUT:Float = 10.0;
	static var TOTAL_LEVELS:Int = 120;

	var sequence:Array<Null<Int>>;
	var stage:Stage;
	var step:Int;
	var input:Null<Int>;
	var lastInputTime:Float;

	function buildSequence():Void {
		sequence = [];
		for (i in 0...TOTAL_LEVELS) {
			var r = Math.floor(Math.random() * 4);
			sequence.push(switch (r) {
				case 0: Colors.Red;
				case 1: Colors.Green;
				case 2: Colors.Blue;
				case 3: Colors.Yellow;
				default: null;
			});
		}
	}

	public function new(system:System) {
		super("SimonSays", system);
		buildSequence();
		stage = PLAYBACK;
		step = 1;
		lastInputTime = 0.0;
		playLevel();
	}

	override function buildStage():Void {}

	override function playLevel():Void {
		stage = PLAYBACK;
		step = 1;
		lastInputTime = 0.0;
		super.playLevel();
		display(sequence[0]);
	}

	function display(color:Null<Int>):Void {
		var sectionSize = Math.floor(resolution / 4);

		for (i in 0...sectionSize) {
			pixels[i] = Colors.DarkRed;
			pixels[i + sectionSize] = Colors.DarkGreen;
			pixels[i + 2 * sectionSize] = Colors.DarkBlue;
			pixels[i + 3 * sectionSize] = Colors.DarkYellow;
		}

		if (color == null || color == 0)
			return;

		var start = switch (color) {
			case Colors.Red:	0;
			case Colors.Green:  sectionSize;
			case Colors.Blue:   2 * sectionSize;
			case Colors.Yellow: 3 * sectionSize;
			default: -1;
		};
		if (start == -1)
			return;

		for (i in start...start + sectionSize)
			pixels[i] = color;

		var sound:Null<Sound> = switch (color) {
			case Colors.Red:	Sound.SIMONSAYS2;
			case Colors.Green:  Sound.SIMONSAYS1;
			case Colors.Blue:   Sound.SIMONSAYS4;
			case Colors.Yellow: Sound.SIMONSAYS3;
			default: null;
		};
		if (sound != null)
			audio.play(sound);
	}

	override function loop() {
		super.loop();

		switch (stage) {
			case PLAYBACK:
				var totalDuration = (level + 1) * ENTRY_DURATION;
				if (levelTime >= totalDuration) {
					display(0);
					stage = INPUT;
					step = 1;
					lastInputTime = levelTime;
					return;
				}

				var currentStep = Math.floor(levelTime / ENTRY_DURATION) + 1;
				var timeInStep = levelTime % ENTRY_DURATION;

				if (timeInStep < BEEP_DURATION) {
					if (currentStep != step) {
						step = currentStep;
						display(sequence[step - 1]);
					}
				} else {
					display(0);
				}
			case INPUT:
				if (levelTime - lastInputTime > INPUT_TIMEOUT) {
					audio.play(Sound.LEVEL_FAIL);
					defer(function() {
						playLevel();
					}, 4);
				}
			case RESULT:
			case COMPLETE:
		}
	}

	override function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (type != InputEvent.ButtonPress)
			return;

		this.input = switch (input) {
			case Input.ButtonA: Colors.Red;
			case Input.ButtonB: Colors.Green;
			case Input.ButtonC: Colors.Blue;
			case Input.ButtonD: Colors.Yellow;
			default: null;
		};
		feedback();
	}

	function feedback():Void {
		var sound = switch (input) {
			case Colors.Red:	Sound.SIMONSAYS2;
			case Colors.Green:  Sound.SIMONSAYS1;
			case Colors.Blue:   Sound.SIMONSAYS4;
			case Colors.Yellow: Sound.SIMONSAYS3;
			default: null;
		};
		if (sound != null)
			audio.play(sound);
		display(input);
		stage = RESULT;
		defer(process, ENTRY_DURATION);
	}

	function process():Void {
		display(0);
		var correct = (input == sequence[step - 1]);

		if (!correct) {
			audio.play(Sound.LEVEL_FAIL);
			defer(function() {
				playLevel();
			}, 4);
			return;
		}

		var isLastStep = (step == level + 1);

		if (!isLastStep) {
			step++;
			stage = INPUT;
			lastInputTime = levelTime;
			return;
		}

		audio.play(Sound.LEVEL_COMPLETE);
		defer(function() {
			if (level + 1 == TOTAL_LEVELS) {
				stage = COMPLETE;
				audio.play(Sound.GAME_COMPLETE);
			} else {
				nextLevel();
				playLevel();
			}
		}, 4);
	}

	static public function main() {}
}
