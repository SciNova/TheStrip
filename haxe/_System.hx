import _Audio.Audio;
import _Input.Controller;
import _Input.Input;
import _Input.InputEvent;
import _Game.Game;
import _LedDisplay.LedDisplay;

@:expose
class Clock {
	public var time:Float = 0;

	public function new():Void {
		time = haxe.Timer.stamp();
	}

	public function update():Void {
		time = haxe.Timer.stamp();
	}
}


@:expose
class Strip {
	public var game:Game;
	public function new():Void {}
	public function begin():Void {}
	public function update():Void {}
}





@:expose("SystemState")
enum SystemState {
	MENU;
	PLAY;
}

@:expose("System")
class System {
	public var audio:Null<Audio>;
	public var clock:Null<Clock>;
	public var leds:Null<LedDisplay> = null;
	public var controllers:Array<Null<Controller>>;
	public var game:Null<Game> = null;
	public var menu:Null<Game> = null;
	public var uptime:Float = 0;
	public var delta:Float = 0;
	public var state:SystemState = MENU;

	var timestamp:Float;

	public var homeController(get, null):Null<Controller>;
	public var guestController(get, null):Null<Controller>;

	public function new() {
		audio = new Audio(this);
		clock = new Clock();
		controllers = [null, null];
		clock.update();
		timestamp = clock.time;
	}

	function get_homeController():Null<Controller> {
		if (controllers[0] != null)
			return controllers[0];
		if (controllers[1] != null)
			return controllers[1];
		return null;
	}

	function get_guestController():Null<Controller> {
		if (controllers[0] != null && controllers[1] != null)
			return controllers[1];
		return null;
	}

	public function loop():Void {
		clock.update();
		var now = clock.time;
		delta = now - timestamp;
		timestamp = now;
		uptime += delta;

		if (menu == null && game != null && state == MENU)
			state = PLAY;
		if (state == MENU && menu != null)
			menu.loop();
		else if (state == PLAY && game != null) {
			if (leds == null) {
				if (game.state == PLAY) game.pause();
				return;
			}
			game.loop();
		}
	}

	public function togglePause():Void {
		if (state == PLAY && game != null)
			game.togglePause();
	}

	public function toggleMenu():Void {
		if (state == PLAY && menu != null)
			state = MENU;
		else if (state == MENU && game != null)
			state = PLAY;
	}

	public function handleInput(controllerId:Int, input:Input, ?type:InputEvent = null, ?value:Float = 0):Void {
		if (state == MENU && menu != null)
			menu.handleInput(controllerId, input, type, value);
		else if (state == PLAY && game != null)
			game.handleInput(controllerId, input, type, value);
	}

}
