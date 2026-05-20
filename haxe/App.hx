package;

enum Alignment {
	CENTER;
	FORWARD;
	BACKWARD;
}

function correctLuminance(packed:Null<Int>):Null<Int> {
	if (packed == null) return null;
	var r = (packed >> 16) & 0xFF;
	var g = (packed >> 8) & 0xFF;
	var b = packed & 0xFF;
	return (Std.int(r * 0.38) << 16) | (Std.int(g * 0.28) << 8) | b;
}

enum EdgeMode {
	CLIP;
	MIRROR;
	WRAP;
}

class NewDisplayObject {
	public var app:App;
	public var pixels:Array<Null<Int>>;
	public var alignment:Alignment;

	public function new(app:App, size:Int, ?alignment:Alignment = CENTER) {
		this.app = app;
		this.alignment = alignment;
		pixels = [for (i in 0...size) null];
	}

	public function update():Void {}

	public function render(position:Float, ?edge:EdgeMode = CLIP):Void {
		var len = pixels.length;
		var start:Int;
		var step:Int;
		switch (alignment) {
			case CENTER:
				start = Math.round(position) - Std.int((len - 1) / 2);
				step = 1;
			case FORWARD:
				start = Math.round(position);
				step = 1;
			case BACKWARD:
				start = Math.round(position);
				step = -1;
		}
		for (i in 0...len) {
			var pos = start + i * step;
			switch (edge) {
				case CLIP:
					if (pos >= 0 && pos < app.resolution) {
						var src = pixels[i];
						if (src != null) {
							app.pixels[pos] = correctLuminance(src);
						}
					}
				case MIRROR:
					while (pos < 0) pos = -pos;
					while (pos >= app.resolution) pos = 2 * (app.resolution - 1) - pos;
					var src = pixels[i];
					if (src != null) {
						app.pixels[pos] = correctLuminance(src);
					}
				case WRAP:
					pos = ((pos % app.resolution) + app.resolution) % app.resolution;
					var src = pixels[i];
					if (src != null) {
						app.pixels[pos] = correctLuminance(src);
					}
			}
		}
	}
}

class DisplayObject {
	public var app:Dynamic;
	public var pixels:Array<Null<Int>>;
	public var position:Float;
	public var alignment:Alignment;

	public function new(app:App, size:Int, alignment:Alignment) {
		this.app = app;
		this.alignment = alignment;
		pixels = [for (i in 0...size) null];
		position = 0.0;
	}

	public function update():Void {}

	public function render():Void {
		var len = pixels.length;
		var pos = Math.round(position);
		var start:Int;
		var step:Int;
		switch (alignment) {
			case CENTER:
				start = pos - Std.int((len - 1) / 2);
				step = 1;
			case FORWARD:
				start = pos;
				step = 1;
			case BACKWARD:
				start = pos;
				step = -1;
		}
		for (i in 0...len) {
			var worldIdx = start + i * step;
			if (worldIdx >= 0 && worldIdx < app.resolution) {
				var src = pixels[i];
				if (src != null) {
					app.pixels[worldIdx] = correctLuminance(src);
				}
			}
		}
	}
}

class Colors {
	public static inline var None:Null<Int> = null;
	public static inline var Black:Null<Int> = 0x000000;
	public static inline var White:Null<Int> = 0xFFFFFF;
	public static inline var Silver:Null<Int> = 0x7F7F7F;
	public static inline var Red:Null<Int> = 0xFF0000;
	public static inline var Green:Null<Int> = 0x00FF00;
	public static inline var Blue:Null<Int> = 0x0000FF;
	public static inline var Yellow:Null<Int> = 0xFFFF00;
	public static inline var Cyan:Null<Int> = 0x00FFFF;
	public static inline var Magenta:Null<Int> = 0xFF00FF;
	public static inline var Orange:Null<Int> = 0xFF8800;
	public static inline var Purple:Null<Int> = 0x8800FF;
	public static inline var Pink:Null<Int> = 0xFF6699;
	public static inline var DarkRed:Null<Int> = 0x7F0000;
	public static inline var DarkGreen:Null<Int> = 0x007F00;
	public static inline var DarkBlue:Null<Int> = 0x00007F;
	public static inline var DarkYellow:Null<Int> = 0x999900;
	public static inline var DarkCyan:Null<Int> = 0x007F7F;
	public static inline var DarkMagenta:Null<Int> = 0x7F007F;
	public static inline var DarkWhite:Null<Int> = 0x7F7F7F;
	public static inline var DarkOrange:Null<Int> = 0x7F4400;
	public static inline var DarkPurple:Null<Int> = 0x44007F;
	public static inline var DarkPink:Null<Int> = 0x7F334C;
	public static inline var Banana:Null<Int> = 0xFFCC00;
	public static inline var Lemon:Null<Int> = 0xCCFF00;
	public static inline var Watermelon:Null<Int> = 0x007F00;
	public static inline var Blackberry:Null<Int> = 0x44007F;
	public static inline var Strawberry:Null<Int> = 0xFF3366;
}

function rgb(color:Null<Int>):Array<Int> {
	if (color == null) return [0, 0, 0];
	return [(color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF];
}

enum SoundEvent {
	LEVEL_COMPLETE;
	LEVEL_FAIL;
	GAME_COMPLETE;
	SHOOT;
	HIT;
	MISS;
	GENERATE_ITEM;
	TICK;
	CHECKPOINT;
	SIMONSAYS1;
	SIMONSAYS2;
	SIMONSAYS3;
	SIMONSAYS4;
	SIMONSAYS1_ORIGINAL;
	SIMONSAYS2_ORIGINAL;
	SIMONSAYS3_ORIGINAL;
	SIMONSAYS4_ORIGINAL;
}

extern class Audio {
	public var app:App;
	public function new(app:App):Void;
	public function play(event:SoundEvent):Void;
}

class App {
	public static var RESOLUTION:Int = 120;
	public var pixels:Array<Null<Int>>;
	public var name:String;
	public var audio:Audio;
	public var resolution:Int;
	public var uptime:Float;
	public var time:Float;
	public var isPaused:Bool;

	private var timestamp:Float;
	private var pendingHandler:Void->Void;
	private var handlerTime:Float;

	public function new(name:String, resolution:Int, audio:Audio) {
		this.name = name;
		this.resolution = resolution;
		this.audio = audio;
		this.audio.app = this;
		pixels = [for (i in 0...resolution) Colors.Black]; // default background
		timestamp = haxe.Timer.stamp();
		isPaused = false;
		pendingHandler = null;
		handlerTime = 0;
		uptime = 0;
		time = 0;
	}

	public function pause():Void { isPaused = true; }
	public function play():Void { isPaused = false; }

	public function loop():Void {
		var now = haxe.Timer.stamp();
		var delta = now - timestamp;
		timestamp = now;
		uptime += delta;
		if (!isPaused) time += delta;
		if (pendingHandler != null && uptime >= handlerTime) {
			var handler = pendingHandler;
			pendingHandler = null;
			handler();
		}
	}

	public function defer(handler:Void->Void, seconds:Float = 0):Void {
		pendingHandler = handler;
		handlerTime = uptime + seconds;
	}

	public function clear():Void {
		for (i in 0...resolution) pixels[i] = Colors.Black;
	}

	public function buttonPress(buttonIndex:Int):Void {}
	public function buttonHold(buttonIndex:Int):Void {}
	public function buttonRelease(buttonIndex:Int):Void {}
	public function buttonReleaseHold(buttonIndex:Int):Void {}
	public function log(message:String):Void {}
}

class Game extends App {
	public var levelTime:Float;
	public var level:Int;
	public var delta:Float;

	public function new(name:String, resolution:Int, audio:Audio) {
		super(name, resolution, audio);
		levelTime = 0;
		level = 0;
		delta = 0;
	}

	public function setLevel(n:Int):Void { level = n; }
	public function nextLevel():Void { level++; }

	public function playLevel():Void {
		buildStage();
		levelTime = 0;
		play();
	}

	public function buildStage():Void {}

	override public function loop():Void {
		var previousTime = time;
		super.loop();
		delta = time - previousTime;
		if (delta > 0) levelTime += delta;
	}
}

class RotatingShape {
	public var rotation:Float;
	public var speed:Float;
	public var targetSpeed:Float;
	public var acceleration:Float;
	private var app:App;
	private var timestamp:Float;
	private static final DECELERATION:Float = 5.0;
	private var targetRotation:Float;
	private var isRotatingTo:Bool;
	private var rotateToDuration:Float;

	public function new(app:App) {
		this.app = app;
		rotation = 0;
		speed = 0;
		targetSpeed = 0;
		acceleration = 0;
		timestamp = app.time;
		targetRotation = 0;
		isRotatingTo = false;
		rotateToDuration = 0;
	}

	public function setSpeed(speed:Float):Void {
		this.speed = speed;
		targetSpeed = speed;
		acceleration = 0;
		isRotatingTo = false;
	}

	public function stop() { decelerate(DECELERATION); isRotatingTo = false; }

	public function stopIn(duration:Float):Void {
		if (duration <= 0) setSpeed(0);
		else { targetSpeed = 0; acceleration = -speed / duration; }
		isRotatingTo = false;
	}

	public function decelerate(deceleration:Float):Void {
		targetSpeed = 0;
		acceleration = (speed > 0) ? -deceleration : deceleration;
		isRotatingTo = false;
	}

	public function accelerate(speed:Float, duration:Float):Void {
		targetSpeed = speed;
		acceleration = (speed - this.speed) / duration;
		isRotatingTo = false;
	}

	public function rotateTo(target:Float, duration:Float):Void {
		if (duration <= 0) { rotation = target; setSpeed(0); return; }
		targetRotation = target % 1.0;
		if (targetRotation < 0) targetRotation += 1.0;
		var diff = targetRotation - rotation;
		if (diff > 0.5) diff -= 1.0;
		else if (diff < -0.5) diff += 1.0;
		targetSpeed = diff / duration;
		acceleration = (targetSpeed - speed) / duration;
		isRotatingTo = true;
		rotateToDuration = duration;
		timestamp = app.time;
	}

	public function loop():Void {
		var now = app.time;
		var delta = now - timestamp;
		timestamp = now;
		if (isRotatingTo) {
			var currentDiff = targetRotation - rotation;
			var absDiff = Math.abs(currentDiff);
			if (absDiff < 0.01 || absDiff > 0.99 || delta >= rotateToDuration) {
				rotation = targetRotation;
				speed = 0; targetSpeed = 0; acceleration = 0; isRotatingTo = false;
			} else if (speed != targetSpeed) {
				speed += acceleration * delta;
				if ((acceleration > 0 && speed > targetSpeed) || (acceleration < 0 && speed < targetSpeed)) {
					speed = targetSpeed; acceleration = 0;
				}
			}
		} else if (speed != targetSpeed) {
			speed += acceleration * delta;
			if ((acceleration > 0 && speed > targetSpeed) || (acceleration < 0 && speed < targetSpeed)) {
				speed = targetSpeed; acceleration = 0;
			}
		}
		rotation += speed * delta;
		rotation = rotation % 1.0;
		if (rotation < 0) rotation += 1.0;
	}
}

class RotatingCube extends NewDisplayObject {
	public var faces:Array<Array<Null<Int>>>;
	public var rotation:Float;

	public function new(app:App, faces:Array<Array<Null<Int>>>) {
		this.faces = faces;
		var faceSize = faces[0].length;
		var size = Math.ceil(faceSize * Math.sqrt(2));
		if (size % 2 == 0) size++;
		super(app, size, CENTER);
		rotation = 0.0;
	}

	override public function update():Void {
		for (i in 0...pixels.length)
			pixels[i] = null;

		var faceSize = faces[0].length;
		var faceCount = faces.length;

		var quarterRotation = (rotation * faceCount) % 1.0;
		var angle = quarterRotation * Math.PI / 2;
		var cosA = Math.cos(angle);
		var sinA = Math.sin(angle);

		var length1 = Math.floor(cosA * faceSize);
		var length2 = Math.floor(sinA * faceSize);
		var totalWidth = length1 + length2;
		var startPos = Math.floor((pixels.length - totalWidth) / 2);

		var faceIndex = Math.floor(rotation * faceCount) % faceCount;
		var nextFaceIndex = (faceIndex + 1) % faceCount;
		var pattern1 = faces[faceIndex];
		var pattern2 = faces[nextFaceIndex];

		var maxY = faceSize * Math.sqrt(2) / 2;

		for (p in 0...length1) {
			var xFace = (p / length1 - 0.5) * faceSize;
			var y = xFace * sinA;
			var intensity = (y + maxY) / (2 * maxY);
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			var patternPos = Math.floor((p / length1) * faceSize);
			if (patternPos < 0) patternPos = 0;
			if (patternPos >= faceSize) patternPos = faceSize - 1;
			var src = pattern1[patternPos];
			if (src != null) {
				var r = (src >> 16) & 0xFF;
				var g = (src >> 8) & 0xFF;
				var b = src & 0xFF;
				pixels[startPos + p] = (Std.int(r * intensity) << 16) | (Std.int(g * intensity) << 8) | Std.int(b * intensity);
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
			var src = pattern2[patternPos];
			if (src != null) {
				var r = (src >> 16) & 0xFF;
				var g = (src >> 8) & 0xFF;
				var b = src & 0xFF;
				pixels[startPos + length1 + p] = (Std.int(r * intensity) << 16) | (Std.int(g * intensity) << 8) | Std.int(b * intensity);
			}
		}
	}
}