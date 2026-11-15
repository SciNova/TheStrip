import _System.System;
import _Audio.Audio;
import _Input.Input;
import _Input.InputEvent;
import _LedDisplay.LedDisplay;

class Colors {
	public static inline var Off:Int = 0x000000;
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
	public static inline var Banana:Int = 0xFFCC00;
	public static inline var Lemon:Int = 0xCCFF00;
	public static inline var Watermelon:Int = 0x007F00;
	public static inline var Blackberry:Int = 0x44007F;
	public static inline var Strawberry:Int = 0xFF3366;
	public static inline var Gray:Int = 0x808080;
	public static inline var LightGray:Int = 0xC0C0C0;
	public static inline var DarkGray:Int = 0x404040;

	public static function correctLuminance(color:Int):Int {
		var r = (color >> 16) & 0xFF;
		var g = (color >> 8) & 0xFF;
		var b = color & 0xFF;
		return (Std.int(r * 0.38) << 16) | (Std.int(g * 0.28) << 8) | b;
	}
}


class Camera {
	public var x:Float;
	public var z:Float;
	public var rotation:Float;

	public function new(x:Float = 0, z:Float = 0, rotation:Float = 0) {
		this.x = x;
		this.z = z;
		this.rotation = rotation;
	}
}

class BasePlayer {
	public var game:Game;

	public function new(game:Game) {
		this.game = game;
	}
}

class BasePlayer1D extends BasePlayer {
	public var location:Float = 0;

	public function distance(location:Float):Float {
		var w:World = cast game.world;
		var d = this.location - location;
		if (w.wraps) {
			var half = w.size * game.resolution / 2;
			d = ((d + half) % (half * 2) + (half * 2)) % (half * 2) - half;
		}
		return Math.abs(d);
	}
}

class BasePlayer2D extends BasePlayer {
	public var z:Float = 0;
	public var x:Float = 0;
	public var rotation:Float = 0;

	public function distance(z:Float, x:Float):Float {
		var world:World2D = cast game.world;
		var dx = this.x - x;
		var dz = this.z - z;
		if (world.wrapsZ) {
			var halfZ = world.width * game.resolution / 2;
			dz = ((dz + halfZ) % (halfZ * 2) + (halfZ * 2)) % (halfZ * 2) - halfZ;
		}
		if (world.wrapsX) {
			var halfX = world.depth * game.resolution / 2;
			dx = ((dx + halfX) % (halfX * 2) + (halfX * 2)) % (halfX * 2) - halfX;
		}
		return Math.sqrt(dx * dx + dz * dz);
	}

	public function direction(z:Float, x:Float):Float {
		var dx = x - this.x;
		var dz = z - this.z;
		var angle = Math.atan2(dz, dx);
		return (angle / (2 * Math.PI) + 1) % 1;
	}
}

class BaseWorld {
	public function new() {}
}

class World extends BaseWorld {
	public var size:Float;
	public var wraps:Bool;

	public function new(size:Float, wraps:Bool) {
		super();
		this.size = size;
		this.wraps = wraps;
	}
}

class World2D extends BaseWorld {
	public var width:Float;
	public var depth:Float;
	public var wrapsX:Bool;
	public var wrapsZ:Bool;

	public function new(width:Float, depth:Float, wrapsX:Bool, wrapsZ:Bool) {
		super();
		this.width = width;
		this.depth = depth;
		this.wrapsX = wrapsX;
		this.wrapsZ = wrapsZ;
	}
}


@:expose("GameState")
enum GameState {
	PLAY;
	PAUSED;
	COMPLETE;
}

class Game {
	public var MIN_RESOLUTION:Int = 120;

	public var resolution(default, null):Int;

	public var pixels(get, null):Array<Int>;

	public var name:String;
	public var audio:Audio;
	public var time:Float;
	public var levelTime:Float;
	public var level:Int;
	public var state:GameState = PLAY;

	public var world:Null<BaseWorld> = null;

	private var system:System;
	private var pendingHandler:Void->Void;
	private var handlerTime:Float;


	public var delta(get, null):Float;

	function get_delta():Float {
		return system.delta;
	}




	public function new(name:String, system:System) {
		this.name = name;
		this.system = system;
		this.resolution = system.leds.length;
		this.audio = system.audio;

		pendingHandler = null;
		handlerTime = 0;
		time = 0;
		levelTime = 0;
		level = 0;
	}

	function get_pixels():Array<Int> {
		return system.leds.pixels;
	}

	public function pause():Void {
		state = PAUSED;
	}

	public function play():Void {
		state = PLAY;
	}

	public function togglePause():Void {
		if (state == PLAY)
			pause();
		else
			play();
	}

	public function loop():Void {
		if (state == PLAY)
			time += system.delta;

		if (pendingHandler != null && system.uptime >= handlerTime) {
			var handler = pendingHandler;
			pendingHandler = null;
			handler();
		}

		if (state == PLAY && system.delta > 0)
			levelTime += system.delta;
	}

	public function defer(handler:Void->Void, seconds:Float = 0):Void {
		pendingHandler = handler;
		handlerTime = system.uptime + seconds;
	}

	public function clear():Void {
		system.leds.clear();
	}

	public function setLevel(n:Int):Void {
		level = n;
	}

	public function nextLevel():Void {
		level++;
	}

	public function playLevel():Void {
		buildStage();
		levelTime = 0;
		play();
	}

	public function buildStage():Void {}

	public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {}
}
