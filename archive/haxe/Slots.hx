import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Audio.Sound;
import _Graphics.Shape;
import _Graphics.Alignment;
import _Graphics.EdgeMode;

enum Fruit {
	Apple;
	Banana;
	Grape;
	Orange;
	Cherry;
	Lemon;
	Watermelon;
	Blackberry;
	Strawberry;
}

final FruitSize: Array<Float> = [0.3, 0.7, 0.6, 0.6, 0.4, 0.5, 0.8, 0.2, 0.45];

enum Stage {
	IDLE;
	SPINNING;
	RESULT;
}

class Wheel extends Shape {
	public var speed: Float = 0.0;
	public var spinEndTime: Float = 0.0;
	public var symbols: Array<Fruit>;

	var prevRotation: Float = 0.0;

	public function new(game: Game, size: Int, symbols: Array<Fruit>) {
		super(game, size, Alignment.CENTER);
		this.symbols = symbols;
	}

	public function tick(dt: Float):Void {
		prevRotation = rotation;

		if (speed > 0) {
			if (game.time >= spinEndTime) {
				speed -= Slots.DECELERATION * dt;
				if (speed <= 0) {
					speed = 0;
					rotation = Math.round(rotation);
				}
			}
			rotation += speed * dt;
			while (rotation >= Slots.NUM_SYMBOLS)
				rotation -= Slots.NUM_SYMBOLS;
			while (rotation < 0)
				rotation += Slots.NUM_SYMBOLS;
		}

		if (speed > 0) {
			if (Math.floor(rotation) != Math.floor(prevRotation))
				game.audio.play(Sound.TICK);
		}

		var S = pixels.length;
		var slotAngle = 2 * Math.PI / Slots.NUM_SYMBOLS;
		var wheelAngle = rotation * slotAngle + slotAngle / 2;

		for (j in 0...S) {
			var t = j / (S - 1);
			var theta = (t - 0.5) * Math.PI;
			var absoluteAngle = theta + wheelAngle;
			absoluteAngle = absoluteAngle % (2 * Math.PI);
			if (absoluteAngle < 0)
				absoluteAngle += 2 * Math.PI;

			var slotIndex = Std.int(Math.floor(absoluteAngle / slotAngle)) % Slots.NUM_SYMBOLS;
			var localAngle = absoluteAngle - slotIndex * slotAngle;
			var fruit = symbols[slotIndex];

			var fruitLength = FruitSize[fruit.getIndex()];
			var fruitAngularSpan = fruitLength * slotAngle;
			var fruitStartAngle = (slotAngle - fruitAngularSpan) / 2;
			var fruitEndAngle = (slotAngle + fruitAngularSpan) / 2;

			var fruitColor: Null<Int> = switch (fruit) {
				case Apple:       Colors.Green;
				case Banana:      Colors.Banana;
				case Grape:       Colors.Purple;
				case Orange:      Colors.Orange;
				case Cherry:      Colors.Red;
				case Lemon:       Colors.Lemon;
				case Watermelon:  Colors.Watermelon;
				case Blackberry:  Colors.Blackberry;
				case Strawberry:  Colors.Strawberry;
			};

			if (!(localAngle >= fruitStartAngle && localAngle <= fruitEndAngle))
				fruitColor = Colors.Silver;

			var brightness = 1 - Math.pow((t - 0.5) * 2, 2);
			var r = (fruitColor >> 16) & 0xFF;
			var g = (fruitColor >> 8) & 0xFF;
			var b = fruitColor & 0xFF;
			pixels[j] = (Std.int(r * brightness) << 16) |
			            (Std.int(g * brightness) << 8) |
			            Std.int(b * brightness);
		}
	}
}

@:expose
class Slots extends Game {
	static public final NUM_WHEELS = 3;
	static public final NUM_SYMBOLS = 8;
	static public final DECELERATION = 15.0;
	static final MIN_SPEED = 10;
	static final MAX_SPEED = 40;
	static final MIN_SPIN_DURATION = 2.0;
	static final MAX_SPIN_DURATION = 5.0;

	static final WHEELS: Array<Array<Fruit>> = [
		[Cherry, Lemon, Orange, Banana, Cherry, Lemon, Watermelon, Orange],
		[Banana, Cherry, Lemon, Orange, Cherry, Watermelon, Lemon, Orange],
		[Lemon, Orange, Cherry, Watermelon, Lemon, Orange, Banana, Cherry]
	];

	var stage: Stage;
	var wheels: Array<Wheel>;
	var segmentPixels: Int;
	var offset: Int;

	public function new(system: System) {
		super("Slots", system);

		segmentPixels = Std.int(resolution / NUM_WHEELS);
		if (segmentPixels % 2 == 0)
			segmentPixels--;
		offset = Std.int((resolution - segmentPixels * NUM_WHEELS) / 2);

		wheels = [];
		for (i in 0...NUM_WHEELS) {
			var w = new Wheel(this, segmentPixels, WHEELS[i]);
			w.rotation = Math.floor(Math.random() * NUM_SYMBOLS);
			wheels.push(w);
		}
		stage = IDLE;
	}

	function spin() {
		for (wheel in wheels) {
			wheel.speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
			wheel.spinEndTime = time + MIN_SPIN_DURATION + Math.random() * (MAX_SPIN_DURATION - MIN_SPIN_DURATION);
		}
		stage = SPINNING;
	}

	override public function loop() {
		super.loop();

		var dt = system.delta;

		for (wheel in wheels)
			wheel.tick(dt);

		if (stage == SPINNING) {
			var allStopped = true;
			for (wheel in wheels) {
				if (wheel.speed > 0) {
					allStopped = false;
					break;
				}
			}
			if (allStopped) {
				stage = RESULT;
				evaluate();
			}
		}

		render();
	}

	function evaluate() {
		var centreFruits: Array<Fruit> = [];
		for (wheel in wheels) {
			var idx = Math.round(wheel.rotation) % NUM_SYMBOLS;
			centreFruits.push(wheel.symbols[idx]);
		}
		if (centreFruits[0] == centreFruits[1] && centreFruits[1] == centreFruits[2])
			audio.play(Sound.LEVEL_COMPLETE);
		else
			audio.play(Sound.LEVEL_FAIL);

		defer(function() {
			stage = IDLE;
		}, 4);
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (type == InputEvent.ButtonPress && stage == IDLE && input == Input.ButtonA)
			spin();
	}

	function render() {
		clear();
		for (i in 0...wheels.length) {
			var segmentStart = offset + i * segmentPixels;
			var centre = segmentStart + (segmentPixels - 1) / 2;
			wheels[i].render(centre, EdgeMode.CLIP);
			pixels[Math.round(centre)] = Colors.correctLuminance(Colors.White);
		}
	}

	static function main() {}
}
