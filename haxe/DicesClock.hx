import App;

@:expose
class DicesClock extends Game {
	var cubes:Array<RotatingCube>;
	var lastSecond:Float = -1;
	var showColon:Bool = true;

	static var DIGIT_PATTERNS:Array<Array<Null<Int>>> = [
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Black,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Black,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Black,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Black,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
			Colors.Green, Colors.Green,
			Colors.Black,
			Colors.Green, Colors.Green,
			Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
			Colors.Green
		]
	];

	public function new(audio:Audio, resolution:Int) {
		super("DiceClock", resolution, audio);
		cubes = [];
		for (i in 0...3) {
			var cube = new RotatingCube(this, DIGIT_PATTERNS);
			cube.rotation = 0.0;
			cubes.push(cube);
		}
		updateDisplay();
	}

	function setDigit(cubeIdx:Int, digit:Int) {
		cubes[cubeIdx].rotation = digit / 10.0;
		cubes[cubeIdx].update();
	}

	function updateDisplay() {
		var totalSeconds = Math.floor(time);
		var minutes = Math.floor(totalSeconds / 60) % 10;
		var seconds = totalSeconds % 60;
		setDigit(0, minutes);
		setDigit(1, Math.floor(seconds / 10));
		setDigit(2, seconds % 10);
	}

	override public function loop() {
		super.loop();
		var currentSecond = Math.floor(time);
		if (currentSecond != lastSecond) {
			lastSecond = currentSecond;
			showColon = !showColon;
			updateDisplay();
			audio.play(SoundEvent.TICK);
		}
		for (i in 0...resolution) pixels[i] = Colors.Black;
		var cubeW = 31;
		var spacing = 1;
		var colonGap = 3;
		var groupW = 3 * cubeW + 2 * spacing + colonGap;
		var leftEdge = Math.floor((resolution - groupW) / 2);
		var pos = leftEdge + Math.floor(cubeW / 2);
		cubes[0].render(pos);
		pos += cubeW + colonGap;
		cubes[1].render(pos);
		pos += cubeW + spacing;
		cubes[2].render(pos);
		if (showColon) {
			var colonX = leftEdge + cubeW + Math.floor(colonGap / 2);
			if (colonX >= 0 && colonX < resolution) pixels[colonX] = Colors.White;
			if (colonX + 1 < resolution) pixels[colonX + 1] = Colors.White;
		}
	}

	override public function buttonPress(buttonIndex:Int):Void {
		if (buttonIndex == 0) showColon = !showColon;
	}

	static public function main() {}
}
