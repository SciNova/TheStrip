import _Game.Game;
import _Game.Colors;
import _Game.BasePlayer2D;
import _Game.World2D;
import _Game.Camera;
import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Graphics.Square2D;
import _Graphics.EdgeMode;

class Player extends BasePlayer2D {
	public var speed:Float;
	public function new(game:Game) {
		super(game);
		speed = 0;
	}
}

class Car extends Square2D {
	static var SIZE:Float = 1/3;
	static var LIGHT_SIZE:Float = 1/7;
	static var LIGHT_INSET:Float = 1/4;
	static var BODY_COLORS:Array<Int> = [Colors.Green, Colors.Blue];

	public var speed:Float;

	public function new(game:Game) {
		var len = Std.int(game.resolution * SIZE);
		if (len % 2 == 0) len--;
		var body = BODY_COLORS[Std.random(BODY_COLORS.length)];
		var dark = darken(body);
		var faces:Array<Array<Null<Int>>> = [
			buildFace(len, body, Colors.White),
			solidFace(len, dark),
			buildFace(len, body, Colors.Red),
			solidFace(len, dark)
		];
		super(game, faces, true);
		speed = 0;
	}

	public function tick(dt:Float):Void {
		var angle = rotation * 2 * Math.PI;
		x += speed * game.resolution * Math.cos(angle) * dt;
		z += speed * game.resolution * Math.sin(angle) * dt;
		super.update();
	}

	function buildFace(len:Int, body:Int, light:Int):Array<Null<Int>> {
		var face = solidFace(len, body);
		var leftCen = Math.floor(len * LIGHT_INSET);
		var rightCen = Math.ceil(len * (1 - LIGHT_INSET));
		var dia = Math.ceil(len * LIGHT_SIZE);
		var half = (dia - 1) >> 1;
		fillLight(face, leftCen - half, dia, light);
		fillLight(face, rightCen - half, dia, light);
		return face;
	}

	function fillLight(face:Array<Null<Int>>, start:Int, count:Int, color:Int) {
		var end = start + count;
		if (start < 0) start = 0;
		if (end > face.length) end = face.length;
		for (i in start...end) face[i] = color;
	}

	function solidFace(len:Int, color:Int):Array<Null<Int>> {
		return [for (i in 0...len) color];
	}

	static function darken(c:Int):Int {
		var r = (c >> 16) & 0xFF;
		var g = (c >> 8) & 0xFF;
		var b = c & 0xFF;
		return (Std.int(r * 0.5) << 16) | (Std.int(g * 0.5) << 8) | Std.int(b * 0.5);
	}
}

@:expose
class Cars extends Game {
	static var LEVELS:Int = 10;
	static var FIRST_LEVEL_START_SIZE:Float = 1;
	static var FIRST_LEVEL_END_SIZE:Float = 1;
	static var LAST_LEVEL_START_SIZE:Float = 100;
	static var LAST_LEVEL_END_SIZE:Float = 10;

	var cars:Array<Car> = [];
	var initialCars:Int = 0;
	var levelStartSize:Float = 0;
	var levelEndSize:Float = 0;
	
	var player:Player;
	var camera:Camera;
	var turnLeftPressed:Bool = false;
	var turnRightPressed:Bool = false;

	public function new(system:System) {
		super("Cars", system);
		camera = new Camera();
		player = new Player(this);
		player.speed = 1/4;
		level = 2;
		playLevel();
	}

	override function buildStage():Void {
		var n = level;
		initialCars = Std.int(Math.pow(2, n));
		levelStartSize = FIRST_LEVEL_START_SIZE + (LAST_LEVEL_START_SIZE - FIRST_LEVEL_START_SIZE) * n / (LEVELS - 1);
		levelEndSize = FIRST_LEVEL_END_SIZE + (LAST_LEVEL_END_SIZE - FIRST_LEVEL_END_SIZE) * n / (LEVELS - 1);
		world = new World2D(levelStartSize, levelStartSize, true, true);

		cars = [];
		var w = cast(world, World2D);
		var halfW = w.width * resolution / 2;
		var halfD = w.depth * resolution / 2;
		for (i in 0...initialCars) {
			var car = new Car(this);
			car.x = Math.random() * 2 * halfD - halfD;
			car.z = Math.random() * 2 * halfW - halfW;
			car.rotation = Math.random();
			car.speed = 1/15 + Math.random() * (1/12 - 1/15);
			cars.push(car);
		}

		player.x = 0;
		player.z = 0;
		player.rotation = 0;
		turnLeftPressed = false;
		turnRightPressed = false;
	}

	override function loop() {
		super.loop();
		clear();
		for (i in 0...resolution)
			pixels[i] = Colors.LightGray;

		var dt = system.delta;

		if (turnLeftPressed) player.rotation = (player.rotation - 0.5 * dt + 1) % 1;
		if (turnRightPressed) player.rotation = (player.rotation + 0.5 * dt) % 1;

		var pAngle = player.rotation * 2 * Math.PI;
		player.x += player.speed * resolution * Math.cos(pAngle) * dt;
		player.z += player.speed * resolution * Math.sin(pAngle) * dt;

		var w = cast(world, World2D);
		var worldW = w.width * resolution;
		var worldD = w.depth * resolution;
		var halfW = worldW / 2;
		var halfD = worldD / 2;
		player.x = ((player.x + halfD) % worldD + worldD) % worldD - halfD;
		player.z = ((player.z + halfW) % worldW + worldW) % worldW - halfW;

		var camDist = 20;
		var camAngle = player.rotation * 2 * Math.PI;
		camera.x = player.x - camDist * Math.cos(camAngle);
		camera.z = player.z - camDist * Math.sin(camAngle);
		camera.rotation = player.rotation;

		for (car in cars) {
			car.tick(dt);
			car.x = ((car.x + halfD) % worldD + worldD) % worldD - halfD;
			car.z = ((car.z + halfW) % worldW + worldW) % worldW - halfW;

			var dx = car.x - camera.x;
			var dz = car.z - camera.z;
			dx = ((dx + halfD) % worldD + worldD) % worldD - halfD;
			dz = ((dz + halfW) % worldW + worldW) % worldW - halfW;

			var cosT = Math.cos(camera.rotation * 2 * Math.PI);
			var sinT = Math.sin(camera.rotation * 2 * Math.PI);
			var forward = dx * cosT + dz * sinT;
			var lateral = -dx * sinT + dz * cosT;

			if (forward > 0) {
				var focalLength = resolution / 2.0;
				var stripPos = resolution / 2 + (lateral / forward) * focalLength;
				var scale = focalLength / forward;
				if (scale > 2) scale = 2;
				car.render(stripPos, EdgeMode.CLIP, scale);
			}
		}
	}

	override public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		switch (type) {
			case InputEvent.ButtonPress:
				if (input == Input.ButtonA) turnLeftPressed = true;
				else if (input == Input.ButtonC) turnRightPressed = true;
			case InputEvent.ButtonRelease | InputEvent.ButtonHoldRelease:
				if (input == Input.ButtonA) turnLeftPressed = false;
				else if (input == Input.ButtonC) turnRightPressed = false;
			default:
		}
	}

	public static function main():Void {}
}
