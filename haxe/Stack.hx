import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Audio.Sound;
import _Graphics.Shape;
import _Graphics.Alignment;

class Dot extends Shape {
	public var color:Int;
	public var gap:Int;
	public var alpha:Float;
	public var explosionTime:Float;

	static inline var EXPLOSION_DIAMETER = 21;
	static inline var EXPLOSION_DURATION = 0.5;
	var cosAngles:Array<Float>;

	public function new(game:Game, color:Int, gap:Int) {
		super(game, EXPLOSION_DIAMETER, Alignment.CENTER);
		this.color = color;
		this.gap = gap;
		alpha = 1.0;
		explosionTime = 0.0;
		cosAngles = [];
		for (deg in 0...10) {
			var rad = deg * 18.0 * Math.PI / 180.0;
			cosAngles.push(Math.cos(rad));
		}
	}

	public function explode():Void {
		explosionTime = game.levelTime;
	}

	override public function update():Void {
		for (i in 0...pixels.length)
			pixels[i] = null;

		if (explosionTime == 0.0) {
			var center = Std.int((pixels.length - 1) / 2);
			pixels[center] = color;
		} else {
			var elapsed = game.levelTime - explosionTime;
			var t = elapsed / EXPLOSION_DURATION;
			if (t >= 1.0) {
				alpha = 0.0;
				return;
			}
			alpha = 1.0 - t;
			var maxRadius = (EXPLOSION_DIAMETER - 1) / 2;
			var radius = maxRadius * (1.0 - (1.0 - t) * (1.0 - t));
			var center = Std.int((pixels.length - 1) / 2);
			var r = (color >> 16) & 0xFF;
			var g = (color >> 8) & 0xFF;
			var b = color & 0xFF;
			for (cosVal in cosAngles) {
				var offset = Std.int(radius * cosVal + 0.5);
				var idx = center + offset;
				if (idx >= 0 && idx < pixels.length) {
					pixels[idx] = (Std.int(r * alpha) << 16) | (Std.int(g * alpha) << 8) | Std.int(b * alpha);
				}
			}
		}
	}
}

class Bullet extends Shape {
	public var color:Int;
	public var timestamp:Float;
	public var position:Float;

	public function new(game:Stack, color:Int) {
		super(game, 20, Alignment.BACKWARD);
		this.color = color;
		this.timestamp = game.levelTime;
		this.position = 0.0;
	}

	override public function update():Void {
		for (i in 0...pixels.length)
			pixels[i] = null;

		position = (game.levelTime - timestamp) * Stack.BULLET_SPEED;
		var r = (color >> 16) & 0xFF;
		var g = (color >> 8) & 0xFF;
		var b = color & 0xFF;

		for (i in 0...20) {
			var t = (i + 1) / 21.0;
			pixels[i] = (Std.int(r * t) << 16) | (Std.int(g * t) << 8) | Std.int(b * t);

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
		var prevColor:Null<Int> = null;

		dots = [];

		for (i in 0...numDots) {
			var color:Int;
			do {
				var r = Math.floor(Math.random() * 3);
				color = switch(r) {
					case 0: Colors.Red;
					case 1: Colors.Green;
					case 2: Colors.Blue;
					default: null;
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
		for (dot in dots)
			total += 1 + dot.gap;
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

	public function new(system:System) {
		super("Stack", system);
		snake = new Snake(this);
		bullets = [];
		snakePositionRemainder = 0;
		playLevel();
	}

	static public function main() {}

	override public function buildStage():Void {
		snake.build(level);
		snakePositionRemainder = 0;
		bullets = [];
	}

	function render():Void {
		for (i in 0...resolution)
			pixels[i] = 0;

		var currentPixel = snake.position;
		for (dot in snake.dots) {
			dot.render(currentPixel);
			if (dot.explosionTime == 0.0)
				currentPixel += 1 + dot.gap;
		}

		for (bullet in bullets)
			bullet.render(bullet.position);
	}

	override public function loop() {
		super.loop();

		if (pendingHandler != null)
			return;

		var dt = system.delta;

		var currentSpeed = START_SPEED + (END_SPEED - START_SPEED) * (level / Snake.LEVELS);
		var pixelsToMove = currentSpeed * dt;
		snakePositionRemainder += pixelsToMove;
		var wholePixels = Math.floor(snakePositionRemainder);

		if (wholePixels > 0) {
			snake.position -= wholePixels;
			snakePositionRemainder -= wholePixels;
			var currentPos = snake.position;
			for (i in 0...snake.dots.length) {
				currentPos += 1 + snake.dots[i].gap;
				if (currentPos == resolution - 1) {
					audio.play(Sound.GENERATE_ITEM);
					break;
				}
			}
		}

		if (snake.isAtEnd()) {
			audio.play(Sound.LEVEL_FAIL);
			pause();
			bullets = [];
			defer(playLevel, 4);
			return;
		}

		for (bullet in bullets)
			bullet.update();
		for (dot in snake.dots)
			dot.update();

		snake.dots = snake.dots.filter(function(dot) {
			return dot.alpha != 0.0;
		});

		bullets = bullets.filter(function(bullet) {
			return bullet.position < resolution;
		});

		var headDot:Null<Dot> = null;
		for (dot in snake.dots) {
			if (dot.explosionTime == 0.0) {
				headDot = dot;
				break;
			}
		}

		if (bullets.length > 0 && headDot != null) {
			var bullet = bullets[0];
			if (bullet.position >= snake.position) {
				if (bullet.color == headDot.color) {
					headDot.explode();
					snake.position += 1 + headDot.gap;
					bullets.shift();
					audio.play(Sound.HIT);
				} else {
					bullets.shift();
					var newDot = new Dot(this, bullet.color, 0);
					snake.dots.unshift(newDot);
					snake.position -= 1;
					audio.play(Sound.MISS);
				}
			}
		}

		if (snake.dots.length == 0) {
			if (level >= Snake.LEVELS) {
				audio.play(Sound.GAME_COMPLETE);
				setLevel(0);
				defer(playLevel, 30);
			} else {
				audio.play(Sound.LEVEL_COMPLETE);
				nextLevel();
				defer(playLevel, 4);
			}
			return;
		}

		render();
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (type != InputEvent.ButtonPress)
			return;

		switch (input) {
			case Input.ButtonA:
				bullets.push(new Bullet(this, Colors.Red));
				audio.play(Sound.SHOOT);
			case Input.ButtonB:
				bullets.push(new Bullet(this, Colors.Green));
				audio.play(Sound.SHOOT);
			case Input.ButtonC:
				bullets.push(new Bullet(this, Colors.Blue));
				audio.play(Sound.SHOOT);
			default:
		}
	}
}
