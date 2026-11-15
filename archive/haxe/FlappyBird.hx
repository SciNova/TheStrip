import _System;
import _Input;
import _Game;

class Bird {
	public var position:Float;
	public var speed:Float;
	public var game:Game;
	public static inline var GRAVITY:Float = 20;
	public static inline var BOOST:Float = 20;

	public function new(game:Game) {
		this.game = game;
		position = Std.int(game.resolution / 2);
		speed = 0;
	}

	public function boost():Void {
		speed = BOOST;
	}

	public function update(dt:Float):Void {
		speed -= GRAVITY * dt;
		position += speed * dt;
		if (position < 0) position = 0;
		if (position > game.resolution - 1) position = game.resolution - 1;
	}
}

class Terrain {
	public static inline var MIN_FLUCTUATION:Float = 0.0;
	public static inline var MAX_FLUCTUATION:Float = 0.15;
	public static inline var MIN_SPEED:Float = 0.1;
	public static inline var MAX_SPEED:Float = 1.0;

	public var height:Float;
	public var baseHeight:Float;
	public var fluctuation:Float;
	public var speed:Float;

	var game:Game;

	public function new(game:Game) {
		this.game = game;
		this.height = 0;
		this.baseHeight = 0;
		this.fluctuation = 0;
		this.speed = 0;
	}

	public function update(dt:Float):Void {
		var maxChange = speed * game.resolution * dt;
		var step = (Math.random() * 2 - 1) * maxChange;

		height += step;
		var minHeight = baseHeight - fluctuation * game.resolution;
		var maxHeight = baseHeight + fluctuation * game.resolution;
		if (height < minHeight) height = minHeight;
		if (height > maxHeight) height = maxHeight;
	}
}

@:expose
class FlappyBird extends Game {
	public static inline var MAX_GAP:Float = 0.5;
	public static inline var MIN_GAP:Float = 0.2;
	public static inline var MIN_FLUCTUATION:Float = 0.0;
	public static inline var MAX_FLUCTUATION:Float = 0.3;

	var bird:Bird;
	var topTerrain:Terrain;
	var bottomTerrain:Terrain;

	var gap:Float;
	var gapPosition:Float;
	var fluctuation:Float;

	public function new(system:System) {
		super("FlappyBird", system);

		gap = 0.5;
		gapPosition = 0.5;
		fluctuation = 0.1;

		bird = new Bird(this);
		topTerrain = new Terrain(this);
		bottomTerrain = new Terrain(this);
	}

	override function loop() {
		super.loop();
		if (pendingHandler != null)
			return;
		
		var dt = system.delta;
		var t = Math.min(time / 60.0, 1.0);
	
		gap = MAX_GAP - (MAX_GAP - MIN_GAP) * t;
		fluctuation = MIN_FLUCTUATION + (MAX_FLUCTUATION - MIN_FLUCTUATION) * t;
		
		topTerrain.fluctuation = Terrain.MIN_FLUCTUATION + 
			(Terrain.MAX_FLUCTUATION - Terrain.MIN_FLUCTUATION) * t;
		bottomTerrain.fluctuation = topTerrain.fluctuation;
		
		topTerrain.speed = Terrain.MIN_SPEED + 
			(Terrain.MAX_SPEED - Terrain.MIN_SPEED) * t;
		bottomTerrain.speed = topTerrain.speed;

		var gapCenter = gapPosition * resolution;
		var gapSize = gap * resolution;
		var topBase = gapCenter + gapSize / 2;
		var bottomBase = gapCenter - gapSize / 2;

		topTerrain.baseHeight = resolution - topBase;
		bottomTerrain.baseHeight = bottomBase;

		topTerrain.update(dt);
		bottomTerrain.update(dt);
		bird.update(dt);
		render();
	}

	override function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0) {
		if (input == Input.ButtonA)
			bird.boost();
	}

	function render() {
		for (i in 0...resolution)
			pixels[i] = 0x00007F;

		var topHeight = Math.round(topTerrain.height);
		for (i in 0...topHeight)
			pixels[resolution - 1 - i] = Colors.Red;

		var bottomHeight = Math.round(bottomTerrain.height);
		for (i in 0...bottomHeight)
			pixels[i] = Colors.Red;

		var birdIndex = Math.floor(bird.position);
		pixels[birdIndex] = Colors.Yellow;
	}

	static public function main() {}
}
