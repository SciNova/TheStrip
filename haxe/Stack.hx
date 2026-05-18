import App;

class Dot extends DisplayObject {
	public var color:Int;
	public var gap:Int;
	public var alpha:Float;
	public var explosionTime:Float;

	static inline var EXPLOSION_DIAMETER = 21;
	static inline var EXPLOSION_DURATION = 0.5; // seconds
	var cosAngles:Array<Float>;

	public function new(app:App, color:Int, gap:Int) {
		super(app, EXPLOSION_DIAMETER, Alignment.CENTER);
		this.color = color;
		this.gap = gap;
		alpha = 1.0;
		explosionTime = 0.0;
		// Precompute cosines for upper half‑circle (10 angles, 0° to 162° step 18°)
		cosAngles = [];
		for (deg in 0...10) {
			var rad = deg * 18.0 * Math.PI / 180.0;
			cosAngles.push(Math.cos(rad));
		}
	}

	public function explode():Void {
		explosionTime = app.levelTime;   // start of explosion, alpha remains 1.0
	}

	override public function update():Void {
		// Clear local pixel buffer each frame
		for (i in 0...pixels.length)
			pixels[i] = [0, 0, 0];

		if (explosionTime == 0.0) {
			// Alive dot – single pixel at center
			var center = Std.int((pixels.length - 1) / 2);
			pixels[center] = rgb(color);
		} else {
			// Exploding (or dead if alpha == 0)
			var elapsed = app.levelTime - explosionTime;
			var t = elapsed / EXPLOSION_DURATION;
			if (t >= 1.0) {
				alpha = 0.0;          // animation finished, mark for removal
				return;               // nothing to draw
			}
			alpha = 1.0 - t;          // fade out
			var maxRadius = (EXPLOSION_DIAMETER - 1) / 2;
			var radius = maxRadius * (1.0 - (1.0 - t) * (1.0 - t)); // fast expansion then deceleration
			var center = Std.int((pixels.length - 1) / 2);
			var r = (color >> 16) & 0xFF;
			var g = (color >> 8) & 0xFF;
			var b = color & 0xFF;
			for (cosVal in cosAngles) {
				var offset = Std.int(radius * cosVal + 0.5);
				var idx = center + offset;
				if (idx >= 0 && idx < pixels.length) {
					pixels[idx] = [
						Std.int(r * alpha),
						Std.int(g * alpha),
						Std.int(b * alpha)
					];
				}
			}
		}
	}
}

class Bullet extends DisplayObject {
	public var game:Stack;
	public var color:Int;
	public var timestamp:Float;

	public function new(game:Stack, color:Int) {
		super(game, 20, Alignment.BACKWARD);
		this.game = game;
		this.color = color;
		this.timestamp = game.levelTime;
	}

	override public function update():Void {
		// Compute head position from time and constant speed
		position = (game.levelTime - timestamp) * Stack.BULLET_SPEED;

		// Extract RGB components from packed integer color
		var r = (color >> 16) & 0xFF;
		var g = (color >> 8) & 0xFF;
		var b = color & 0xFF;

		// Fill trail: 20 pixels with a smooth gradient to just above black
		for (i in 0...20) {
			var t = (i + 1) / 21.0;
			pixels[i] = [
				Std.int(r * (1 - t)),
				Std.int(g * (1 - t)),
				Std.int(b * (1 - t))
			];
		}
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
			dots.push(new Dot(this.game, color, gap));
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
	public static inline var BULLET_SPEED = 60;

	var snake:Snake;
	var bullets:Array<Bullet>;
	var snakePositionRemainder:Float;
	private var lastGameTime:Float;

	public function new(audio:Audio, resolution:Int) {
		log("Stack");
		super("Stack", resolution, audio);
		snake = new Snake(this);
		bullets = [];
		snakePositionRemainder = 0;
		lastGameTime = time;
		playLevel();
	}

	static public function main() {}

	override public function buildStage():Void {
		snake.build(this.level);
		snakePositionRemainder = 0;
		bullets = [];
		lastGameTime = time;
	}

	function render():Void {
		// Clear the main canvas
		for (i in 0...resolution)
			pixels[i] = [0, 0, 0];

		// Draw dots: alive ones form a chain starting from snake.position,
		// exploding dots stay frozen at their last alive position.
		var currentPixel = snake.position;
		for (dot in snake.dots) {
			if (dot.explosionTime == 0.0) {
				// Alive dot – place it at the current chain position
				dot.position = currentPixel;
				dot.render();
				currentPixel += 1 + dot.gap;
			} else {
				// Exploding or dead – frozen position, just draw (nothing if alpha==0)
				dot.render();
			}
		}

		// Draw bullets
		for (bullet in bullets)
			bullet.render();
	}

	override public function loop() {
		super.loop();

		if (pendingHandler != null)
			return;

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
					audio.play(SoundEvent.GENERATE_ITEM);
					break;
				}
			}
		}

		if (snake.isAtEnd()) {
			audio.play(SoundEvent.LEVEL_FAIL);
			pause();
			bullets = [];
			defer(playLevel, 4);
			return;
		}

		// Update all bullets (positions and trail pixels)
		for (bullet in bullets)
			bullet.update();

		// Update all dots (normal or explosion animation)
		for (dot in snake.dots)
			dot.update();

		// Remove dots whose explosion animation is fully finished (alpha == 0)
		snake.dots = snake.dots.filter(function(dot) {
			return dot.alpha != 0.0;
		});

		// Remove off‑screen bullets
		bullets = bullets.filter(function(bullet) {
			return bullet.position < resolution;
		});

		// Find the effective head: first dot with explosionTime == 0 (i.e. not yet triggered)
		var headDot:Null<Dot> = null;
		for (dot in snake.dots) {
			if (dot.explosionTime == 0.0) {
				headDot = dot;
				break;
			}
		}

		if (bullets.length > 0 && headDot != null) {
			var bullet = bullets[0];
			// headDot’s world position is snake.position
			if (bullet.position >= snake.position) {
				if (bullet.color == headDot.color) {
					// Correct hit – explode the head, advance snake past it
					headDot.explode();
					snake.position += 1 + headDot.gap;
					bullets.shift();
					audio.play(SoundEvent.HIT);
				} else {
					// Wrong color – add a new dot in front
					bullets.shift();
					var newDot = new Dot(this, bullet.color, 0);
					snake.dots.unshift(newDot);
					snake.position -= 1;
					audio.play(SoundEvent.MISS);
				}
			}
		}

		// Win / level complete
		if (snake.dots.length == 0) {
			if (level >= Snake.LEVELS) {
				audio.play(SoundEvent.GAME_COMPLETE);
				setLevel(0);
				defer(playLevel, 30);
			} else {
				audio.play(SoundEvent.LEVEL_COMPLETE);
				nextLevel();
				defer(playLevel, 4);
			}
			return;
		}

		render();
	}

	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				bullets.push(new Bullet(this, Colors.Red));
				audio.play(SoundEvent.SHOOT);
			case 1:
				bullets.push(new Bullet(this, Colors.Green));
				audio.play(SoundEvent.SHOOT);
			case 2:
				bullets.push(new Bullet(this, Colors.Blue));
				audio.play(SoundEvent.SHOOT);
		}
	}
}