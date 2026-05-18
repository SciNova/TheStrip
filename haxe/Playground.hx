import App;

class Maze {
	public static final SIZE:Array<Int> = [100, 100];
	public static final WIDTH:Int = SIZE[0];
	public static final HEIGHT:Int = SIZE[1];
	public static final MAX_VIEW_DISTANCE:Int = Math.round(Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT) / 2);

	public var textures:Array<Array<Int>>;

	public function new() {
		textures = [
			[Colors.White, Colors.Silver, Colors.White, Colors.Silver],
			[Colors.Silver, Colors.White, Colors.Silver, Colors.White],
			[Colors.White, Colors.Silver, Colors.White, Colors.Silver],
			[Colors.Silver, Colors.White, Colors.Silver, Colors.White]
		];
	}

	public function view(pos:Array<Float>, angleDeg:Float):{ distance:Float, color:Array<Int> } {
		var halfW:Float = WIDTH / 2;
		var halfH:Float = HEIGHT / 2;
		var x = pos[0];
		var y = pos[1];
		var angleRad = angleDeg * Math.PI / 180;
		var dx = Math.cos(angleRad);
		var dy = Math.sin(angleRad);
		var tX = Math.POSITIVE_INFINITY;
		var tY = Math.POSITIVE_INFINITY;
		
		if (dx != 0) {
			if (dx > 0) {
				tX = (halfW - x) / dx;
			} else {
				tX = (-halfW - x) / dx;
			}
		}
		if (dy != 0) {
			if (dy > 0) {
				tY = (halfH - y) / dy;
			} else {
				tY = (-halfH - y) / dy;
			}
		}
		
		if (tX != Math.POSITIVE_INFINITY) {
			var yHit = y + tX * dy;
			if (yHit < -halfH || yHit > halfH) {
				tX = Math.POSITIVE_INFINITY;
			}
		}
		if (tY != Math.POSITIVE_INFINITY) {
			var xHit = x + tY * dx;
			if (xHit < -halfW || xHit > halfW) {
				tY = Math.POSITIVE_INFINITY;
			}
		}
		
		var t = Math.min(tX, tY);
		if (t == Math.POSITIVE_INFINITY) {
			return { distance: 1000.0, color: [0, 0, 0] };
		}
		
		var distance = t;
		
		var wallIndex:Int;
		var hitPos:Float;
		
		if (t == tX) {
			wallIndex = (dx > 0) ? 0 : 1;
			hitPos = y + t * dy;
		} else {
			wallIndex = (dy > 0) ? 2 : 3;
			hitPos = x + t * dx;
		}
		
		var u:Float;
		if (wallIndex < 2) {
			u = (hitPos + halfH) / (2 * halfH);
		} else {
			u = (hitPos + halfW) / (2 * halfW);
		}
		
		u = Math.max(0, Math.min(1, u));
		var texIndex = Math.floor(u * 4);
		if (texIndex >= 4) texIndex = 3;
		
		var colorInt = textures[wallIndex][texIndex];
		
		var normalizedDist = Math.min(1.0, distance / MAX_VIEW_DISTANCE);
		var intensity = 1 - normalizedDist;
		var baseRgb = rgb(colorInt);
		var shadedRgb = [
			Math.round(baseRgb[0] * intensity),
			Math.round(baseRgb[1] * intensity),
			Math.round(baseRgb[2] * intensity)
		];
		
		return { distance: distance, color: shadedRgb };
	}
	
	public function constrainMovement(start:Array<Float>, end:Array<Float>):Array<Float> {
		var halfW = WIDTH / 2;
		var halfH = HEIGHT / 2;
		var resultX = Math.max(-halfW, Math.min(halfW, end[0]));
		var resultY = Math.max(-halfH, Math.min(halfH, end[1]));
		return [resultX, resultY];
	}
}

class Player {
	public var pos:Array<Float>;
	public var angle:Float;
	public var timestamp:Float;
	public var maze:Maze;
	
	public static final ANGULAR_SPEED:Float = 180;
	public static final VIEW_ANGLE:Float = 90;
	public static final VIEW_WIDTH:Int = 120;
	
	private var turningLeft:Bool = false;
	private var turningRight:Bool = false;
	
	public function new(maze:Maze) {
		this.maze = maze;
		pos = [0, 0];
		angle = 0;
		timestamp = 0;
	}
	
	public function startTurnLeft():Void {
		turningLeft = true;
	}
	
	public function stopTurnLeft():Void {
		turningLeft = false;
	}
	
	public function startTurnRight():Void {
		turningRight = true;
	}
	
	public function stopTurnRight():Void {
		turningRight = false;
	}
	
	public function loop():Void {
		var now = haxe.Timer.stamp();
		var delta = now - timestamp;
		
		if (delta > 0) {
			if (turningLeft && !turningRight)
				angle -= ANGULAR_SPEED * delta;
			else if (turningRight && !turningLeft)
				angle += ANGULAR_SPEED * delta;
		}
		
		timestamp = now;
	}
}

@:expose
class Playground extends App {
	private var maze:Maze;
	private var player:Player;
	
	public function new(sound:Dynamic, resolution:Int) {
		super(sound, resolution);
		log("Playground - Maze with Textures");
		
		maze = new Maze();
		player = new Player(maze);
	}
	
	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				player.startTurnLeft();
			case 2:
				player.startTurnRight();
		}
	}
	
	override public function buttonRelease(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				player.stopTurnLeft();
			case 2:
				player.stopTurnRight();
		}
	}
	
	override public function buttonReleaseHold(buttonIndex:Int):Void {}
	override public function buttonHold(buttonIndex:Int):Void {}
	
	override public function loop():Void {
		super.loop();
		player.loop();
		
		for (i in 0...resolution) {
			var pixelAngle = player.angle + (i - 59.5) * (Player.VIEW_ANGLE / 120);
			var hit = maze.view(player.pos, pixelAngle);
			pixels[i] = hit.color;
		}
	}
	
	static public function main() {}
}