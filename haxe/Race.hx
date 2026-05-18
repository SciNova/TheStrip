import App;

class Player {
	public var position:Float;
	public var speed:Float;
	public var reverse:Bool;
	public var laps:Int;
	public var app:App;
	private var time:Float;
	
	public static inline var BOOST:Float = 60;
	public static inline var FRICTION:Float = 3.75;
	public static inline var MAX_SPEED:Float = 180;

	public function new(app:App) {
		this.app = app;
		time = app.time;
		position = 0;
		speed = 0;
		reverse = false;
		laps = 0;
	}

	public function update() {
		var delta:Float = app.time - time;
		time = app.time;
		speed = speed * (1 - FRICTION * delta);
		position += speed * (reverse ? -1 : 1) * delta;
		if (position < 0) {
			position = -position;
			reverse = !reverse;
			laps++;
		} else if (position > app.resolution - 1) {
			position = 2 * (app.resolution - 1) - position;
			reverse = !reverse;
		}
	}

	public function boost() {
		speed += BOOST;
		if (speed > MAX_SPEED) speed = MAX_SPEED;
	}
}

@:expose
class Race extends Game {
	var playerA:Player;
	var playerB:Player;
	static inline var TRAIL_LENGTH:Int = 20;

	public function new(sound:Dynamic, resolution:Int) {
		super(sound, resolution);
		playerA = new Player(this);
		playerB = new Player(this);
	}

	override public function loop():Void {
		super.loop();
		playerA.update();
		playerB.update();
		
		for (i in 0...resolution) pixels[i] = [0, 0, 0];
		
		drawTrail(playerA, Colors.Green);
		drawTrail(playerB, Colors.Blue);
	}

	function drawTrail(player:Player, color:Int):Void {
		var headPos:Int = Math.round(player.position);
		var trailPixels:Int = 1 + Math.floor((player.speed / Player.MAX_SPEED) * (TRAIL_LENGTH - 1));
		
		for (j in 0...trailPixels) {
			var offset:Int = trailPixels - 1 - j;
			var pos:Int = headPos;
			var remaining:Int = offset;
			
			if (player.reverse) {
				pos += remaining;
				if (pos > resolution - 1) {
					var overshoot:Int = pos - (resolution - 1);
					pos = (resolution - 1) - overshoot;
				}
			} else {
				pos -= remaining;
				if (pos < 0) {
					pos = -pos;
				}
			}
			
			var intensity:Int = 127 + Math.floor(128 * j / (trailPixels - 1));
			var baseRgb = rgb(color);
			pixels[pos] = [
				Math.floor(baseRgb[0] * intensity / 255),
				Math.floor(baseRgb[1] * intensity / 255),
				Math.floor(baseRgb[2] * intensity / 255)
			];
		}
	}

	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0: playerA.boost();
			case 1:
			case 2: playerB.boost();
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
