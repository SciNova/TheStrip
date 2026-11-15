

import _System.System;
import _Input.Input;
import _Input.InputEvent;
import _Input.Button;
import _Input.PcbPanel;

//enum ButtonEventType {
//	Press;
//	Release;
//	Hold;
//	HoldRelease;
//}


enum ButtonState {
	IDLE;
	PRESS;
	HOLD;
	RELEASE;
}

class Button {
	static inline var DEBOUNCE_DURATION:Float = 0.05;
	static inline var HOLD_DURATION:Float = 1.0;

	public var isPressed(get, null):Bool;
	inline function get_isPressed():Bool {
		return state == ButtonState.PRESS || state == ButtonState.HOLD;
	}

	var system:System;
	var action:Action;
	var eventHandler:(Action, InputEvent) -> Void;

	var pressTimestamp:Float = 0;
	var hold:Bool = false;
	var state:ButtonState = ButtonState.IDLE;

	public function new(system:System, action:Action, eventHandler:(Action, InputEvent) -> Void) {
		this.system = system;
		this.action = action;
		this.eventHandler = eventHandler;
	}

	public function process(pinState:Bool):Void {
		var now = system.clock.time;
		if (pinState && state == ButtonState.IDLE) {
			state = ButtonState.PRESS;
			pressTimestamp = now;
			hold = false;
			eventHandler(action, new ButtonEvent(action, ButtonEventType.Press));
		} else if (!pinState && (state == ButtonState.PRESS || state == ButtonState.HOLD)) {
			if (state == ButtonState.HOLD) {
				eventHandler(action, new ButtonEvent(action, ButtonEventType.HoldRelease));
			} else {
				eventHandler(action, new ButtonEvent(action, ButtonEventType.Release));
			}
			state = ButtonState.IDLE;
		} else if (state == ButtonState.PRESS && !hold && (now - pressTimestamp) >= HOLD_DURATION) {
			state = ButtonState.HOLD;
			hold = true;
			eventHandler(action, new ButtonEvent(action, ButtonEventType.Hold));
		}
	}
}





/*class Button {
	static inline var DEBOUNCE_DURATION:Float = 0.05;
	static inline var HOLD_DURATION:Float = 1.0;

	public var isPressed(get, null):Bool;
	inline function get_isPressed():Bool {
		return state == ButtonState.PRESS || state == ButtonState.HOLD;
	}

	var system:System;
	var onPress:Void->Void;
	var onRelease:Void->Void;
	var onHold:Void->Void;
	var onHoldRelease:Void->Void;

	var pressTimestamp:Float = 0;
	var releaseTimestamp:Float = 0;
	var hold:Bool = false;

	var state:ButtonState = ButtonState.IDLE;

	public function new(system:System, onPress:Void->Void, ?onRelease:Void->Void = null,
			?onHold:Void->Void = null, ?onHoldRelease:Void->Void = null) {
		this.system = system;
		this.onPress = onPress;
		this.onRelease = onRelease;
		this.onHold = onHold;
		this.onHoldRelease = onHoldRelease;
	}

	public function update(val:Bool):Void {
		var now = system.clock.time;
		if (val && state == ButtonState.IDLE) {
			state = ButtonState.PRESS;
			pressTimestamp = now;
			hold = false;
			if (onPress != null) onPress();
		} else if (!val && (state == ButtonState.PRESS || state == ButtonState.HOLD)) {
			if (state == ButtonState.HOLD && onHoldRelease != null)
				onHoldRelease();
			else if (state == ButtonState.PRESS && onRelease != null)
				onRelease();
			state = ButtonState.RELEASE;
			releaseTimestamp = now;
			state = ButtonState.IDLE;
		} else if (state == ButtonState.PRESS && !hold && (now - pressTimestamp) >= HOLD_DURATION) {
			state = ButtonState.HOLD;
			hold = true;
			if (onHold != null) onHold();
		}
	}
} */






@:expose
abstract Action(Int) {
	public static inline var A:Action       = cast (1 << 1);
	public static inline var B:Action       = cast (1 << 2);
	public static inline var C:Action       = cast (1 << 3);
	public static inline var D:Action       = cast (1 << 4);

	public static inline var X:Action       = cast (1 << 5);
	public static inline var Y:Action       = cast (1 << 6);
	public static inline var Z:Action       = cast (1 << 7);
	public static inline var W:Action       = cast (1 << 8);

	public static inline var Action:Action = cast (1 << 9);
	public static inline var Action2:Action = cast (1 << 10);

	public static inline var Left:Action    = cast (1 << 11);
	public static inline var Right:Action   = cast (1 << 12);
	public static inline var Up:Action      = cast (1 << 13);
	public static inline var Down:Action    = cast (1 << 14);

	public static inline var Pause:Action   = cast (1 << 30);
	public static inline var Menu:Action    = cast (1 << 31);
}

class InputEvent {
	public var action:Action;

	public function new(action:Action) {
		this.action = action;
	}
}

enum ButtonEventType {
	Press;
	Release;
	Hold;
	HoldRelease;
}


class ButtonEvent extends InputEvent {
	public var type:ButtonEventType;

	public function new(action:Action, type:ButtonEventType) {
		super(action);
		this.type = type;
	}
}

enum EncoderEventType {
	Left;
	Right;
}


class EncoderEvent extends InputEvent {
	public var type:EncoderEventType;

	public function new(action:Action, type:EncoderEventType) {
		super(action);
		this.type = type;
	}
}








//enum InputEvent {
//	ButtonPress;
//	ButtonRelease;
//	ButtonHold;
//	ButtonHoldRelease;
//	EncoderLeft;
//	EncoderRight;
//}



/*


class Controller {
	public var id:Int;
	public var panel:Null<PcbPanel>;
	public var system:System;

	public var buttons:Array<Button>;
	public var buttonPause:Button;
	public var buttonMenu:Button;


public function new(system:System) {
	this.system = system;
	this.id = 0;
	this.panel = null;
	buttons = [];
	buttonPause = new Button(system, () -> system.togglePause());
	buttonMenu  = new Button(system, () -> system.toggleMenu());
	update();
}

	public function update():Void {
		buttons = [];

		if (panel == null)
			return;

		var cid = id;
		for (input in panel.inputs) {
			buttons.push(new Button(system,
				() -> system.handleInput(cid, input, InputEvent.ButtonPress),
				() -> system.handleInput(cid, input, InputEvent.ButtonRelease),
				() -> system.handleInput(cid, input, InputEvent.ButtonHold),
				() -> system.handleInput(cid, input, InputEvent.ButtonHoldRelease)
			));
		}
	}
}


*/

@:expose("Controller")
class Controller {
	public var id:Int;
	public var panel:Null<ControlPanel>;
	public var system:System;
	public var buttons:Array<Button>;

	public function new(system:System) {
		this.system = system;
		this.id = 0;
		this.panel = null;
		buttons = [];
	}

	public function attachPanel(panel:ControlPanel):Void {
		this.panel = panel;
		update();
	}

	public function detachPanel():Void {
		this.panel = null;
		buttons = [];
	}

	function update():Void {
		buttons = [];
		if (panel == null) return;

		var cid = id;
		for (action in panel.inputs) {
			buttons.push(new Button(system, action, (a:Action, event:InputEvent) -> {
				system.handleInput(cid, a, event);
			}));
		}
	}
}









@:expose("ControlPanelModel")
enum ControlPanelModel {
	NONE;
	ABCD;
	ABC;
	A;
	UD;
	LR;
	LRA;
	UDA;
//	EE;
}






@:expose("ControlPanel")
class ControlPanel {
	public var model(default, null):ControlPanelModel;
	public var inputs:Array<Action>;

	public function new() {
		inputs = [];
	}
}

@:expose
class ABCDPanel extends ControlPanel {
	public function new() {
		super();
		model = ABCD;
		inputs = [Action.A, Action.B, Action.C, Action.D];
	}
}

@:expose
class ABCPanel extends ControlPanel {
	public function new() {
		super();
		model = ABC;
		inputs = [Action.A, Action.B, Action.C];
	}
}

@:expose
class APanel extends ControlPanel {
	public function new() {
		super();
		model = A;
		inputs = [Action.Action];
	}
}

@:expose
class UDPanel extends ControlPanel {
	public function new() {
		super();
		model = UD;
		inputs = [Action.Up, Action.Down];
	}
}

@:expose
class LRPanel extends ControlPanel {
	public function new() {
		super();
		model = LR;
		inputs = [Action.Left, Action.Right];
	}
}

@:expose
class LRAPanel extends ControlPanel {
	public function new() {
		super();
		model = LRA;
		inputs = [Action.Left, Action.Right, Action.Action];
	}
}

@:expose
class UDAPanel extends ControlPanel {
	public function new() {
		super();
		model = UDA;
		inputs = [Action.Up, Action.Down, Action.Action];
	}
}

//@:expose
//class EEPanel extends ControlPanel {
//	public function new() {
//		super();
//		model = EE;
//		inputs = [Action.Action, Action.ActionB];
//	}
//}
