import App;

enum State {
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
	var state:State;
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

	public function new(audio:Audio, resolution:Int) {
		super("SimonSays", resolution, audio);
		buildSequence();
		state = PLAYBACK;
		step = 1;
		lastInputTime = 0.0;
		playLevel();
	}

	override function buildStage():Void {}

	override function playLevel():Void {
		state = PLAYBACK;
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
			case Colors.Red:    0;
			case Colors.Green:  sectionSize;
			case Colors.Blue:   2 * sectionSize;
			case Colors.Yellow: 3 * sectionSize;
			default: -1;
		};
		if (start == -1)
			return;

		for (i in start...start + sectionSize)
			pixels[i] = color;

		var sound:Null<SoundEvent> = switch (color) {
			case Colors.Red:    SoundEvent.SIMONSAYS2;
			case Colors.Green:  SoundEvent.SIMONSAYS1;
			case Colors.Blue:   SoundEvent.SIMONSAYS4;
			case Colors.Yellow: SoundEvent.SIMONSAYS3;
			default: null;
		};
		if (sound != null)
			audio.play(sound);
	}

	override function loop() {
		super.loop();

		switch (state) {
			case PLAYBACK:
				var totalDuration = (level + 1) * ENTRY_DURATION;
				if (levelTime >= totalDuration) {
					display(0);
					state = INPUT;
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
					audio.play(SoundEvent.LEVEL_FAIL);
					defer(function() {
						playLevel();
					}, 4);
				}
			case RESULT:
			case COMPLETE:
		}
	}

	override function buttonPress(buttonIndex:Int) {
		input = switch (buttonIndex) {
			case 0: Colors.Red;
			case 1: Colors.Green;
			case 2: Colors.Blue;
			case 3: Colors.Yellow;
			default: null;
		};
		feedback();
	}

	function feedback():Void {
		var sound = switch (input) {
			case Colors.Red:    SoundEvent.SIMONSAYS2;
			case Colors.Green:  SoundEvent.SIMONSAYS1;
			case Colors.Blue:   SoundEvent.SIMONSAYS4;
			case Colors.Yellow: SoundEvent.SIMONSAYS3;
			default: null;
		};
		if (sound != null) audio.play(sound);
		display(input);
		state = RESULT;
		defer(process, ENTRY_DURATION);
	}

	function process():Void {
		display(0);
		var correct = (input == sequence[step - 1]);

		if (!correct) {
			audio.play(SoundEvent.LEVEL_FAIL);
			defer(function() {
				playLevel();
			}, 4);
			return;
		}

		var isLastStep = (step == level + 1);

		if (!isLastStep) {
			step++;
			state = INPUT;
			lastInputTime = levelTime;
			return;
		}

		audio.play(SoundEvent.LEVEL_COMPLETE);
		defer(function() {
			if (level + 1 == TOTAL_LEVELS) {
				state = COMPLETE;
				audio.play(SoundEvent.GAME_COMPLETE);
			} else {
				nextLevel();
				playLevel();
			}
		}, 4);
	}

	override function buttonHold(buttonIndex:Int) {}
	override function buttonRelease(buttonIndex:Int) {}
	override function buttonReleaseHold(buttonIndex:Int) {}

	static public function main() {}
}