import _Game.Game;
import _Game.BasePlayer;
import _Game.Colors;
import _Game.GameState;
import _Graphics.Alignment;
import _Graphics.EdgeMode;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Audio.Sound;

enum PlayerState {
	RUNNING;
	JUMPING;
}

class Player extends BasePlayer {
	public var height:Float;
	public var jumpSpeed:Float;
	public var state:PlayerState;

	var minFringe:Int;
	var fringe:Int;
	var pixels:Array<Null<Int>>;

	public function new(game:Game) {
		super(game);
		height = 0.0;
		jumpSpeed = 0.0;
		state = RUNNING;

		minFringe = Math.ceil(3/120 * game.resolution);
		fringe = Math.ceil(15/120 * game.resolution);
		var size = minFringe + fringe;
		if (size % 2 == 0) size++;
		pixels = [];
		for (i in 0...size) pixels.push(null);
	}

	public function jump():Void {
		if (state == RUNNING) {
			state = JUMPING;
			jumpSpeed = 2.828;
		}
	}

	public function update():Void {
		var dt = game.delta;
		if (state == JUMPING) {
			jumpSpeed -= 4.0 * dt;
			height += jumpSpeed * dt;
			if (height <= 0) {
				height = 0;
				jumpSpeed = 0;
				state = RUNNING;
			}
		}

		var currentSize = minFringe + Math.floor(height * fringe);
		var center = Math.floor(pixels.length / 2);
		var start = center - Math.floor(currentSize / 2);

		var baseR = (Colors.Green >> 16) & 0xFF;
		var baseG = (Colors.Green >> 8) & 0xFF;
		var baseB = Colors.Green & 0xFF;
		var lowR = (0x009900 >> 16) & 0xFF;
		var lowG = (0x009900 >> 8) & 0xFF;
		var lowB = 0x009900 & 0xFF;

		var r = Math.floor(lowR + (baseR - lowR) * height);
		var g = Math.floor(lowG + (baseG - lowG) * height);
		var b = Math.floor(lowB + (baseB - lowB) * height);
		var packed = (r << 16) | (g << 8) | b;

		for (i in 0...pixels.length) pixels[i] = null;
		for (i in 0...currentSize) pixels[start + i] = packed;
	}

	public function render(position:Float, alignment:Alignment, edge:EdgeMode):Void {
		var len = pixels.length;
		var offset = switch alignment {
			case CENTER: -Math.floor(len / 2);
			case FORWARD: 0;
			case BACKWARD: -len + 1;
		};
		var pos = Math.floor(position) + offset;
		for (i in 0...len) {
			var dest = pos + i;
			if (edge == CLIP && (dest < 0 || dest >= game.resolution)) continue;
			var src = pixels[i];
			if (src != null) game.pixels[dest] = src;
		}
	}
}

class Obstacle {
	public var location:Float;
	public var width:Int;
	public var height:Float;
	public var color:Int;

	public var pixels:Array<Null<Int>>;

	public function new(location:Float, width:Int, height:Float, color:Int, obstacleFringe:Int) {
		this.location = location;
		this.width = width;
		this.height = height;
		this.color = color;

		var fringeSize = (height > 0) ? Math.floor(height * obstacleFringe) : 0;
		var size = width + fringeSize;
		if (size % 2 == 0) size++;
		pixels = [];
		for (i in 0...size) pixels.push(null);

		var start = Math.floor((size - width) / 2);
		for (i in 0...width) pixels[start + i] = color;
	}

	// render method kept for potential future use but not called in this version
	public function render(position:Float, alignment:Alignment, edge:EdgeMode, game:Game):Void {
		var len = pixels.length;
		var offset = switch alignment {
			case CENTER: -Math.floor(len / 2);
			case FORWARD: 0;
			case BACKWARD: -len + 1;
		};
		var pos = Math.floor(position) + offset;
		for (i in 0...len) {
			var dest = pos + i;
			if (edge == CLIP && (dest < 0 || dest >= game.resolution)) continue;
			var src = pixels[i];
			if (src != null) game.pixels[dest] = src;
		}
	}
}

@:expose
class Dino extends Game {
	public var obstacles:Array<Obstacle>;

	var player:Player;
	var location:Float;
	var speed:Float;

	final START_SPEED:Float;
	final END_SPEED:Float;
	final MIN_BUILDING_WIDTH:Int;
	final MAX_BUILDING_WIDTH:Int;
	final MIN_OBJECT_WIDTH:Int;
	final MAX_OBJECT_WIDTH:Int;
	final PLAYER_LOCATION:Int;
	final OBSTACLE_FRINGE:Int;
	final PLAYER_FRINGE:Int;
	final PLAYER_MIN_FRINGE:Int;
	final LEVEL_START_CLEARANCE:Int;
	final LEVEL_END_CLEARANCE:Int;

	static final LEVELS = 10;
	static final LEVEL_LENGTH = 12.5;

	static final START_BUILDINGS = 7;
	static final END_BUILDINGS   = 15;
	static final START_MIN_BUILDING_HEIGHT = 0.2;
	static final START_MAX_BUILDING_HEIGHT = 0.3;
	static final END_MIN_BUILDING_HEIGHT   = 0.5;
	static final END_MAX_BUILDING_HEIGHT   = 0.8;

	static final OBJECT_COVERAGE = 1/4;

	public function new(system:System) {
		super("Dino", system);

		START_SPEED = 1/4 * resolution;
		END_SPEED   = 1/2 * resolution;
		MIN_BUILDING_WIDTH = Std.int(4/120 * resolution);
		MAX_BUILDING_WIDTH = Std.int(12/120 * resolution);
		MIN_OBJECT_WIDTH   = Std.int(4/120 * resolution);
		MAX_OBJECT_WIDTH   = Std.int(24/120 * resolution);
		PLAYER_LOCATION = Std.int(1/3 * resolution);
		OBSTACLE_FRINGE = Std.int(15/120 * resolution);
		PLAYER_FRINGE   = Std.int(15/120 * resolution);
		PLAYER_MIN_FRINGE = Std.int(3/120 * resolution);
		LEVEL_START_CLEARANCE = 1 * resolution;
		LEVEL_END_CLEARANCE   = Std.int(1/3 * resolution);

		player = new Player(this);
		obstacles = [];
		location = 0.0;
		speed = START_SPEED;

		level = 1;
		playLevel();
	}

	override function buildStage():Void {
		if (time != 0) return;

		var totalDistance = LEVELS * LEVEL_LENGTH * resolution;
		for (l in 1...LEVELS + 1) {
			var progress = (l - 1) / (LEVELS - 1);
			var currentSpeed = START_SPEED + (END_SPEED - START_SPEED) * progress;
			var levelStart = (l - 1) * LEVEL_LENGTH * resolution;
			var levelEnd = l * LEVEL_LENGTH * resolution;

			// Stochastic rounding for building count
			var buildingFloat = START_BUILDINGS + (END_BUILDINGS - START_BUILDINGS) * progress;
			var numBuildings = Std.int(Math.floor(buildingFloat));
			if (Math.random() < (buildingFloat - numBuildings)) numBuildings++;

			var minBH = START_MIN_BUILDING_HEIGHT + (END_MIN_BUILDING_HEIGHT - START_MIN_BUILDING_HEIGHT) * progress;
			var maxBH = START_MAX_BUILDING_HEIGHT + (END_MAX_BUILDING_HEIGHT - START_MAX_BUILDING_HEIGHT) * progress;

			// Building placement boundaries (center of first and last)
			var firstCenter = levelStart + LEVEL_START_CLEARANCE;
			var lastCenter  = levelEnd   - LEVEL_END_CLEARANCE;

			// Store placed items with their geometric visual length (no pixel buffer)
			var placedItems:Array<{loc:Float, extent:Int}> = [];

			// --- Buildings ---
			if (numBuildings == 1) {
				var bWidth = MIN_BUILDING_WIDTH + Std.int(Math.random() * (MAX_BUILDING_WIDTH - MIN_BUILDING_WIDTH + 1));
				var bHeight = minBH + Math.random() * (maxBH - minBH);
				var center = firstCenter + (lastCenter - firstCenter) / 2;
				var geoLength = bWidth + ((bHeight > 0) ? Math.floor(bHeight * OBSTACLE_FRINGE) : 0);
				obstacles.push(new Obstacle(center, bWidth, bHeight, 0x999999, OBSTACLE_FRINGE));
				placedItems.push({loc: center, extent: 3 * geoLength});
			} else {
				var step = (lastCenter - firstCenter) / (numBuildings - 1);
				var minGap = MAX_BUILDING_WIDTH + MIN_OBJECT_WIDTH;

				var centers:Array<Float> = [];
				centers.push(firstCenter);

				for (i in 1...numBuildings - 1) {
					var originalCenter = firstCenter + i * step;
					var leftBound  = centers[i - 1] + minGap;
					var rightBound = firstCenter + (i + 1) * step - minGap;
					var center = leftBound + Math.random() * (rightBound - leftBound);
					centers.push(center);
				}

				centers.push(lastCenter);

				for (i in 0...centers.length) {
					var bWidth = MIN_BUILDING_WIDTH + Std.int(Math.random() * (MAX_BUILDING_WIDTH - MIN_BUILDING_WIDTH + 1));
					var bHeight = minBH + Math.random() * (maxBH - minBH);
					var geoLength = bWidth + ((bHeight > 0) ? Math.floor(bHeight * OBSTACLE_FRINGE) : 0);
					obstacles.push(new Obstacle(centers[i], bWidth, bHeight, 0x999999, OBSTACLE_FRINGE));
					placedItems.push({loc: centers[i], extent: 3 * geoLength});
				}
			}

			// --- Objects (ground patches) based on coverage ---
			// Compute raw floor area after subtracting building shadow envelopes (using geometric visual lengths)
			var rawFloor = (levelEnd - levelStart);
			for (item in placedItems) rawFloor -= item.extent;

			var targetTotalWidth = OBJECT_COVERAGE * rawFloor;
			var currentTotalWidth:Float = 0;
			var maxAttempts = 200;

			while (currentTotalWidth < targetTotalWidth && maxAttempts-- > 0) {
				var oWidth = MIN_OBJECT_WIDTH + Std.int(Math.random() * (MAX_OBJECT_WIDTH - MIN_OBJECT_WIDTH + 1));
				var placed = false;

				while (oWidth >= MIN_OBJECT_WIDTH) {
					for (attempt in 0...10) {
						var center = levelStart + Math.random() * (levelEnd - levelStart);
						var ok = true;
						for (item in placedItems) {
							var minDist = item.extent/2 + MIN_OBJECT_WIDTH + oWidth/2;
							if (Math.abs(center - item.loc) < minDist) {
								ok = false;
								break;
							}
						}
						if (center - oWidth/2 < levelStart || center + oWidth/2 > levelEnd) ok = false;
						if (ok) {
							var oColor = (Math.random() < 0.5) ? Colors.Green : 0x8B4513;
							obstacles.push(new Obstacle(center, oWidth, 0.0, oColor, 0));
							placedItems.push({loc: center, extent: oWidth});  // geometric visual length = oWidth
							currentTotalWidth += oWidth;
							placed = true;
							break;
						}
					}
					if (placed) break;
					oWidth = Std.int(oWidth / 2);
					if (oWidth < MIN_OBJECT_WIDTH) oWidth = MIN_OBJECT_WIDTH;
					if (oWidth == MIN_OBJECT_WIDTH && !placed) break;
				}
				if (!placed) break;
			}
		}
		obstacles.sort((a, b) -> Reflect.compare(a.location, b.location));
	}

	override function loop():Void {
		super.loop();

		var totalDistance = LEVELS * LEVEL_LENGTH * resolution;
		if (state == GameState.COMPLETE) return;
		if (location >= totalDistance) {
			audio.play(Sound.GAME_COMPLETE);
			state = GameState.COMPLETE;
			return;
		}

		player.update();

		var progress = location / totalDistance;
		if (progress > 1) progress = 1;
		speed = START_SPEED + (END_SPEED - START_SPEED) * progress;

		location += speed * delta;

		while (location >= level * LEVEL_LENGTH * resolution && level < LEVELS) {
			nextLevel();
			audio.play(Sound.CHECKPOINT);
		}

		// Collision detection commented out
		// var playerWorldX = location + PLAYER_LOCATION;
		// for (obs in obstacles) {
		// 	if (obs.height > 0) {
		// 		if (playerWorldX >= obs.location && playerWorldX < obs.location + obs.width && player.height < obs.height) {
		// 			audio.play(Sound.LEVEL_FAIL);
		// 			defer(playLevel, 4);
		// 			return;
		// 		}
		// 	}
		// }

		// Alternating screen backgrounds
		for (i in 0...resolution) {
			var screenIndex = Math.floor((location + i) / resolution);
			pixels[i] = (screenIndex % 2 == 0) ? 0 : 0x333333;
		}

		var center = Math.floor(resolution / 2);
		for (obs in obstacles) {
			var stripPos = obs.location - location;
			var buf = obs.pixels;
			var len = buf.length;
			var offset = Math.floor(len / 2);

			if (stripPos + len/2 < 0 || stripPos - len/2 > resolution) continue;

			for (j in 0...len) {
				var dest = Math.floor(stripPos) - offset + j;
				if (dest >= 0 && dest < resolution) {
					var src = buf[j];
					if (src != null) {
						pixels[dest] = src;
					}
				}
			}

			if (obs.height > 0) {
				var visibleStart = Math.floor(stripPos) - Math.floor(obs.width / 2);
				var visibleEnd = visibleStart + obs.width - 1;
				var shadowLength = Std.int(Math.abs(stripPos - center) * len / center);
				if (shadowLength > 0) {
					var shadowColor = 0x333333;
					if (stripPos < center) {
						var start = visibleEnd + 1;
						for (k in 0...shadowLength) {
							var dest = start + k;
							if (dest >= 0 && dest < resolution) pixels[dest] = shadowColor;
						}
					} else {
						var start = visibleStart - shadowLength;
						for (k in 0...shadowLength) {
							var dest = start + k;
							if (dest >= 0 && dest < resolution) pixels[dest] = shadowColor;
						}
					}
				}
			}
		}

		player.render(PLAYER_LOCATION, Alignment.CENTER, EdgeMode.CLIP);
	}

	override function playLevel():Void {
		location = (level - 1) * LEVEL_LENGTH * resolution;
		player.height = 0;
		player.jumpSpeed = 0;
		player.state = RUNNING;
		super.playLevel();
	}

	override function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (type != InputEvent.ButtonPress) return;
		if (input == Input.ButtonA) player.jump();
	}

	static public function main() {}
}
