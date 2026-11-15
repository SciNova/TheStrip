import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Audio.Sound;
import _Graphics.Shape;
import _Graphics.Alignment;
import _Graphics.EdgeMode;

enum RaceStage {
	PLAYING;
	RESULT;
}

class Player extends Shape {
	public var location:Float;
	public var speed:Float;
	public var trailSpeed:Float;
	public var reverse:Bool;
	public var travel:Float;
	public var color:Int;

	public var BOOST:Float;
	public var FRICTION:Float = 3.75;
	public var TRAIL_FRICTION:Float = 2.5;
	public var MAX_SPEED:Float;

	static var TRAIL = 1 / 8;
	static var TRAIL_LENGTH:Int;

	static inline var TICK = 1 / 12;
	static inline var CHECKPOINT = 2;

	public function new(game:Game, color:Int) {
		var len = Math.round(game.resolution * TRAIL);
		super(game, len, Alignment.BACKWARD);
		this.color = color;
		location = game.resolution / 2;
		speed = 0;
		trailSpeed = 0;
		reverse = false;
		travel = 0;
		BOOST = 0.5 * game.resolution;
		MAX_SPEED = 1.5 * game.resolution;
		TRAIL_LENGTH = len;
	}

	public function tick(dt:Float):Void {
		var oldLocation = location;
		speed = speed * (1 - FRICTION * dt);
		location += speed * (reverse ? -1 : 1) * dt;

		if (location < 0) {
			location = -location;
			reverse = !reverse;
		} else if (location >= game.resolution) {
			location = 2 * (game.resolution - 1) - location;
			reverse = !reverse;
		}

		var prevTravel = travel;
		travel += (location > oldLocation) ? (location - oldLocation) : (oldLocation - location);

		if (Math.floor(prevTravel / (game.resolution * TICK)) != Math.floor(travel / (game.resolution * TICK)))
			game.audio.play(Sound.TICK);

		if (Math.floor(prevTravel / (game.resolution * CHECKPOINT)) != Math.floor(travel / (game.resolution * CHECKPOINT)))
			game.audio.play(Sound.CHECKPOINT);

		this.alignment = reverse ? Alignment.FORWARD : Alignment.BACKWARD;

		trailSpeed *= Math.max(0, 1 - TRAIL_FRICTION * dt);

		var frac = trailSpeed / BOOST;
		if (frac > 1) frac = 1;
		var trailPixels = 1 + Math.floor(frac * (TRAIL_LENGTH - 1));

		var baseR = (color >> 16) & 0xFF;
		var baseG = (color >> 8) & 0xFF;
		var baseB = color & 0xFF;

		for (j in 0...TRAIL_LENGTH) {
			if (j < trailPixels) {
				var intensity:Float;
				if (trailPixels == 1)
					intensity = 1.0;
				else
					intensity = 1.0 - (128.0 / 255.0) * (j / (trailPixels - 1));
				var r = Std.int(baseR * intensity);
				var g = Std.int(baseG * intensity);
				var b = Std.int(baseB * intensity);
				pixels[j] = (r << 16) | (g << 8) | b;
			} else {
				pixels[j] = null;
			}
		}
	}

	public function boost():Void {
		speed += BOOST;
		if (speed > MAX_SPEED) speed = MAX_SPEED;
		trailSpeed = speed;
	}
}

@:expose
class Race extends Game {
	static inline var TOTAL_LAPS:Float = 10.0;

	var playerA:Player;
	var playerB:Player;
	var stage:RaceStage;

	public function new(system:System) {
		super("Race", system);
		playerA = new Player(this, Colors.Red);
		playerB = new Player(this, Colors.Blue);
		stage = PLAYING;
	}

	override public function loop():Void {
		super.loop();

		var dt = system.delta;

		switch (stage) {
			case PLAYING:
				playerA.tick(dt);
				playerB.tick(dt);

				var targetTravel = TOTAL_LAPS * 2 * resolution;
				var scoreA:Float = playerA.travel / targetTravel;
				var scoreB:Float = playerB.travel / targetTravel;

				if (scoreA >= 1.0 || scoreB >= 1.0) {
					stage = RESULT;
					audio.play(Sound.LEVEL_COMPLETE);
					defer(function() {
						playerA = new Player(this, Colors.Green);
						playerB = new Player(this, Colors.Blue);
						stage = PLAYING;
					}, 4);
				}

				clear();
				drawProgressBar(scoreA, scoreB);
				playerA.render(playerA.location, EdgeMode.MIRROR);
				playerB.render(playerB.location, EdgeMode.MIRROR);

			case RESULT:
				clear();
				drawResultBars();
		}
	}

	function drawProgressBar(scoreA:Float, scoreB:Float):Void {
		var half = Std.int(resolution / 2);
		var barColor = 0x3C3C00;

		var lengthA = Math.round(scoreA * half);
		if (lengthA > half) lengthA = half;
		for (i in 0...lengthA)
			pixels[i] = barColor;

		var lengthB = Math.round(scoreB * half);
		if (lengthB > half) lengthB = half;
		for (i in (resolution - lengthB)...resolution)
			pixels[i] = barColor;

		var centerLeft = Std.int(resolution / 2) - 1;
		var centerRight = Std.int(resolution / 2);
		pixels[centerLeft] = barColor;
		pixels[centerRight] = barColor;
	}

	function drawResultBars():Void {
		var half = Std.int(resolution / 2);
		var targetTravel = TOTAL_LAPS * 2 * resolution;
		var aWon = playerA.travel >= targetTravel;
		var bWon = playerB.travel >= targetTravel;

		if (aWon && !bWon) {
			var col = Colors.correctLuminance(playerA.color);
			for (i in 0...half) pixels[i] = col;
		} else if (bWon && !aWon) {
			var col = Colors.correctLuminance(playerB.color);
			for (i in half...resolution) pixels[i] = col;
		} else {
			var colA = Colors.correctLuminance(playerA.color);
			var colB = Colors.correctLuminance(playerB.color);
			for (i in 0...half) pixels[i] = colA;
			for (i in half...resolution) pixels[i] = colB;
		}
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (stage != PLAYING) return;
		if (type != InputEvent.ButtonPress) return;

		switch (input) {
			case Input.ButtonA: playerA.boost();
			case Input.ButtonC: playerB.boost();
			default:
		}
	}

	static public function main() {}
}
