import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Audio.Sound;
import _Graphics.Square;
import _Graphics.EdgeMode;

enum Stage {
	IDLE;
	ROLLING;
}

class Dice extends Square {
	static var FACES:Array<Array<Null<Int>>> = [
		[Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, 0, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White],
		[Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, 0, Colors.White, Colors.White, Colors.White, 0, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White],
		[Colors.White, Colors.White, Colors.White, 0, Colors.White, Colors.White, Colors.White, 0, Colors.White, Colors.White, Colors.White, 0, Colors.White, Colors.White, Colors.White],
		[Colors.White, Colors.White, 0, Colors.White, 0, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, 0, Colors.White, 0, Colors.White, Colors.White],
		[Colors.White, Colors.White, 0, Colors.White, 0, Colors.White, Colors.White, 0, Colors.White, Colors.White, 0, Colors.White, 0, Colors.White, Colors.White],
		[Colors.White, 0, Colors.White, 0, Colors.White, 0, Colors.White, Colors.White, Colors.White, 0, Colors.White, 0, Colors.White, 0, Colors.White]
	];

	public function new(game:Game) {
		super(game, FACES);
	}
}

@:expose
class Dices extends Game {
	var dice1:Dice;
	var dice2:Dice;

	var stage:Stage = IDLE;

	var speed1:Float = 0;
	var speed2:Float = 0;
	var remaining1:Float = 0;
	var remaining2:Float = 0;

	var lastFace1:Int = 0;
	var lastFace2:Int = 0;

	static inline var MIN_SPEED:Float = 4.0;
	static inline var MAX_SPEED:Float = 10.0;
	static inline var MIN_DURATION:Float = 0.5;
	static inline var MAX_DURATION:Float = 2.0;
	static inline var DECELERATION:Float = 6.0;

	public function new(system:System) {
		super("Dices", system);
		dice1 = new Dice(this);
		dice2 = new Dice(this);
		lastFace1 = Std.int(dice1.rotation * 6);
		lastFace2 = Std.int(dice2.rotation * 6);
	}

	override public function loop():Void {
		super.loop();

		var dt = system.delta;

		if (stage == ROLLING) {
			if (remaining1 > 0) {
				dice1.rotation = (dice1.rotation + speed1 * dt) % 1.0;
				remaining1 -= dt;
			} else if (speed1 > 0) {
				speed1 = Math.max(speed1 - DECELERATION * dt, 0);
				if (speed1 == 0) {
					dice1.rotation = Math.round(dice1.rotation * 6) / 6;
					audio.play(Sound.CHECKPOINT);
				} else {
					dice1.rotation = (dice1.rotation + speed1 * dt) % 1.0;
				}
			}

			var face1 = Std.int(dice1.rotation * 6) % 6;
			if (face1 != lastFace1) {
				lastFace1 = face1;
				audio.play(Sound.TICK);
			}

			if (remaining2 > 0) {
				dice2.rotation = (dice2.rotation + speed2 * dt) % 1.0;
				remaining2 -= dt;
			} else if (speed2 > 0) {
				speed2 = Math.max(speed2 - DECELERATION * dt, 0);
				if (speed2 == 0) {
					dice2.rotation = Math.round(dice2.rotation * 6) / 6;
					audio.play(Sound.CHECKPOINT);
				} else {
					dice2.rotation = (dice2.rotation + speed2 * dt) % 1.0;
				}
			}

			var face2 = Std.int(dice2.rotation * 6) % 6;
			if (face2 != lastFace2) {
				lastFace2 = face2;
				audio.play(Sound.TICK);
			}

			if (speed1 == 0 && remaining1 <= 0 && speed2 == 0 && remaining2 <= 0)
				stage = IDLE;
		}

		for (i in 0...resolution)
			pixels[i] = Colors.DarkGreen;

		dice1.update();
		dice2.update();
		dice1.render(Std.int(resolution / 3), EdgeMode.MIRROR);
		dice2.render(Std.int(2 * resolution / 3), EdgeMode.MIRROR);
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (type != InputEvent.ButtonPress) return;
		if (input == Input.ButtonA && stage == IDLE) {
			speed1 = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
			speed2 = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
			remaining1 = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
			remaining2 = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
			stage = ROLLING;
		}
	}

	static public function main() {}
}