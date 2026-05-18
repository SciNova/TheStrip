import App;

class Bird {
	public var position:Float;
	public var speed:Float;
	public var timestamp:Float;
	public var app:App;
	public static inline var GRAVITY:Float = 20;
	public static inline var BOOST:Float = 20;

	public function new(app:App) {
		this.app = app;
		position = Std.int(app.resolution / 2);
		speed = 0;
		timestamp = app.time;
	}

	public function boost():Void {
		speed = BOOST;
	}

	public function update():Void {
		var dt = app.time - this.timestamp;
		speed -= GRAVITY * dt;
		position += speed * dt;
		if (position < 0)
			position = 0;
		if (position > app.resolution - 1)
			position = app.resolution - 1;
		timestamp = app.time;
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

	var app:App;
	var timestamp:Float;

	public function new(app:App) {
		this.app = app;
		this.timestamp = app.time;
		this.height = 0;
		this.baseHeight = 0;
		this.fluctuation = 0;
		this.speed = 0;
	}

	public function update():Void {
		var now = app.time;
		var dt = now - timestamp;
		timestamp = now;

		var maxChange = speed * app.resolution * dt;
		var step = (Math.random() * 2 - 1) * maxChange;

		height += step;
		var minHeight = baseHeight - fluctuation * app.resolution;
		var maxHeight = baseHeight + fluctuation * app.resolution;
		if (height < minHeight) height = minHeight;
		if (height > maxHeight) height = maxHeight;
	}
}

@:expose
class FlappyBird extends App {
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

	public function new(audio:Audio, resolution:Int) {
		super("FlappyBird", resolution, audio);

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

		topTerrain.update();
		bottomTerrain.update();
		bird.update();
		render();
	}

	override function buttonPress(idx:Int) {
		if (idx == 0)
			bird.boost();
	}

	function render() {
		for (i in 0...resolution)
			pixels[i] = [0, 0, 0x7F];

		var topHeight = Math.round(topTerrain.height);
		for (i in 0...topHeight) {
			pixels[resolution - 1 - i] = [255, 0, 0];
		}

		var bottomHeight = Math.round(bottomTerrain.height);
		for (i in 0...bottomHeight) {
			pixels[i] = [255, 0, 0];
		}

		var birdIndex = Math.floor(bird.position);
		pixels[birdIndex] = rgb(Colors.Yellow);//b[0, 255, 0];
	}

	static public function main() {}
}
