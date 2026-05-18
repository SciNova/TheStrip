import App;

class Dot {
	public var color:Int;
	public var gap:Int;

	public function new(color:Int, gap:Int) {
		this.color = color;
		this.gap = gap;
	}
}

class Bullet {
	public var game:Stack;
	public var color:Int;
	public var timestamp:Float;

	public function new(game:Stack, color:Int) {
		this.game = game;
		this.color = color;
		this.timestamp = game.levelTime;
	}

	public function position(t:Float, speed:Float):Int {
		var pixels:Float = (t - timestamp) * speed;
		return Math.floor(pixels);
	}
}

class Snake {
	private var START_DOTS:Int;
	private var END_DOTS:Int;
	private var START_GAP:Int;
	private var END_GAP:Int;
	public static var LEVELS:Int;

	public var dots:Array<Dot>;
	public var position:Int;
	private var game:Game;

	public function new(game:Game) {
		this.game = game;
		START_DOTS = Math.floor(game.resolution / 20.0);
		END_DOTS = Math.floor(game.resolution / 4.0);
		START_GAP = Math.floor(game.resolution / 40.0);
		END_GAP = Math.floor(game.resolution / 40.0);
		LEVELS = END_DOTS - START_DOTS;

		dots = [];
		position = 0;
	}

	public function build(level:Int):Void {
		var numDots = START_DOTS + level;
		var gapFloat = START_GAP + (END_GAP - START_GAP) * (level / LEVELS);
		var lowGap = Math.floor(gapFloat);
		var highGap = Math.ceil(gapFloat);
		var prevColor = Colors.None;
	
		dots = [];
	
		for (i in 0...numDots) {
			var color:Int;
			do {
				var r = Math.floor(Math.random() * 3);
				color = switch(r) {
					case 0: Colors.Red;
					case 1: Colors.Green;
					case 2: Colors.Blue;
					default: Colors.None;
				}
			} while (color == prevColor);

			var gap = (Math.random() < (gapFloat - lowGap)) ? highGap : lowGap;
			dots.push(new Dot(color, gap));
			prevColor = color;
		}
		
		position = game.resolution;
	}

	public function length():Int {
		var total = 0;
		for (dot in dots) {
			total += 1 + dot.gap;
		}
		return total;
	}

	public function isAtStart():Bool {
		return position == game.resolution - length();
	}

	public function isAtEnd():Bool {
		return position <= 0;
	}
}

@:expose
class Stack extends Game {
	static inline var START_SPEED = 8.0;
	static inline var END_SPEED = 12.0;
	static inline var BULLET_SPEED = 60;

	var snake:Snake;
	var bullets:Array<Bullet>;
	var snakePositionRemainder:Float;
	private var lastGameTime:Float;

	public function new(sound:Dynamic, resolution:Int) {
		log("Stack");
		super(sound, resolution);
		snake = new Snake(this);
		bullets = [];
		snakePositionRemainder = 0;
		lastGameTime = time;
		startNextLevel();
	}

	static public function main() {}

	override public function buildStage():Void {
		snake.build(this.level);
		snakePositionRemainder = 0;
		bullets = [];
		lastGameTime = time;
	}

	override public function loop() {
		super.loop();

		if (pendingHandler != null)
			return;

		for (i in 0...resolution)
			pixels[i] = [0, 0, 0];

		var deltaTime = (time - lastGameTime) * 1000;
		lastGameTime = time;

		var currentSpeed = START_SPEED + (END_SPEED - START_SPEED) * (level / Snake.LEVELS);
		var pixelsToMove = (currentSpeed * deltaTime) / 1000;
		snakePositionRemainder += pixelsToMove;
		var wholePixels = Math.floor(snakePositionRemainder);

		if (wholePixels > 0) {
			snake.position -= wholePixels;
			snakePositionRemainder -= wholePixels;
			var currentPos = snake.position;
			for (i in 0...snake.dots.length) {
				currentPos += 1 + snake.dots[i].gap;
				if (currentPos == resolution - 1) {
					sound.play('stackGenerateDot');
					break;
				}
			}
		}

		if (snake.isAtEnd()) {
			sound.play('stackLevelFail');
			pause();
			bullets = [];
			defer(startLevel, 4);
		}

		bullets = bullets.filter(function(bullet) {
			return bullet.position(levelTime, BULLET_SPEED) < resolution;
		});

		if (bullets.length > 0 && snake.dots.length > 0) {
			var bullet = bullets[0];
			var bulletPos = bullet.position(levelTime, BULLET_SPEED);
			var headPos = snake.position;
			if (bulletPos >= headPos) {
				if (bullet.color == snake.dots[0].color) {
					if (snake.dots.length > 1) {
						var removedGap = snake.dots[0].gap;
						snake.position += 1 + removedGap;
					}
					snake.dots.shift();
					bullets.shift();
					sound.play('stackHit');
				} else {
					bullets.shift();
					var newDot = new Dot(bullet.color, 0);
					snake.dots.unshift(newDot);
					snake.position -= 1;
					sound.play('stackMiss');
				}
			}
		}

		var currentPixel = snake.position;
		for (i in 0...snake.dots.length) {
			var dot = snake.dots[i];
			if (currentPixel >= 0 && currentPixel < resolution) {
				pixels[currentPixel] = rgb(dot.color);
			}
			currentPixel += 1;
			for (g in 0...dot.gap) {
				if (currentPixel >= 0 && currentPixel < resolution) {
					pixels[currentPixel] = [0, 0, 0];
				}
				currentPixel += 1;
			}
		}

		for (bullet in bullets) {
			var pos = bullet.position(levelTime, BULLET_SPEED);
			if (pos >= 0 && pos < resolution) {
				pixels[pos] = rgb(bullet.color);
			}
		}

		if (snake.dots.length == 0) {
			if (level >= Snake.LEVELS) {
				sound.play('stackGameComplete');
				level = 1;
				defer(startLevel, 30);
			} else {
				sound.play('stackLevelComplete');
				defer(startNextLevel, 4);
			}
		}
	}

	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				bullets.push(new Bullet(this, Colors.Red));
				sound.play('stackShoot');
			case 1:
				bullets.push(new Bullet(this, Colors.Green));
				sound.play('stackShoot');
			case 2:
				bullets.push(new Bullet(this, Colors.Blue));   // Updated
				sound.play('stackShoot');
		}
	}
}
