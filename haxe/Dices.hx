import App;

enum DiceState {
	Idle;
	Rolling;
	Stopping;
	Falling;
}


	
//9 -> 0 1010101 00 1 00 1010101 0
//8 -> 0 1010101 00 0 00 1010101 0
//7 -> 0 0101010 00 1 00 0101010 0
//6 -> 0 0101010 00 0 00 0101010 0
//5 -> 0 0010100 00 1 00 0010100 0
//4 -> 0 0010100 00 0 00 0010100 0
//3 -> 0 0001000 00 1 00 0001000 0
//2 -> 0 0001000 00 0 00 0001000 0
//1 -> 0 0000000 00 1 00 0000000 0
//0 -> 0 0000000 00 0 00 0000000 0




class Dice {
	public var value:Int;
	private static var faces:Array<Array<Int>> = [
		[Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green],
		[Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green],
		[Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green],
		[Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Black, Colors.Green],
		[Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green],
		[Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green]
	];
	static var FACE_ORDER:Array<Int> = [1, 3, 5, 2, 6, 4];
	static var MIN_SPEED:Float = 2.0;
	static var MAX_SPEED:Float = 8.0;
	static var FALLING_SPEED:Float = 4.0;
	static var DECELERATION:Float = 5.0;

	var faceSize:Int;
	public var rotation:Float;
	public var speed:Float;
	public var timestamp:Float;
	public var state:DiceState;
	var game:Game;

	public function new(game:Game) {
		this.game = game;
		this.timestamp = game.time;
		this.state = Idle;
		this.rotation = 0;
		this.speed = 0;
		faceSize = faces[0].length;
		random();
	}

	public function random():Void {
		value = Math.floor(Math.random() * 6) + 1;
	}

	public function next():Void {
		value = (value % 6) + 1;
	}

	public function roll():Void {
		if (state == Idle) {
			speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
			state = Rolling;
			timestamp = game.time;
		}
	}

	public function stop():Void {
		if (state == Rolling) {
			state = Stopping;
		}
	}

	public function loop():Void {
		var elapsed = game.time - timestamp;
		timestamp = game.time;
		switch (state) {
			case Idle:
			case Rolling:
				rotation += elapsed * speed;
				rotation %= 1.0;
			case Stopping:
				rotation += elapsed * speed;
				rotation %= 1.0;
				speed -= DECELERATION * elapsed;
				if (speed <= 0) {
					speed = 0;
					state = Falling;
				}
			case Falling:
				var segment = Math.round(rotation * 6) % 6;
				var targetRotation = (segment + 0.5) / 6.0;
				var diff = targetRotation - rotation;
				if (diff > 0.5) diff -= 1.0;
				else if (diff < -0.5) diff += 1.0;
				if (Math.abs(diff) < FALLING_SPEED * elapsed) {
					rotation = targetRotation;
					state = Idle;
					var segmentIndex = Math.floor(rotation * 6) % 6;
					value = FACE_ORDER[segmentIndex];
				} else {
					rotation += (diff > 0 ? FALLING_SPEED : -FALLING_SPEED) * elapsed;
					rotation %= 1.0;
				}
		}
	}

	public function render():Array<Array<Int>> {
		var quarterRotation = (rotation * 4.0) % 1.0;
		var angle = quarterRotation * Math.PI * 0.5;
		var cosA = Math.cos(angle);
		var sinA = Math.sin(angle);
		
		var length1 = Math.floor(cosA * faceSize);
		var length2 = Math.floor(sinA * faceSize);
		
		var totalWidth = length1 + length2;
		if (totalWidth % 2 == 0)
			totalWidth += 1;
		var buffer:Array<Array<Int>> = [for (i in 0...totalWidth) rgb(Colors.Green)];
		
		var maxY = faceSize * Math.sqrt(2) / 2;
		
		var facePosition = Math.floor(rotation * 6) % 6;
		var faceIndex1 = FACE_ORDER[facePosition];
		var faceIndex2 = FACE_ORDER[(facePosition + 1) % 6];
		
		var pattern1 = faces[faceIndex1 - 1];
		var pattern2 = faces[faceIndex2 - 1];
		
		for (p in 0...length1) {
			var xFace = (p / length1 - 0.5) * faceSize;
			var y = xFace * sinA;
			var rawIntensity = (y + maxY) / (2 * maxY);
			var intensity = rawIntensity;
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			var patternPos = Math.floor((p / length1) * faceSize);
			if (patternPos < 0) patternPos = 0;
			if (patternPos >= faceSize) patternPos = faceSize - 1;
			
			var dotColor = pattern1[patternPos];
			
			if (dotColor == Colors.Black) {
				var grayValue = Math.floor(255 * intensity);
				buffer[p] = [grayValue, 0, 0];
			} else {
				var greenIntensity = Math.floor(255 * intensity);
				buffer[p] = [0, greenIntensity, 0];
			}
		}
		
		for (p in 0...length2) {
			var yFace = (p / length2 - 0.5) * faceSize;
			var y = yFace * cosA;
			var rawIntensity = (y + maxY) / (2 * maxY);
			var intensity = 1.0 - rawIntensity;
			
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			
			var patternPos = Math.floor((p / length2) * faceSize);
			if (patternPos < 0) patternPos = 0;
			if (patternPos >= faceSize) patternPos = faceSize - 1;
			var bufferPos = totalWidth - length2 + p;
			var dotColor = pattern2[patternPos];
			
			if (dotColor == Colors.Black) {
				var grayValue = Math.floor(255 * intensity);
				buffer[bufferPos] = [grayValue, 0, 0];
			} else {
				var greenIntensity = Math.floor(255 * intensity);
				buffer[bufferPos] = [0, greenIntensity, 0];
			}
		}
		
		return buffer;
	}

	public function rotate(amount:Float):Void {
		if (state == Idle) {
			rotation += amount;
			rotation %= 1.0;
			if (rotation < 0) rotation += 1.0;
			var segmentIndex = Math.floor(rotation * 6) % 6;
			value = FACE_ORDER[segmentIndex];
		}
	}
}

@:expose
class Dices extends Game {
	var dice:Dice;
	var centerPosition:Int;

	public function new(sound:Dynamic, resolution:Int) {
		log("Dices");
		super(sound, resolution);
		dice = new Dice(this);
		centerPosition = Math.floor(resolution / 2);
	}

	override public function loop() {
		super.loop();
		dice.loop();
		for (i in 0...resolution)
			pixels[i] = rgb(Colors.Black);
		var diceBuffer = dice.render();
		var diceSize = diceBuffer.length;
		var diceCenter = Math.floor(diceSize / 2);
		var startPos = centerPosition - diceCenter;
		for (i in 0...diceSize) {
			var stripPos = startPos + i;
			if (stripPos >= 0 && stripPos < resolution) {
				pixels[stripPos] = diceBuffer[i];
			}
		}
	}

	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				dice.rotate(1/60);
			case 2:
				dice.rotate(-1/60);
		}
	}

	static public function main() {}
}
