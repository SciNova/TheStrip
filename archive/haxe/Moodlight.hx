import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;

class BaseTheme {
	var game:Game;
	public var speed:Float = 1.0;

	public function new(game:Game) {
		this.game = game;
	}

	public function update(dt:Float):Void {
		render(dt);
	}

	public function render(dt:Float):Void {}
}

class RainbowTheme extends BaseTheme {
	var tm:Float = 0.0;

	public function new(game:Game) {
		super(game);
		speed = 0.5;
	}

	override public function render(dt:Float):Void {
		tm += dt * speed;
		for (i in 0...game.resolution) {
			var pos = (i / game.resolution + tm) * Math.PI * 2;
			var r = Math.round(Math.sin(pos) * 127.5 + 127.5);
			var g = Math.round(Math.sin(pos + Math.PI * 2 / 3) * 127.5 + 127.5);
			var b = Math.round(Math.sin(pos + Math.PI * 4 / 3) * 127.5 + 127.5);
			game.pixels[i] = (r << 16) | (g << 8) | b;
		}
	}
}

class OceanTheme extends BaseTheme {
	var tm:Float = 0.0;

	public function new(game:Game) {
		super(game);
		speed = 0.3;
	}

	override public function render(dt:Float):Void {
		tm += dt * speed;
		for (i in 0...game.resolution) {
			var pos = (i / game.resolution + tm) * Math.PI * 2;
			var r = Math.round(Math.sin(pos) * 10 + 10);
			var g = Math.round(Math.sin(pos + Math.PI * 2 / 3) * 50 + 50);
			var b = Math.round(Math.sin(pos + Math.PI * 4 / 3) * 100 + 100);
			game.pixels[i] = (r << 16) | (g << 8) | b;
		}
	}
}

class FireTheme extends BaseTheme {
	var tm:Float = 0.0;

	public function new(game:Game) {
		super(game);
		speed = 0.4;
	}

	override public function render(dt:Float):Void {
		tm += dt * speed;
		for (i in 0...game.resolution) {
			var pos = (i / game.resolution + tm) * Math.PI * 2;
			var r = Math.round(Math.sin(pos) * 100 + 155);
			var g = Math.round(Math.sin(pos + Math.PI * 2 / 3) * 30 + 30);
			var b = Math.round(Math.sin(pos + Math.PI * 4 / 3) * 10 + 5);
			game.pixels[i] = (r << 16) | (g << 8) | b;
		}
	}
}

@:expose
class Moodlight extends Game {
	var themes:Array<BaseTheme>;
	var activeThemeIndex:Int = 0;
	var activeTheme:BaseTheme;
	var MAX_SPEED:Float = 2.0;
	var SPEED_STEP:Float = 0.1;

	public function new(system:System) {
		super("Moodlight", system);
		MIN_RESOLUTION = 1;
		themes = [
			new RainbowTheme(this),
			new OceanTheme(this),
			new FireTheme(this)
		];
		activeTheme = themes[0];
	}

	override public function loop():Void {
		super.loop();
		activeTheme.update(system.delta);
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (type != InputEvent.ButtonPress)
			return;

		switch (input) {
			case Input.ButtonA:
				activeTheme.speed += SPEED_STEP;
				if (Math.abs(activeTheme.speed) > MAX_SPEED)
					activeTheme.speed = (activeTheme.speed > 0) ? MAX_SPEED : -MAX_SPEED;
			case Input.ButtonB:
				activeThemeIndex = (activeThemeIndex + 1) % themes.length;
				activeTheme = themes[activeThemeIndex];
			case Input.ButtonC:
				activeTheme.speed -= SPEED_STEP;
				if (Math.abs(activeTheme.speed) > MAX_SPEED)
					activeTheme.speed = (activeTheme.speed > 0) ? MAX_SPEED : -MAX_SPEED;
			default:
		}
	}

	static public function main() {}
}
