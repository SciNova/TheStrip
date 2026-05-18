import App;

@:expose
class SimonSays extends Game {
	static var BEEP_DURATION:Float = 0.5;
	static var SILENCE_DURATION:Float = 0.3;
	static var INPUT_TIMEOUT:Float = 10;
	static var FREQUENCIES:Array<Int> = [330, 277, 220, 165];
	
	var sequence:Array<Int>;
	var isWaiting:Bool;
	var step:Int;
	var lastInputTime:Float;
	var displayedColor:Int = 0;
	var isProcessingInput:Bool = false;
	var feedbackEndTime:Float = 0; // NEW: Track when to end feedback

	public function new(sound:Dynamic, resolution:Int) {
		log("SimonSays");
		super(sound, resolution);
		sequence = [];
		isWaiting = false;
		isProcessingInput = false;
		step = 0;
		lastInputTime = 0.0;
		feedbackEndTime = 0.0;
		startNextLevel();
	}

	override function buildStage() {
		// Clear sequence for new level
		sequence = [];
		
		// Create sequence of length (level + 3)
		var sequenceLength = level + 3;
		for (i in 0...sequenceLength) {
			var r = Math.floor(Math.random() * 4);
			sequence.push(switch(r) {
				case 0: Colors.Red;
				case 1: Colors.Green;
				case 2: Colors.Blue;
				case 3: Colors.Yellow;
				default: 0;
			});
		}
		log("Built sequence of length: " + sequence.length);
	}

	function display(color:Int):Void {
		// Play sound when displaying a new color (not None)
		if (color != 0 && displayedColor != color) {
			switch (color) {
				case Colors.Red: sound.play('1');
				case Colors.Green: sound.play('2');
				case Colors.Blue: sound.play('3');
				case Colors.Yellow: sound.play('4');
				default:
			}
		}
		
		displayedColor = color;

		var sectionSize = Math.floor(resolution / 4);
		for (i in 0...sectionSize) {
			pixels[i] = rgb(Colors.DarkRed);
			pixels[i + sectionSize] = rgb(Colors.DarkGreen);
			pixels[i + 2 * sectionSize] = rgb(Colors.DarkBlue);
			pixels[i + 3 * sectionSize] = rgb(Colors.DarkYellow);
		}
		
		if (color != 0) {
			var startIndex:Int = 0;
			var endIndex:Int = 0;
			switch (color) {
				case Colors.Red:
					startIndex = 0;
					endIndex = sectionSize;
				case Colors.Green:
					startIndex = sectionSize;
					endIndex = 2 * sectionSize;
				case Colors.Blue:
					startIndex = 2 * sectionSize;
					endIndex = 3 * sectionSize;
				case Colors.Yellow:
					startIndex = 3 * sectionSize;
					endIndex = 4 * sectionSize;
				default:
			}
			for (i in startIndex...endIndex) {
				if (i < resolution) {
					pixels[i] = rgb(color);
				}
			}
		}
	}

	override function loop() {
		super.loop();
		
		if (!isWaiting) {
			var totalStepTime = BEEP_DURATION + SILENCE_DURATION;
			var positionInStep = levelTime % totalStepTime;
			var currentStep = Math.floor(levelTime / totalStepTime);
			
			if (currentStep < sequence.length) {
				if (positionInStep < BEEP_DURATION) {
					display(sequence[currentStep]);
				} else {
					display(0);
				}
			} else {
				isWaiting = true;
				isProcessingInput = false;
				step = 0;
				lastInputTime = levelTime;
				feedbackEndTime = 0.0;
				display(0);
				log("Now waiting for player input");
			}
		} else {
			// Check if we need to clear feedback
			if (feedbackEndTime > 0 && levelTime >= feedbackEndTime) {
				display(0);
				feedbackEndTime = 0.0;
			}
			
			// Don't timeout while processing input or showing feedback
			if (!isProcessingInput && feedbackEndTime == 0 && (levelTime - lastInputTime > INPUT_TIMEOUT)) {
				log("Timeout - restarting game");
				startLevel();
				buildStage();
				isWaiting = false;
				isProcessingInput = false;
				step = 0;
				feedbackEndTime = 0.0;
			}
		}
	}
	
	override function buttonPress(buttonIndex:Int) {
		if (!isWaiting || isProcessingInput) {
			log("Ignoring button press - not waiting for input or already processing");
			return;
		}
		
		isProcessingInput = true;
		
		var pressedColor = switch (buttonIndex) {
			case 0: Colors.Red;
			case 1: Colors.Green;
			case 2: Colors.Blue;
			case 3: Colors.Yellow;
			default: 0;
		}
		
		log("Button pressed: " + buttonIndex + ", expecting: " + sequence[step]);
		
		// Show feedback immediately
		display(pressedColor);
		
		// Set when to clear the feedback
		feedbackEndTime = levelTime + 0.3;
		
		// Use defer to check the answer after a short delay
		defer(function() {
			if (pressedColor == sequence[step]) {
				log("Correct! Step " + step + " of " + sequence.length);
				step++;
				lastInputTime = levelTime;
				
				if (step == sequence.length) {
					log("Level " + (level + 1) + " complete!");
					startNextLevel();
					buildStage();
					isWaiting = false;
					step = 0;
					feedbackEndTime = 0.0;
				}
				isProcessingInput = false; // Allow next input
			} else {
				log("Wrong! Expected " + sequence[step] + " got " + pressedColor);
				log("Restarting game");
				startLevel();
				buildStage();
				isWaiting = false;
				isProcessingInput = false;
				step = 0;
				feedbackEndTime = 0.0;
			}
		}, 0.3);
	}
	
	override function buttonHold(buttonIndex:Int) {}
	override function buttonRelease(buttonIndex:Int) {}
	override function buttonReleaseHold(buttonIndex:Int) {}

	static public function main() {}
}