import App;

enum RaceState {
	PLAYING;
	RESULT;
}

class Player extends NewDisplayObject {
	public var location:Float;
	public var speed:Float;
	public var reverse:Bool;
	public var travel:Float;
	public var color:Int;
	
	public static inline var BOOST:Float = 60;
	public static inline var FRICTION:Float = 3.75;
	public static inline var MAX_SPEED:Float = 180;
	public static inline var TRAIL_LENGTH:Int = 20;

	private var time:Float;

	public function new(app:App, color:Int) {
		super(app, TRAIL_LENGTH, BACKWARD);
		this.app = app;
		this.color = color;
		time = app.time;
		location = app.resolution / 2;
		speed = 0;
		reverse = false;
		travel = 0;
	}


override public function update():Void {
	var delta:Float = app.time - time;
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

	if (Math.floor(prevTravel / 10) != Math.floor(travel / 10)) {
		app.audio.play(SoundEvent.TICK);
	}

if (Math.floor(prevTravel / 240) != Math.floor(travel / 240)) {
    app.audio.play(SoundEvent.CHECKPOINT);
}

	this.alignment = reverse ? FORWARD : BACKWARD;

	var trailPixels:Int = 1 + Math.floor((speed / MAX_SPEED) * (TRAIL_LENGTH - 1));
	for (j in 0...TRAIL_LENGTH) {
		if (j < trailPixels) {
			var intensity:Int;
			if (trailPixels == 1) {
				intensity = 255;
			} else {
				intensity = 255 - Math.floor(128 * j / (trailPixels - 1));
			}
			var baseRgb = rgb(color);
			pixels[j] = [
				Math.floor(baseRgb[0] * intensity / 255),
				Math.floor(baseRgb[1] * intensity / 255),
				Math.floor(baseRgb[2] * intensity / 255)
			];
		} else {
			pixels[j] = [0, 0, 0];
		}
	}
}





	public function boost():Void {
		speed += BOOST;
		if (speed > MAX_SPEED) speed = MAX_SPEED;
	}
}

@:expose
class Race extends Game {
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
		var barColor = [60, 60, 0];

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
		var corrected = correctLuminance(rgb(playerA.color));
		for (i in 0...half) {
			pixels[i] = corrected;
		}
	} else if (bWon && !aWon) {
		var corrected = correctLuminance(rgb(playerB.color));
		for (i in half...resolution) {
			pixels[i] = corrected;
		}
	} else {
		var correctedA = correctLuminance(rgb(playerA.color));
		var correctedB = correctLuminance(rgb(playerB.color));
		for (i in 0...half) {
			pixels[i] = correctedA;
		}
		for (i in half...resolution) {
			pixels[i] = correctedB;
		}
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