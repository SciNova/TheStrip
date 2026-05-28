import _Game.Game;
import _Game.BasePlayer;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;

class Player extends BasePlayer {
	public var height:Float;
	public var speed:Float;
	public var isJumping:Bool;

	private static final GRAVITY:Float = 4.0;
	private static final JUMP_SPEED:Float = 2.828;

	public function new(game:Game) {
		super(game);
		this.height = 0.0;
		this.speed = 0.0;
		this.isJumping = false;
	}

	public function jump():Void {
		if (!isJumping) {
			isJumping = true;
			speed = JUMP_SPEED;
		}
	}

	public function update():Void {
		var dt = game.delta;
		if (isJumping) {
			speed -= GRAVITY * dt;
			height += speed * dt;

			if (height <= 0) {
				height = 0;
				speed = 0;
				isJumping = false;
			}
		}
	}

	public function render():Array<Null<Int>> {
		var LOW_SIZE:Int = 3;
		var HIGH_SIZE:Int = 15;

		var size:Int = LOW_SIZE + Math.floor(height * (HIGH_SIZE - LOW_SIZE));
		if (size % 2 == 0) size += 1;

		var baseR = (Colors.Green >> 16) & 0xFF;
		var baseG = (Colors.Green >> 8) & 0xFF;
		var baseB = Colors.Green & 0xFF;
		var lowR = (0x009900 >> 16) & 0xFF;
		var lowG = (0x009900 >> 8) & 0xFF;
		var lowB = 0x009900 & 0xFF;

		var r = Math.floor(lowR + (baseR - lowR) * height);
		var g = Math.floor(lowG + (baseG - lowG) * height);
		var b = Math.floor(lowB + (baseB - lowB) * height);

		var result:Array<Null<Int>> = [];
		var packed = (r << 16) | (g << 8) | b;
		for (i in 0...size)
			result.push(packed);

		return result;
	}
}

class Obstacle {
	public var height:Float;

	public function new(height:Float) {
		this.height = height;
	}

	public function render():Array<Null<Int>> {
		var LOW_SIZE:Int = 1;
		var HIGH_SIZE:Int = 15;

		var size:Int = LOW_SIZE + Math.floor(height * (HIGH_SIZE - LOW_SIZE));
		if (size % 2 == 0) size += 1;

		var baseR = (0xcccccc >> 16) & 0xFF;
		var baseG = (0xcccccc >> 8) & 0xFF;
		var baseB = 0xcccccc & 0xFF;
		var lowR = (0x999999 >> 16) & 0xFF;
		var lowG = (0x999999 >> 8) & 0xFF;
		var lowB = 0x999999 & 0xFF;

		var r = Math.floor(lowR + (baseR - lowR) * height);
		var g = Math.floor(lowG + (baseG - lowG) * height);
		var b = Math.floor(lowB + (baseB - lowB) * height);

		var result:Array<Null<Int>> = [];
		var packed = (r << 16) | (g << 8) | b;
		for (i in 0...size)
			result.push(packed);

		return result;
	}
}

@:expose
class Dino extends Game {
	var player:Player;
	var obstacles:Array<Null<Obstacle>>;
	var gap:Int;
	var positionRemainder:Float;

	private static final MIN_GAP:Int = 50;
	private static final MAX_GAP:Int = 70;
	private static final MIN_HEIGHT:Float = 0.1;
	private static final MAX_HEIGHT:Float = 0.5;
	private static final SPEED:Float = 30.0;

	public function new(system:System) {
		super("Dino", system);
		player = new Player(this);
		obstacles = [for (i in 0...resolution) null];
		gap = MIN_GAP;
		positionRemainder = 0.0;
	}

	override public function loop():Void {
		super.loop();

		player.update();   // clean, no dt

		positionRemainder += SPEED * delta;   // using Game.delta shortcut
		var steps = Math.floor(positionRemainder);
		positionRemainder -= steps;

		for (i in 0...steps) {
			obstacles.shift();

			gap--;
			if (gap <= 0) {
				var height = MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT);
				obstacles.push(new Obstacle(height));
				gap = MIN_GAP + Math.floor(Math.random() * (MAX_GAP - MIN_GAP));
			} else {
				obstacles.push(null);
			}
		}

		for (i in 0...resolution)
			pixels[i] = Colors.Black;

		for (i in 0...obstacles.length) {
			var obstacle = obstacles[i];
			if (obstacle != null) {
				var obstaclePixels = obstacle.render();
				var offset = Math.floor(obstaclePixels.length / 2);

				for (j in 0...obstaclePixels.length) {
					var stripPos = i - offset + j;
					if (stripPos >= 0 && stripPos < resolution)
						pixels[stripPos] = obstaclePixels[j];
				}

				var center = Math.floor(resolution / 2);
				var shadowLength = Math.floor(Math.abs(i - center) * obstaclePixels.length / (1 * center));
				if (shadowLength > 0) {
					var shadowColor = 0x333333;
					if (i < center) {
						var shadowStart = i + offset + 1;
						for (k in 0...shadowLength) {
							var shadowPos = shadowStart + k;
							if (shadowPos >= 0 && shadowPos < resolution)
								pixels[shadowPos] = shadowColor;
						}
					} else {
						var shadowStart = i - offset - shadowLength;
						for (k in 0...shadowLength) {
							var shadowPos = shadowStart + k;
							if (shadowPos >= 0 && shadowPos < resolution)
								pixels[shadowPos] = shadowColor;
						}
					}
				}
			}
		}

		var playerPixels = player.render();
		var offset = Math.floor(playerPixels.length / 2);
		var centerPos = Math.floor(resolution * 0.3);

		for (i in 0...playerPixels.length) {
			var stripPos = centerPos - offset + i;
			if (stripPos >= 0 && stripPos < resolution)
				pixels[stripPos] = playerPixels[i];
		}
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (type != InputEvent.ButtonPress)
			return;

		if (input == Input.ButtonA)
			player.jump();
	}

	static public function main() {}
}
