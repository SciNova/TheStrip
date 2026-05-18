import App;

class BaseTheme {
	var app:App;
	var timestamp:Float;
	var delta:Float;
	public var speed:Float = 1.0;

	public function new(app:App) {
		this.app = app;
		this.timestamp = app.time;
		this.delta = 0;
	}

	public function update():Void {
		var now = app.time;
		delta = now - timestamp;
		timestamp = now;
		render();
	}

	public function render():Void {
	}
}

class RainbowTheme extends BaseTheme {
	var tm:Float = 0.0;

	public function new(app:App) {
		super(app);
		speed = 0.5;
	}

	override public function render():Void {
		tm += delta * speed;
		for (i in 0...app.resolution) {
			var pos = (i / app.resolution + tm) * Math.PI * 2;
			var r = Math.sin(pos) * 127.5 + 127.5;
			var g = Math.sin(pos + Math.PI * 2 / 3) * 127.5 + 127.5;
			var b = Math.sin(pos + Math.PI * 4 / 3) * 127.5 + 127.5;
			app.pixels[i] = [
				Math.round(r),
				Math.round(g), 
				Math.round(b)
			];
		}
	}
}

class OceanTheme extends BaseTheme {
	var tm:Float = 0.0;

	public function new(app:App) {
		super(app);
		speed = 0.3;
	}

	override public function render():Void {
		tm += delta * speed;
		for (i in 0...app.resolution) {
			var pos = (i / app.resolution + tm) * Math.PI * 2;
			var r = Math.sin(pos) * 10 + 10;
			var g = Math.sin(pos + Math.PI * 2 / 3) * 50 + 50;
			var b = Math.sin(pos + Math.PI * 4 / 3) * 100 + 100;
			app.pixels[i] = [
				Math.round(r),
				Math.round(g), 
				Math.round(b)
			];
		}
	}
}

class FireTheme extends BaseTheme {
	var tm:Float = 0.0;

	public function new(app:App) {
		super(app);
		speed = 0.4;
	}

	override public function render():Void {
		tm += delta * speed;
		for (i in 0...app.resolution) {
			var pos = (i / app.resolution + tm) * Math.PI * 2;
			var r = Math.sin(pos) * 100 + 155;
			var g = Math.sin(pos + Math.PI * 2 / 3) * 30 + 30;
			var b = Math.sin(pos + Math.PI * 4 / 3) * 10 + 5;
			app.pixels[i] = [
				Math.round(r),
				Math.round(g), 
				Math.round(b)
			];
		}
	}
}

@:expose
class Moodlight extends App {
	var themes:Array<BaseTheme>;
	var activeThemeIndex:Int = 0;
	var activeTheme:BaseTheme;
	var MAX_SPEED:Float = 2.0;
	var SPEED_STEP:Float = 0.1;

	public function new(sound:Dynamic, resolution:Int) {
		super(sound, resolution);
		themes = [
			new RainbowTheme(this),
			new OceanTheme(this),
			new FireTheme(this)
		];
		activeTheme = themes[0];
	}

	override public function loop():Void {
		super.loop();
		activeTheme.update();
	}

	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				activeTheme.speed += SPEED_STEP;
				if (Math.abs(activeTheme.speed) > MAX_SPEED)
					activeTheme.speed = (activeTheme.speed > 0) ? MAX_SPEED : -MAX_SPEED;
			case 1:
				activeThemeIndex = (activeThemeIndex + 1) % themes.length;
				activeTheme = themes[activeThemeIndex];
			case 2:
				activeTheme.speed -= SPEED_STEP;
				if (Math.abs(activeTheme.speed) > MAX_SPEED)
					activeTheme.speed = (activeTheme.speed > 0) ? MAX_SPEED : -MAX_SPEED;
		}
	}

	override public function buttonRelease(buttonIndex:Int):Void {
	}

	override public function buttonReleaseHold(buttonIndex:Int):Void {
	}

	override public function buttonHold(buttonIndex:Int):Void {
	}

	static public function main() {
	}
}
