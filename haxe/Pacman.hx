import App;

class Actor {
	public var position:Int = 0;
	public var reverse:Bool = false;
	public var speed:Float = 0.0;
	private var positionAccumulator:Float = 0.0;
	private var lastUpdateTime:Float = 0.0;
	private var app:App;

	public function new(app:App) {
		this.app = app;
	}

	public function update(appTime:Float):Void {
		if (lastUpdateTime == 0) {
			lastUpdateTime = appTime;
			return;
		}
		
		var deltaTime = appTime - lastUpdateTime;
		
		if (speed == 0 || deltaTime <= 0) {
			lastUpdateTime = appTime;
			return;
		}
		
		var pixelsToMove = speed * deltaTime;
		positionAccumulator += pixelsToMove;
		var wholePixels = Math.floor(positionAccumulator);
		
		if (wholePixels > 0) {
			positionAccumulator -= wholePixels;
			if (reverse) {
				position -= wholePixels;
			} else {
				position += wholePixels;
			}
			position = ((position % app.resolution) + app.resolution) % app.resolution;
		}
		
		lastUpdateTime = appTime;
	}
}

class Player extends Actor {
	public var isPoweredUp:Bool = false;
	public var powerUpEndTime:Float = 0.0;
}

class Ghost extends Actor {}

class Pellet {
	public var isMagic:Bool;

	public function new(magic:Bool = false) {
		isMagic = magic;
	}
}

@:expose
class Pacman extends Game {
	static inline var LEVELS = 10;
	static inline var GAP = 3;
	var TOTAL_PELLETS:Int;
	static inline var START_MAGIC = 2;
	static inline var END_MAGIC = 6;
	static inline var POWER_UP_DURATION = 5.0;

	public var player:Player;
	public var ghosts:Array<Ghost>;
	public var maze:Array<Null<Pellet>>;
	
	var moveUpPressed:Bool = false;
	var moveDownPressed:Bool = false;

	public function new(sound:Dynamic, resolution:Int) {
		super(sound, resolution);
		TOTAL_PELLETS = Std.int(resolution / (GAP + 1));
		log("Pacman");
		player = new Player(this);
		ghosts = [];
		moveUpPressed = false;
		moveDownPressed = false;
		maze = [for (i in 0...resolution) null];
		startLevel();
	}

	override function buildStage():Void {
		var levelIndex = level;
		
		var magic = START_MAGIC + Math.round((END_MAGIC - START_MAGIC) * (levelIndex / (LEVELS - 1)));
		for (i in 0...resolution)
			maze[i] = null;
		var allPelletPositions:Array<Int> = [];
		var pos = 0;
		while (pos < resolution) {
			allPelletPositions.push(pos);
			pos += GAP + 1;
		}
		for (i in 0...allPelletPositions.length) {
			var j = i + Math.floor(Math.random() * (allPelletPositions.length - i));
			var temp = allPelletPositions[i];
			allPelletPositions[i] = allPelletPositions[j];
			allPelletPositions[j] = temp;
		}
		
		for (i in 0...TOTAL_PELLETS) {
			var pos = allPelletPositions[i];
			if (i < magic) {
				maze[pos] = new Pellet(true);
			} else {
				maze[pos] = new Pellet(false);
			}
		}
	}

	override public function startLevel():Void {
		maze = [for (i in 0...resolution) null];
		player = new Player(this);
		ghosts = [];
		//build();
		super.startLevel();
		log("Starting Pacman level " + this.level);
	}

	override public function loop():Void {
		super.loop();

		if (pendingHandler != null)
			return;

		player.update(time);

		var pellet = maze[player.position];
		if (pellet != null) {
			maze[player.position] = null;
			
			if (pellet.isMagic) {
				player.isPoweredUp = true;
				player.powerUpEndTime = time + POWER_UP_DURATION;
			}
		}

		if (player.isPoweredUp && time > player.powerUpEndTime) {
			player.isPoweredUp = false;
		}

		var pelletsLeft = false;
		for (i in 0...resolution) {
			if (maze[i] != null) {
				pelletsLeft = true;
				break;
			}
		}
		if (!pelletsLeft) {
			if (level >= LEVELS - 1) {
				log("Game Complete!");
			} else {
				defer(startNextLevel, 1);
				log("Level " + (level + 1) + " complete!");
			}
			return;
		}
		render();

	}



	public function render() {
		for (i in 0...resolution)
			pixels[i] = rgb(Colors.None);
		for (i in 0...resolution) {
			var pellet = maze[i];
			if (pellet != null) {
				if (pellet.isMagic) {
					pixels[i] = rgb(Colors.Green);
				} else {
					pixels[i] = rgb(Colors.DarkGreen);
				}
			}
		}
	
		if (player.isPoweredUp) {
			pixels[player.position] = rgb(Colors.Magenta);
		} else {
			pixels[player.position] = rgb(Colors.Yellow);
		}
	}


	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				moveUpPressed = true;
				updatePlayerMovement();
			case 2:
				moveDownPressed = true;
				updatePlayerMovement();
		}
	}

	override public function buttonRelease(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				moveUpPressed = false;
				updatePlayerMovement();
			case 2:
				moveDownPressed = false;
				updatePlayerMovement();
		}
	}

	override public function buttonReleaseHold(buttonIndex:Int):Void {
		buttonRelease(buttonIndex);
	}

	override public function buttonHold(buttonIndex:Int):Void {
	}

	function updatePlayerMovement():Void {
		if (moveUpPressed && !moveDownPressed) {
			player.reverse = false;
			player.speed = 20;
		} else if (moveDownPressed && !moveUpPressed) {
			player.reverse = true;
			player.speed = 20;
		} else {
			player.speed = 0;
		}
	}

	static public function main() {
	}
}
