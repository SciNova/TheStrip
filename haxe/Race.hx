import App;

enum RaceState {
	PLAYING;
	RESULT;
}

class Player extends NewDisplayObject {
	public var location:Float;
	public var speed:Float;
	public var trailSpeed:Float;
	public var reverse:Bool;
	public var travel:Float;
	public var color:Int;

	public var BOOST:Float;
	public var FRICTION:Float = 3.75;
	public var TRAIL_FRICTION:Float = 2.5;
	public var MAX_SPEED:Float;

	static var TRAIL = 1/8;
	static var TRAIL_LENGTH:Int;

	static inline var TICK = 1/12;
	static inline var CHECKPOINT = 2;

	private var time:Float;

	public function new(app:App, color:Int) {
		var len = Math.round(app.resolution * TRAIL);
		super(app, len, BACKWARD);
		this.app = app;
		this.color = color;
		time = app.time;
		location = app.resolution / 2;
		speed = 0;
		trailSpeed = 0;
		reverse = false;
		travel = 0;
		BOOST = 0.5 * app.resolution;
		MAX_SPEED = 1.5 * app.resolution;
		TRAIL_LENGTH = len;
	}

	override public function update():Void {
		var delta = app.time - time;
		time = app.time;

		var oldLocation = location;
		speed = speed * (1 - FRICTION * delta);
		location += speed * (reverse ? -1 : 1) * delta;

		if (location < 0) {
			location = -location;
			reverse = !reverse;
		} else if (location >= app.resolution) {
			location = 2 * (app.resolution - 1) - location;
			reverse = !reverse;
		}

		var prevTravel = travel;
		travel += (location > oldLocation) ? (location - oldLocation) : (oldLocation - location);

		if (Math.floor(prevTravel / (app.resolution * TICK)) != Math.floor(travel / (app.resolution * TICK))) {
			app.audio.play(SoundEvent.TICK);
		}
		if (Math.floor(prevTravel / (app.resolution * CHECKPOINT)) != Math.floor(travel / (app.resolution * CHECKPOINT))) {
			app.audio.play(SoundEvent.CHECKPOINT);
		}

		this.alignment = reverse ? FORWARD : BACKWARD;

		trailSpeed *= Math.max(0, 1 - TRAIL_FRICTION * delta);

		var frac = trailSpeed / BOOST;
		if (frac > 1) frac = 1;
		var trailPixels = 1 + Math.floor(frac * (TRAIL_LENGTH - 1));

		var baseR = (color >> 16) & 0xFF;
		var baseG = (color >> 8) & 0xFF;
		var baseB = color & 0xFF;

		for (j in 0...TRAIL_LENGTH) {
			if (j < trailPixels) {
				var intensity:Float;
				if (trailPixels == 1) {
					intensity = 1.0;
				} else {
					intensity = 1.0 - (128.0 / 255.0) * (j / (trailPixels - 1));
				}
				var r = Std.int(baseR * intensity);
				var g = Std.int(baseG * intensity);
				var b = Std.int(baseB * intensity);
				pixels[j] = (r << 16) | (g << 8) | b;
			} else {
				pixels[j] = null;
			}
		}
	}

	public function boost():Void {
		speed += BOOST;
		if (speed > MAX_SPEED) speed = MAX_SPEED;
		trailSpeed = speed;
	}
}

@:expose
class Race extends Game {
	static inline var MIN_RESOLUTION = 40;
	static inline var TOTAL_LAPS:Float = 10.0;

	var playerA:Player;
	var playerB:Player;
	var state:RaceState;

	public function new(audio:Audio, resolution:Int) {
		super("Race", resolution, audio);
		playerA = new Player(this, Colors.Red);
		playerB = new Player(this, Colors.Blue);
		state = PLAYING;
	}

	override public function loop():Void {
		super.loop();

		switch (state) {
			case PLAYING:
				playerA.update();
				playerB.update();

				var targetTravel = TOTAL_LAPS * 2 * resolution;
				var scoreA:Float = playerA.travel / targetTravel;
				var scoreB:Float = playerB.travel / targetTravel;

				if (scoreA >= 1.0 || scoreB >= 1.0) {
					state = RESULT;
					audio.play(SoundEvent.LEVEL_COMPLETE);
					defer(function() {
						playerA = new Player(this, Colors.Green);
						playerB = new Player(this, Colors.Blue);
						state = PLAYING;
					}, 4);
				}

				clear();
				drawProgressBar(scoreA, scoreB);
				playerA.render(playerA.location, MIRROR);
				playerB.render(playerB.location, MIRROR);

			case RESULT:
				clear();
				drawResultBars();
		}
	}

	function drawProgressBar(scoreA:Float, scoreB:Float):Void {
		var half = Std.int(resolution / 2);
		var barColor = 0x3C3C00;

		var lengthA = Math.round(scoreA * half);
		if (lengthA > half) lengthA = half;
		for (i in 0...lengthA) {
			pixels[i] = barColor;
		}

		var lengthB = Math.round(scoreB * half);
		if (lengthB > half) lengthB = half;
		for (i in (resolution - lengthB)...resolution) {
			pixels[i] = barColor;
		}

		var centerLeft = Std.int(resolution / 2) - 1;
		var centerRight = Std.int(resolution / 2);
		pixels[centerLeft] = barColor;
		pixels[centerRight] = barColor;
	}

	function drawResultBars():Void {
		var half = Std.int(resolution / 2);
		var targetTravel = TOTAL_LAPS * 2 * resolution;
		var aWon = playerA.travel >= targetTravel;
		var bWon = playerB.travel >= targetTravel;

		if (aWon && !bWon) {
			var col = correctLuminance(playerA.color);
			for (i in 0...half) pixels[i] = col;
		} else if (bWon && !aWon) {
			var col = correctLuminance(playerB.color);
			for (i in half...resolution) pixels[i] = col;
		} else {
			var colA = correctLuminance(playerA.color);
			var colB = correctLuminance(playerB.color);
			for (i in 0...half) pixels[i] = colA;
			for (i in half...resolution) pixels[i] = colB;
		}
	}

	override public function buttonPress(buttonIndex:Int):Void {
		if (state != PLAYING) return;
		switch (buttonIndex) {
			case 0: playerA.boost();
			case 2: playerB.boost();
		}
	}

	override public function buttonHold(buttonIndex:Int):Void {}
	override public function buttonRelease(buttonIndex:Int):Void {}
	override public function buttonReleaseHold(buttonIndex:Int):Void {}

	static public function main() {}
}
