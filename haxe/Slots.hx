import App;

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

enum State {
	IDLE;
	SPINNING;
	RESULT;
}

class Wheel extends DisplayObject {
	public var rotation: Float = 0.0;
	public var speed: Float = 0.0;
	public var spinEndTime: Float = 0.0;
	public var symbols: Array<Fruit>;

	var timestamp: Float = 0.0;
	var prevRotation: Float = 0.0;

	public function new(app: App, size: Int, symbols: Array<Fruit>) {
		super(app, size, Alignment.CENTER);
		this.symbols = symbols;
		this.timestamp = app.time;
	}

	override public function update() {
		var now = app.time;
		var dt = now - timestamp;
		timestamp = now;
		prevRotation = rotation;

		if (speed > 0) {
			if (now >= spinEndTime) {
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
				app.audio.play(SoundEvent.TICK);
		}

		// Render wheel into packed pixel buffer
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
class Slots extends App {
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

	var state: State;
	var wheels: Array<Wheel>;
	var segmentPixels: Int;
	var offset: Int;

	public function new(audio: Audio, resolution: Int) {
		super("Slots", resolution, audio);

		segmentPixels = Std.int(resolution / NUM_WHEELS);
		if (segmentPixels % 2 == 0)
			segmentPixels--;
		offset = Std.int((resolution - segmentPixels * NUM_WHEELS) / 2);

		wheels = [];
		for (i in 0...NUM_WHEELS) {
			var w = new Wheel(this, segmentPixels, WHEELS[i]);
			var segmentStart = offset + i * segmentPixels;
			w.position = segmentStart + (segmentPixels - 1) / 2;
			w.rotation = Math.floor(Math.random() * NUM_SYMBOLS);
			wheels.push(w);
		}
		state = IDLE;
	}

	function spin() {
		for (wheel in wheels) {
			wheel.speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
			wheel.spinEndTime = time + MIN_SPIN_DURATION + Math.random() * (MAX_SPIN_DURATION - MIN_SPIN_DURATION);
		}
		state = SPINNING;
	}

	override public function loop() {
		super.loop();
		if (pendingHandler != null)
			return;

		for (wheel in wheels)
			wheel.update();

		if (state == SPINNING) {
			var allStopped = true;
			for (wheel in wheels) {
				if (wheel.speed > 0) {
					allStopped = false;
					break;
				}
			}
			if (allStopped) {
				state = RESULT;
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
		if (centreFruits[0] == centreFruits[1] && centreFruits[1] == centreFruits[2]) {
			audio.play(SoundEvent.LEVEL_COMPLETE);
		} else {
			audio.play(SoundEvent.LEVEL_FAIL);
		}
		defer(function() {
			state = IDLE;
		}, 4);
	}

	override public function buttonPress(buttonIndex: Int) {
		if (state == IDLE && buttonIndex == 0)
			spin();
	}

	function render() {
		clear();
		for (wheel in wheels)
			wheel.render();

		for (wheel in wheels)
			pixels[Math.round(wheel.position)] = correctLuminance(Colors.White);
	}

	static function main() {}
}