import App;

class Player {
	public var height:Float;
	public var speed:Float;
	public var isJumping:Bool;
	public var ttimestamp:Float;

	private var app:App;

	private static final GRAVITY:Float = 4.0;
	private static final JUMP_SPEED:Float = 2.828;

	public function new(app:App) {
		this.app = app;
		this.height = 0.0;
		this.speed = 0.0;
		this.isJumping = false;
		this.ttimestamp = app.time;
	}

	public function jump():Void {
		if (!isJumping) {
			isJumping = true;
			speed = JUMP_SPEED;
		}
	}

	public function update():Void {
		var now = app.time;
		var delta = now - ttimestamp;
		ttimestamp = now;

		if (isJumping) {
			speed -= GRAVITY * delta;
			height += speed * delta;

			if (height <= 0) {
				height = 0;
				speed = 0;
				isJumping = false;
			}
		}
	}

	public function render():Array<Array<Int>> {
		var LOW_SIZE:Int = 3;
		var HIGH_SIZE:Int = 15;

		var size:Int = LOW_SIZE + Math.floor(height * (HIGH_SIZE - LOW_SIZE));
		if (size % 2 == 0) size += 1;

		var baseRgb = rgb(Colors.Green);
		var lowRgb = rgb(0x009900);

		var r = Math.floor(lowRgb[0] + (baseRgb[0] - lowRgb[0]) * height);
		var g = Math.floor(lowRgb[1] + (baseRgb[1] - lowRgb[1]) * height);
		var b = Math.floor(lowRgb[2] + (baseRgb[2] - lowRgb[2]) * height);

		var result:Array<Array<Int>> = [];
		for (i in 0...size) {
			result.push([r, g, b]);
		}

		return result;
	}
}

class Obstacle {
	public var height:Float;

	public function new(height:Float) {
		this.height = height;
	}

	public function render():Array<Array<Int>> {
		var LOW_SIZE:Int = 1;
		var HIGH_SIZE:Int = 15;

		var size:Int = LOW_SIZE + Math.floor(height * (HIGH_SIZE - LOW_SIZE));
		if (size % 2 == 0) size += 1;

		var baseRgb = rgb(0xcccccc);
		var lowRgb = rgb(0x999999);

		var r = Math.floor(lowRgb[0] + (baseRgb[0] - lowRgb[0]) * height);
		var g = Math.floor(lowRgb[1] + (baseRgb[1] - lowRgb[1]) * height);
		var b = Math.floor(lowRgb[2] + (baseRgb[2] - lowRgb[2]) * height);

		var result:Array<Array<Int>> = [];
		for (i in 0...size) {
			result.push([r, g, b]);
		}

		return result;
	}
}

@:expose
class Dino extends Game {
	var player:Player;
	var obstacles:Array<Obstacle>;
	public var ttimestamp:Float;

	private static final LEVELS                      = 10;
	private static final LEVEL_LENGTH                = 1500;
	private static final START_SPEED                 = 30;
	private static final END_SPEED                   = 60;
	private static final START_BUILDINGS             = 7;
	private static final END_BUILDINGS               = 15;
	private static final START_MIN_BUILDING_HEIGHT   = 0.2;
	private static final START_MAX_BUILDING_HEIGHT   = 0.3;
	private static final END_MIN_BUILDING_HEIGHT     = 0.5;
	private static final END_MAX_BUILDING_HEIGHT     = 0.8;
	private static final MIN_BUILDING_WIDTH          = 4;
	private static final MAX_BUILDING_WIDTH          = 12;
	private static final START_OBJECTS               = 1;
	private static final END_OBJECTS                 = 12;
	private static final MIN_OBJECT_WIDTH            = 4;
	private static final MAX_OBJECT_WIDTH            = 24;

	public function new(audio:Audio, resolution:Int) {
		super("Dino", resolution, audio);
		player = new Player(this);
	}



	override public function loop():Void {
		super.loop();
		player.update();

		var now = time;
		var delta = now - ttimestamp;
		ttimestamp = now;

		for (i in 0...Math.floor(SPEED * delta)) {
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

		for (i in 0...resolution) {
			pixels[i] = rgb(Colors.Black);
		}

		for (i in 0...obstacles.length) {
			var obstacle = obstacles[i];
			if (obstacle != null) {
				var obstaclePixels = obstacle.render();
				var offset = Math.floor(obstaclePixels.length / 2);

				for (j in 0...obstaclePixels.length) {
					var stripPos = i - offset + j;
					if (stripPos >= 0 && stripPos < resolution) {
						pixels[stripPos] = obstaclePixels[j];
					}
				}







			var center = Math.floor(resolution / 2);
			var shadowLength = Math.floor(Math.abs(i - center) * obstaclePixels.length / (1 * center));
			if (shadowLength > 0) {
				var shadowColor = rgb(0x333333);
				if (i < center) {
					var shadowStart = i + offset + 1;
					for (k in 0...shadowLength) {
						var shadowPos = shadowStart + k;
						if (shadowPos >= 0 && shadowPos < resolution) {
							pixels[shadowPos] = shadowColor;
						}
					}
				} else {
					var shadowStart = i - offset - shadowLength;
					for (k in 0...shadowLength) {
						var shadowPos = shadowStart + k;
						if (shadowPos >= 0 && shadowPos < resolution) {
							pixels[shadowPos] = shadowColor;
						}
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
			if (stripPos >= 0 && stripPos < resolution) {
				pixels[stripPos] = playerPixels[i];
			}
		}
	}



/*override public function loop():Void {
	super.loop();
	player.update();

	var now = time;
	var delta = now - timestamp;
	timestamp = now;

	for (i in 0...Math.floor(SPEED * delta)) {
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

	for (i in 0...resolution) {
		pixels[i] = rgb(Colors.Black);
	}

	for (i in 0...obstacles.length) {
		var obstacle = obstacles[i];
		if (obstacle != null) {
			var buildingPixels = obstacle.render();
			var offset = Math.floor(buildingPixels.length / 2);

			for (j in 0...buildingPixels.length) {
				var stripPos = i - offset + j;
				if (stripPos >= 0 && stripPos < resolution) {
					pixels[stripPos] = buildingPixels[j];
				}
			}

			var center = Math.floor(resolution / 2);
			var shadowLength = Math.floor(Math.abs(i - center) * buildingPixels.length / (2 * center));
			if (shadowLength > 0) {
				var shadowColor = rgb(Colors.DarkRed);
				if (i < center) {
					var shadowStart = i + offset + 1;
					for (k in 0...shadowLength) {
						var shadowPos = shadowStart + k;
						if (shadowPos >= 0 && shadowPos < resolution) {
							pixels[shadowPos] = shadowColor;
						}
					}
				} else {
					var shadowStart = i - offset - shadowLength;
					for (k in 0...shadowLength) {
						var shadowPos = shadowStart + k;
						if (shadowPos >= 0 && shadowPos < resolution) {
							pixels[shadowPos] = shadowColor;
						}
					}
				}
			}

		}
	}

	var playerPixels = player.render();
	var offset = Math.floor(playerPixels.length / 2);
	var centerPos = Math.floor(resolution * 0.25);

	for (i in 0...playerPixels.length) {
		var stripPos = centerPos - offset + i;
		if (stripPos >= 0 && stripPos < resolution) {
			pixels[stripPos] = playerPixels[i];
		}
	}
}*/

	override public function buttonPress(buttonIndex:Int):Void {
		if (buttonIndex == 0) {
			player.jump();
		}
	}

	static public function main() {
	}

}