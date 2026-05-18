package;


class Colors {
	public static inline var None:Int = 0x000000;
	public static inline var Black:Int = 0x000000;
	public static inline var White:Int = 0xFFFFFF;
	public static inline var Silver:Int = 0x7F7F7F;
	public static inline var Red:Int = 0xFF0000;
	public static inline var Green:Int = 0x00FF00;
	public static inline var Blue:Int = 0x0000FF;
	public static inline var Yellow:Int = 0xFFFF00;
	public static inline var Cyan:Int = 0x00FFFF;
	public static inline var Magenta:Int = 0xFF00FF;
	public static inline var Orange:Int = 0xFF8800;
	public static inline var Purple:Int = 0x8800FF;
	public static inline var Pink:Int = 0xFF6699;
	public static inline var DarkRed:Int = 0x7F0000;
	public static inline var DarkGreen:Int = 0x007F00;
	public static inline var DarkBlue:Int = 0x00007F;
	public static inline var DarkYellow:Int = 0x999900;
	public static inline var DarkCyan:Int = 0x007F7F;
	public static inline var DarkMagenta:Int = 0x7F007F;
	public static inline var DarkWhite:Int = 0x7F7F7F;
	public static inline var DarkOrange:Int = 0x7F4400;
	public static inline var DarkPurple:Int = 0x44007F;
	public static inline var DarkPink:Int = 0x7F334C;
}

function rgb(color:Int):Array<Int> {
	return [(color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF];
}




class App {
	public var pixels:Array<Array<Int>>;
	public var sound:Dynamic;
	public var resolution:Int;
	public var uptime:Float;
	public var time:Float;
	public var isPaused:Bool;
	private var timestamp:Float;
	private var pendingHandler:Void->Void;
	private var handlerTime:Float;
	
	public function new(sound:Dynamic, resolution:Int) {
		this.resolution = resolution;
		this.sound = sound;
		pixels = [for (i in 0...resolution) [0, 0, 0]];
		timestamp = haxe.Timer.stamp();
		isPaused = false;
		pendingHandler = null;
		handlerTime = 0;
		uptime = 0;
		time = 0;
		//clear();
	}

	public function pause():Void {
		isPaused = true;
	}

	public function play():Void {
		isPaused = false;
	}

	public function loop():Void {
		var now = haxe.Timer.stamp();
		var delta = now - timestamp;
		timestamp = now;
		uptime += delta;
		if (!isPaused)
			time += delta;
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
		for (i in 0...resolution) {
			pixels[i][0] = 0;
			pixels[i][1] = 0;
			pixels[i][2] = 0;
		}
	}

	public function buttonPress(buttonIndex:Int):Void {}
	public function buttonHold(buttonIndex:Int):Void {}
	public function buttonRelease(buttonIndex:Int):Void {}
	public function buttonReleaseHold(buttonIndex:Int):Void {}
	
	public function log(message:String):Void {
	}
}




class Game extends App {
	public var levelTime:Float;
	public var level:Int;
	
	public function new(sound:Dynamic, resolution:Int) {
		super(sound, resolution);
		levelTime = 0;
		level = 0;
	}
	
	public function setLevel(level:Int):Void {
		this.level = level;
		buildStage();
		levelTime = 0;
		play();
	}
	
	public function startLevel():Void {
		buildStage();
		levelTime = 0;
		play();
	}
	
	public function startNextLevel():Void {
		level++;
		buildStage();
		levelTime = 0;
		play();
	}

	public function buildStage():Void {
	}

	override public function loop():Void {
		var previousTime = time;
		super.loop();
		if (time > previousTime)
			levelTime += (time - previousTime);
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
	
	// Add these for rotateTo functionality
	private var targetRotation:Float;
	private var isRotatingTo:Bool;
	private var rotateToDuration:Float;

	public function new(app:App) {
		this.app = app;
		this.rotation = 0;
		this.speed = 0;
		this.targetSpeed = 0;
		this.acceleration = 0;
		this.timestamp = app.time;
		
		// Initialize rotateTo variables
		this.targetRotation = 0;
		this.isRotatingTo = false;
		this.rotateToDuration = 0;
	}

	public function setSpeed(speed:Float):Void {
		this.speed = speed;
		this.targetSpeed = speed;
		this.acceleration = 0;
		this.isRotatingTo = false; // Cancel any active rotateTo
	}

	public function stop() {
		decelerate(DECELERATION);
		this.isRotatingTo = false;
	}

	public function stopIn(duration:Float):Void {
		if (duration <= 0) {
			setSpeed(0);
		} else {
			targetSpeed = 0;
			acceleration = -speed / duration;
		}
		this.isRotatingTo = false;
	}

	public function decelerate(deceleration:Float):Void {
		targetSpeed = 0;
		acceleration = (speed > 0) ? -deceleration : deceleration;
		this.isRotatingTo = false;
	}

	public function accelerate(speed:Float, duration:Float):Void {
		this.targetSpeed = speed;
		acceleration = (speed - this.speed) / duration;
		this.isRotatingTo = false;
	}
	
	// NEW METHOD: Rotate to a specific rotation over a duration
	public function rotateTo(target:Float, duration:Float):Void {
		if (duration <= 0) {
			rotation = target;
			setSpeed(0);
			return;
		}
		
		// Normalize target to 0-1
		targetRotation = target % 1.0;
		if (targetRotation < 0) targetRotation += 1.0;
		
		// Calculate shortest path difference
		var diff = targetRotation - rotation;
		if (diff > 0.5) diff -= 1.0;
		else if (diff < -0.5) diff += 1.0;
		
		// Set speed to reach target in duration
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
			// Check if we've reached or passed the target
			var currentDiff = targetRotation - rotation;
			var absDiff = Math.abs(currentDiff);
			
			// If we're close to target or time is up, snap to target
			if (absDiff < 0.01 || absDiff > 0.99 || delta >= rotateToDuration) {
				rotation = targetRotation;
				speed = 0;
				targetSpeed = 0;
				acceleration = 0;
				isRotatingTo = false;
			} else if (this.speed != targetSpeed) {
				// Continue accelerating/decelerating
				this.speed += acceleration * delta;
				if ((acceleration > 0 && this.speed > targetSpeed) || 
					(acceleration < 0 && this.speed < targetSpeed)) {
					this.speed = targetSpeed;
					acceleration = 0;
				}
			}
		} else if (this.speed != targetSpeed) {
			// Original speed adjustment logic
			this.speed += acceleration * delta;
			if ((acceleration > 0 && this.speed > targetSpeed) || 
				(acceleration < 0 && this.speed < targetSpeed)) {
				this.speed = targetSpeed;
				acceleration = 0;
			}
		}
		
		rotation += this.speed * delta;
		rotation = rotation % 1.0;
		if (rotation < 0) rotation += 1.0;
	}
}
