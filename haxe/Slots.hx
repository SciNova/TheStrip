import App;

enum Fruit {
	Apple;
	Banana;
	Grape;
	Orange;
	Cherry;
	Lemon;
	Watermelon;
}

final FruitSize: Array<Float> = [0.3, 0.7, 0.6, 0.6, 0.4, 0.5, 0.8];

enum GameState {
	Idle;
	Spinning;
	Stopping;
	Result;
}

class Wheel {
	public var position: Float = 0.0;
	public var lastPosition: Float = 0.0;
	public var speed: Float = 0.0;
	public var isStopping: Bool = false;
	public var stopTime: Float = 0.0;
	public var symbols: Array<Fruit>;
	var app: App;
	var timestamp: Float = 0.0;

	public function new(app: App, symbols: Array<Fruit>) {
		this.app = app;
		this.symbols = symbols;
		this.timestamp = app.time;
		this.lastPosition = 0.0;
	}

	public function update() {
		var now = app.time;
		var dt = now - timestamp;
		timestamp = now;
		lastPosition = position;
		if (isStopping) {
			speed *= 0.95;
			if (speed < 0.1) speed = 0.0;
		}
		position += speed * dt;
		
		if (speed > 0) {
			if (Math.floor(position) != Math.floor(lastPosition))
				app.sound.play('slotsClick');
		}
	
		while (position >= Slots.NUM_SYMBOLS)
			position -= Slots.NUM_SYMBOLS;
	}
}

@:expose
class Slots extends App {
	static public final NUM_WHEELS = 3;
	static public final NUM_SYMBOLS = 8;
	static final MIN_SPEED = 10;
	static final MAX_SPEED = 40;
	static final MIN_SPIN_DURATION = 2.0;
	static final MAX_SPIN_DURATION = 5.0;
	static final MIN_STOP_DURATION = 1.0;
	static final MAX_STOP_DURATION = 3.0;
	static final WHEELS: Array<Array<Fruit>> = [
		[Apple, Banana, Grape, Orange, Cherry, Lemon, Watermelon, Apple],
		[Banana, Grape, Orange, Cherry, Lemon, Watermelon, Apple, Banana],
		[Grape, Orange, Cherry, Lemon, Watermelon, Apple, Banana, Grape]
	];

	var state: GameState;
	var wheels: Array<Wheel>;
	var spinStartTime: Float;
	var spinDuration: Float;
	var offset:Int;

	public function new(sound:Dynamic, resolution:Int) {
		super(sound, resolution);

		var segmentPixels = Std.int(resolution / NUM_WHEELS);
		if (segmentPixels % 2 == 0)
			segmentPixels--;
		offset = Std.int((resolution - segmentPixels * NUM_WHEELS) / 2);
		wheels = [];
		for (i in 0...NUM_WHEELS)
			wheels.push(new Wheel(this, WHEELS[i]));
		state = Idle;
	}

	function spin() {
		spinStartTime = time;
		spinDuration = MIN_SPIN_DURATION + Math.random() * (MAX_SPIN_DURATION - MIN_SPIN_DURATION);
		for (i in 0...NUM_WHEELS) {
			wheels[i].stopTime = MIN_STOP_DURATION + Math.random() * (MAX_STOP_DURATION - MIN_STOP_DURATION);
			wheels[i].isStopping = false;
			wheels[i].speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
		}
		state = Spinning;
	}

	override public function loop() {
		super.loop();
		if (pendingHandler != null)
			return;

		var elapsed = time - spinStartTime;

		switch (state) {
			case Spinning:
				for (i in 0...NUM_WHEELS) {
					if (!wheels[i].isStopping && elapsed >= wheels[i].stopTime) {
						wheels[i].isStopping = true;
					}
				}
				if (elapsed >= spinDuration) {
					state = Stopping;
				}
			case Stopping:
				var allStopped = true;
				for (wheel in wheels) {
					if (wheel.speed > 0.1) {
						allStopped = false;
						break;
					}
				}
				if (allStopped) {
					state = Result;
					state = Idle;
				}
			case Idle, Result:
		}
		for (wheel in wheels)
			wheel.update();
		render();
	}

	override public function buttonPress(buttonIndex:Int) {
		if (state == Idle && buttonIndex == 0)
			spin();
	}

	function render() {
		var segmentPixels:Int = Std.int(resolution / NUM_WHEELS);
		var slotsPerWheel = NUM_SYMBOLS;
		var slotAngle = 2 * Math.PI / slotsPerWheel;
		
		for (wheelIndex in 0...NUM_WHEELS) {
			var wheel = wheels[wheelIndex];
			var wheelRotation = wheel.position * slotAngle;
			var segmentStart = wheelIndex * segmentPixels;
			
			for (j in 0...segmentPixels) {
				var normalized = j / (segmentPixels - 1);
				var theta = (normalized - 0.5) * Math.PI;
				var absoluteAngle = theta + wheelRotation;
				absoluteAngle = absoluteAngle % (2 * Math.PI);
				if (absoluteAngle < 0)
					absoluteAngle += 2 * Math.PI;
				var slotIndex = Std.int(Math.floor(absoluteAngle / slotAngle)) % slotsPerWheel;
				var localAngle = absoluteAngle - slotIndex * slotAngle;
				var fruit = wheel.symbols[slotIndex];
				
				var fruitLength = FruitSize[fruit.getIndex()];
				var fruitAngularSpan = fruitLength * slotAngle;
				var fruitStartAngle = (slotAngle - fruitAngularSpan) / 2;
				var fruitEndAngle = (slotAngle + fruitAngularSpan) / 2;
				
				var color:Array<Int> = switch(fruit) {
					case Apple: rgb(Colors.Green);
					case Banana: rgb(Colors.Red);
					case Grape: rgb(Colors.Purple);
					case Orange: rgb(Colors.Orange);
					case Cherry: rgb(Colors.Red);
					case Lemon: rgb(Colors.Yellow);
					case Watermelon: rgb(Colors.DarkGreen);
				};
				
				if (!(localAngle >= fruitStartAngle && localAngle <= fruitEndAngle))
					color = rgb(Colors.Silver);
					
				var brightness = 1 - Math.pow((normalized - 0.5) * 2, 2);
				var r = Math.round(color[0] * brightness);
				var g = Math.round(color[1] * brightness);
				var b = Math.round(color[2] * brightness);
				pixels[offset + segmentStart + j] = [r, g, b];
			}
		}
		
		var segmentPixels:Int = Std.int(resolution / NUM_WHEELS);
		for (wheelIndex in 0...NUM_WHEELS) {
			var segmentStart = wheelIndex * segmentPixels;
			var half = Std.int(segmentPixels / 2);
			var centerIdx = segmentStart + half;
			pixels[offset + centerIdx] = rgb(Colors.White);
		}
	}

	static function main() {
	}
}
