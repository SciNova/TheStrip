import App;

enum State {
	IDLE;
	ROLLING;
}

class Dice extends RotatingCube {
	static var FACES:Array<Array<Null<Int>>> = [
		[Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White],
		[Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White],
		[Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White],
		[Colors.White, Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White, Colors.White],
		[Colors.White, Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White, Colors.White],
		[Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White, Colors.White, Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White, Colors.Black, Colors.White]
	];

	public function new(app:App) {
		super(app, FACES);
	}
}

@:expose
class Dices extends Game {
	var dice1:Dice;
	var dice2:Dice;

	var state:State = IDLE;

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

	public function new(audio:Dynamic, resolution:Int) {
		super("Dices", resolution, audio);
		dice1 = new Dice(this);
		dice2 = new Dice(this);
		lastFace1 = Std.int(dice1.rotation * 6);
		lastFace2 = Std.int(dice2.rotation * 6);
	}

	override public function loop():Void {
		super.loop();

		if (state == ROLLING) {
			if (remaining1 > 0) {
				dice1.rotation = (dice1.rotation + speed1 * delta) % 1.0;
				remaining1 -= delta;
			} else if (speed1 > 0) {
				speed1 = Math.max(speed1 - DECELERATION * delta, 0);
				if (speed1 == 0) {
					dice1.rotation = Math.round(dice1.rotation * 6) / 6;
					audio.play(CHECKPOINT);
				} else {
					dice1.rotation = (dice1.rotation + speed1 * delta) % 1.0;
				}
			}

			var face1 = Std.int(dice1.rotation * 6) % 6;
			if (face1 != lastFace1) {
				lastFace1 = face1;
				audio.play(TICK);
			}

			if (remaining2 > 0) {
				dice2.rotation = (dice2.rotation + speed2 * delta) % 1.0;
				remaining2 -= delta;
			} else if (speed2 > 0) {
				speed2 = Math.max(speed2 - DECELERATION * delta, 0);
				if (speed2 == 0) {
					dice2.rotation = Math.round(dice2.rotation * 6) / 6;
					audio.play(CHECKPOINT);
				} else {
					dice2.rotation = (dice2.rotation + speed2 * delta) % 1.0;
				}
			}

			var face2 = Std.int(dice2.rotation * 6) % 6;
			if (face2 != lastFace2) {
				lastFace2 = face2;
				audio.play(TICK);
			}

			if (speed1 == 0 && remaining1 <= 0 && speed2 == 0 && remaining2 <= 0) {
				state = IDLE;
			}
		}

		for (i in 0...resolution)
			pixels[i] = Colors.DarkGreen;

		dice1.update();
		dice2.update();
		dice1.render(Std.int(resolution / 3), MIRROR);
		dice2.render(Std.int(2 * resolution / 3), MIRROR);
	}

	override public function buttonPress(buttonIndex:Int):Void {
		if (buttonIndex == 0 && state == IDLE) {
			speed1 = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
			speed2 = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
			remaining1 = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
			remaining2 = MIN_DURATION + Math.random() * (MAX_DURATION - MIN_DURATION);
			state = ROLLING;
		}
	}

	static public function main() {}
}