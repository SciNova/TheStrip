import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Audio.Sound;
import _Graphics.Square;
import _Graphics.EdgeMode;

@:expose
class DicesClock extends Game {
	var cubes:Array<Square>;
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
			0,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, 0, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, 0, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, 0, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			0,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, Colors.Green, 0, Colors.Green, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, 0, Colors.Green, 0, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, 0, Colors.Green, 0, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			Colors.Green, Colors.Green, 0, Colors.Green, 0, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			0,
			Colors.Green, Colors.Green,
			Colors.Green, Colors.Green, 0, Colors.Green, 0, Colors.Green, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			0, Colors.Green, 0, Colors.Green, 0, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			Colors.Green, 0, Colors.Green, 0, Colors.Green, 0, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			0, Colors.Green, 0, Colors.Green, 0, Colors.Green, Colors.Green,
			Colors.Green, Colors.Green,
			0,
			Colors.Green, Colors.Green,
			Colors.Green, 0, Colors.Green, 0, Colors.Green, 0, Colors.Green,
			Colors.Green
		],
		[
			Colors.Green,
			0, Colors.Green, 0, Colors.Green, 0, Colors.Green, 0,
			Colors.Green, Colors.Green,
			Colors.Green,
			Colors.Green, Colors.Green,
			0, Colors.Green, 0, Colors.Green, 0, Colors.Green, 0,
			Colors.Green
		],
		[
			Colors.Green,
			0, Colors.Green, 0, Colors.Green, 0, Colors.Green, 0,
			Colors.Green, Colors.Green,
			0,
			Colors.Green, Colors.Green,
			0, Colors.Green, 0, Colors.Green, 0, Colors.Green, 0,
			Colors.Green
		]
	];

	public function new(system:System) {
		super("DicesClock", system);
		cubes = [];
		for (i in 0...3) {
			var cube = new Square(this, DIGIT_PATTERNS);
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
			audio.play(Sound.TICK);
		}
		for (i in 0...resolution)
			pixels[i] = 0;
			
		var cubeW = 31;
		var spacing = 1;
		var colonGap = 3;
		
		var groupW = (3 * cubeW) + spacing + colonGap;
		var leftEdge = Math.floor((resolution - groupW) / 2);
		
		var pos = leftEdge + Math.floor(cubeW / 2);
		cubes[0].render(pos, EdgeMode.CLIP);
		
		pos += cubeW + colonGap;
		cubes[1].render(pos, EdgeMode.CLIP);
		
		pos += cubeW + spacing;
		cubes[2].render(pos, EdgeMode.CLIP);
		
		if (showColon) {
			var colonX = leftEdge + cubeW + Math.floor(colonGap / 2);
			if (colonX >= 0 && colonX < resolution)
				pixels[colonX] = Colors.White;
			if (colonX + 1 < resolution)
				pixels[colonX + 1] = Colors.White;
		}
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {}

	static public function main() {}
}
