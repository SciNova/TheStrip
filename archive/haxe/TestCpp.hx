import App;
import Cars.Car;

@:native("SDL_Window")
@:include("SDL2/SDL.h")
extern class RawWindow {}

@:native("SDL_Surface")
@:include("SDL2/SDL.h")
extern class RawSurface {}

typedef Window = cpp.Pointer<RawWindow>;
typedef Surface = cpp.Pointer<RawSurface>;

@:buildXml('
<files id="haxe">
  <compilerflag value="-I/usr/include/SDL2"/>
  <compilerflag value="-D_REENTRANT"/>
</files>
<target id="haxe">
  <lib name="-lSDL2"/>
</target>
')
@:include("SDL2/SDL.h")
extern class SDL {
	@:native("SDL_Init")
	static function init(flags:cpp.UInt32):Int;

	@:native("SDL_CreateWindow")
	static function createWindow(title:cpp.ConstCharStar, x:Int, y:Int, w:Int, h:Int, flags:cpp.UInt32):Window;

	@:native("SDL_GetWindowSurface")
	static function getWindowSurface(window:Window):Surface;

	@:native("SDL_FillRect")
	static function fillRect(surface:Surface, rect:cpp.RawPointer<cpp.Void>, color:cpp.UInt32):Int;

	@:native("SDL_UpdateWindowSurface")
	static function updateWindowSurface(window:Window):Int;

	@:native("SDL_Delay")
	static function delay(ms:cpp.UInt32):Void;

	@:native("SDL_Quit")
	static function quit():Void;
}

class TestPlayer extends BasePlayer {
	public var speed:Float;
	public function new(game:Game) {
		super(game);
		speed = 0;
	}
}

class Test extends Game {
	var car:Car;
	var window:Window;
	var surface:Surface;

	public function new() {
		super("Test", 120, new System(new Audio(this), new Clock(), new Strip()));
		world = new World(1, true, 1, true);
		player = new TestPlayer(this);
		player.x = 0;
		player.rotation = 0.1;
		player.speed = 1/20;

		car = new Car(this);
		car.x = 0;
		car.rotation = player.rotation + 0.5;
		car.speed = 1/20;

		SDL.init(0x20);
		window = SDL.createWindow("Test", 140, 0, 1000, 1000, 0);
		surface = SDL.getWindowSurface(window);
	}

	override function loop() {
		super.loop();

		var p:TestPlayer = cast player;
		var angle = p.rotation * 2 * Math.PI;
		p.x += p.speed * resolution * Math.cos(angle) * delta;
		p.z += p.speed * resolution * Math.sin(angle) * delta;
		car.update();

		var worldW = world.WIDTH * resolution;
		var worldD = world.DEPTH * resolution;
		var halfW = worldW / 2;
		var halfD = worldD / 2;
		p.x = ((p.x + halfD) % worldD + worldD) % worldD - halfD;
		p.z = ((p.z + halfW) % worldW + worldW) % worldW - halfW;
		car.x = ((car.x + halfD) % worldD + worldD) % worldD - halfD;
		car.z = ((car.z + halfW) % worldW + worldW) % worldW - halfW;

		// Scale factor: window is 1000x1000, world coords range [-60, 60)
		var scale = 1000.0 / 120.0;
		var px = Std.int((p.x + 60.0) * scale);
		var py = Std.int((p.z + 60.0) * scale);
		var cx = Std.int((car.x + 60.0) * scale);
		var cy = Std.int((car.z + 60.0) * scale);

		var surf = surface.ptr;
		// Fill background dark gray
		SDL.fillRect(surface, null, untyped __cpp__("SDL_MapRGB({0}->format, 51, 51, 51)", surf));
		// Draw player (green) and car (red) as 3x3 dots
		untyped __cpp__("{ SDL_Rect _r = {(int){1}-1, (int){2}-1, 3, 3}; SDL_FillRect({0}, &_r, SDL_MapRGB({0}->format, 0, 255, 0)); }", surf, px, py);
		untyped __cpp__("{ SDL_Rect _r = {(int){1}-1, (int){2}-1, 3, 3}; SDL_FillRect({0}, &_r, SDL_MapRGB({0}->format, 255, 0, 0)); }", surf, cx, cy);

		SDL.updateWindowSurface(window);
	}

	public static function main():Void {
		var app = new Test();
		while (true) {
			app.loop();
			SDL.delay(16);
		}
	}
}