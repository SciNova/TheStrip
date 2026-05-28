import _Game.Game;
import _Game.Colors;
import _System.System;
import _Input.Input;
import _Input.InputEvent;

class Actor {
	public var position:Int = 0;
	public var reverse:Bool = false;
	public var speed:Float = 0.0;
	private var positionAccumulator:Float = 0.0;

	public function new() {}

	public function update(dt:Float):Void {
		if (speed == 0 || dt <= 0)
			return;

		positionAccumulator += speed * dt;
		var wholePixels = Math.floor(positionAccumulator);

		if (wholePixels > 0) {
			positionAccumulator -= wholePixels;
			if (reverse)
				position -= wholePixels;
			else
				position += wholePixels;
		}
	}
}

class Player extends Actor {
	public var isPoweredUp:Bool = false;
	public var powerUpEndTime:Float = 0.0;

	public function new() {
		super();
	}
}

class Ghost extends Actor {
	public function new() {
		super();
	}
}

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

	public function new(system:System) {
		super("Pacman", system);
		TOTAL_PELLETS = Std.int(resolution / (GAP + 1));
		player = new Player();
		ghosts = [];
		maze = [for (i in 0...resolution) null];
		playLevel();
	}

	override function buildStage():Void {
		player = new Player();
		ghosts = [];

		for (i in 0...resolution)
			maze[i] = null;

		var magic = START_MAGIC + Math.round((END_MAGIC - START_MAGIC) * (level / (LEVELS - 1)));
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
			var p = allPelletPositions[i];
			if (i < magic)
				maze[p] = new Pellet(true);
			else
				maze[p] = new Pellet(false);
		}
	}

	override public function loop():Void {
		super.loop();

		var dt = system.delta;
		player.update(dt);

		var pellet = maze[player.position];
		if (pellet != null) {
			maze[player.position] = null;

			if (pellet.isMagic) {
				player.isPoweredUp = true;
				player.powerUpEndTime = time + POWER_UP_DURATION;
			}
		}

		if (player.isPoweredUp && time > player.powerUpEndTime)
			player.isPoweredUp = false;

		var pelletsLeft = false;
		for (i in 0...resolution) {
			if (maze[i] != null) {
				pelletsLeft = true;
				break;
			}
		}
		if (!pelletsLeft) {
			if (level < LEVELS - 1) {
				nextLevel();
				defer(playLevel, 1);
			}
			return;
		}

		render();
	}

	public function render() {
		for (i in 0...resolution)
			pixels[i] = 0;

		for (i in 0...resolution) {
			var pellet = maze[i];
			if (pellet != null) {
				if (pellet.isMagic)
					pixels[i] = Colors.Green;
				else
					pixels[i] = Colors.DarkGreen;
			}
		}

		if (player.isPoweredUp)
			pixels[player.position] = Colors.Magenta;
		else
			pixels[player.position] = Colors.Yellow;
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

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		switch (type) {
			case InputEvent.ButtonPress:
				switch (input) {
					case Input.ButtonA:
						moveUpPressed = true;
						updatePlayerMovement();
					case Input.ButtonC:
						moveDownPressed = true;
						updatePlayerMovement();
					default:
				}
			case InputEvent.ButtonRelease | InputEvent.ButtonHoldRelease:
				switch (input) {
					case Input.ButtonA:
						moveUpPressed = false;
						updatePlayerMovement();
					case Input.ButtonC:
						moveDownPressed = false;
						updatePlayerMovement();
					default:
				}
			default:
		}
	}

	static public function main() {}
}
