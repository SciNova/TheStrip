// TestNode.hx — extensive tests for _Input.hx classes
import _Input.Button;
import _Input.ButtonState;
import _Input.ButtonEventType;
import _Input.ButtonEvent;
import _Input.EncoderEvent;
import _Input.EncoderEventType;
import _Input.InputEvent;
import _Input.Action;
import _Input.Controller;
import _Input.ControlPanel;
import _Input.ControlPanelModel;
import _Input.ABCDPanel;
import _Input.ABCPanel;
import _Input.APanel;
import _Input.UDPanel;
import _Input.LRPanel;
import _Input.LRAPanel;
import _Input.UDAPanel;

// minimal mock for System.clock.time
class MockClock {
	public var time:Float = 0;
	public function new() {}
}

class MockSystem {
	public var clock:MockClock;
	public function new() {
		clock = new MockClock();
	}
}

class TestNode {
	static var sys = new MockSystem();
	static var events:Array<{action:Action, event:InputEvent}> = [];

	static function main() {
		trace("=== Testing Action abstract ===");
		testAction();

		trace("\n=== Testing InputEvent hierarchy ===");
		testEvents();

		trace("\n=== Testing Button ===");
		testButton();

		trace("\n=== Testing Controller ===");
		testController();

		trace("\n=== Testing ControlPanel subclasses ===");
		testPanels();

		trace("\n=== All tests completed ===");
	}

	static function recordEvent(action:Action, event:InputEvent) {
		events.push({action: action, event: event});
	}

	static function clearEvents() {
		events = [];
	}

	// ---------- Action tests ----------
	static function testAction() {
		// check no overlaps
		var vals:Array<Int> = [
			Action.A, Action.B, Action.C, Action.D,
			Action.X, Action.Y, Action.Z, Action.W,
			Action.Action, Action.Action2,
			Action.Left, Action.Right, Action.Up, Action.Down,
			Action.Pause, Action.Menu
		];
		var names = [
			"A","B","C","D","X","Y","Z","W",
			"Action","Action2",
			"Left","Right","Up","Down",
			"Pause","Menu"
		];
		var seen:Map<Int,String> = new Map();
		var ok = true;
		for (i in 0...vals.length) {
			if (seen.exists(vals[i])) {
				trace('ERROR: duplicate bit value ${vals[i]} for ${names[i]} and ${seen[vals[i]]}');
				ok = false;
			} else {
				seen[vals[i]] = names[i];
			}
		}
		if (ok) trace("All Action constants have unique bit values.");

		// check Action.Action vs Action2
		trace('Action.Action = ${Action.Action} (expected bit 9)');
		trace('Action.Action2 = ${Action.Action2} (expected bit 10)');

		// check panels use Action.Action (old name) — this will be noted
		var panelA = new APanel();
		trace('APanel inputs: ${panelA.inputs.map(a -> a)}');
		if (panelA.inputs[0] == Action.Action) {
			trace("APanel uses Action.Action (bit 9) — OK");
		} else {
			trace("WARNING: APanel uses unexpected action");
		}
	}

	// ---------- Event tests ----------
	static function testEvents() {
		var bEvent = new ButtonEvent(Action.A, ButtonEventType.Press);
		trace('ButtonEvent: action=${bEvent.action}, type=${bEvent.type}');
		assert(bEvent.action == Action.A);
		assert(bEvent.type == Press);

		var eEvent = new EncoderEvent(Action.Left, EncoderEventType.Left);
		trace('EncoderEvent: action=${eEvent.action}, type=${eEvent.type}');
		assert(eEvent.action == Action.Left);
		assert(eEvent.type == Left);

		// type checking
		var base:InputEvent = bEvent;
		assert(Std.is(base, ButtonEvent));
		assert(!Std.is(base, EncoderEvent));
		base = eEvent;
		assert(Std.is(base, EncoderEvent));
		trace("InputEvent subclass type checks pass.");
	}

	// ---------- Button tests ----------
	static function testButton() {
		clearEvents();
		sys.clock.time = 0;

		var btn = new Button(sys, Action.Up, function(a,e) recordEvent(a,e));

		// idle, no press
		assert(events.length == 0);
		assert(!btn.isPressed);

		// press
		btn.process(true);
		assert(events.length == 1);
		assert(events[0].action == Action.Up);
		assert(Std.is(events[0].event, ButtonEvent));
		var be:ButtonEvent = cast events[0].event;
		assert(be.type == Press);
		assert(btn.isPressed);
		trace("Press event OK");

		// hold after HOLD_DURATION (1 sec)
		sys.clock.time += 1.0;
		btn.process(true);   // still pressed
		assert(events.length == 2);
		be = cast events[1].event;
		assert(be.type == Hold);
		assert(btn.isPressed);
		trace("Hold event OK");

		// release
		sys.clock.time += 0.1;
		btn.process(false);
		assert(events.length == 3);
		be = cast events[2].event;
		assert(be.type == HoldRelease);
		assert(!btn.isPressed);
		trace("HoldRelease event OK");

		// quick press & release without hold
		clearEvents();
		sys.clock.time += 0.1;
		btn.process(true);
		sys.clock.time += 0.01;
		btn.process(false);
		assert(events.length == 2);
		assert(cast(events[0].event, ButtonEvent).type == Press);
		assert(cast(events[1].event, ButtonEvent).type == Release);
		assert(!btn.isPressed);
		trace("Quick press/release OK");

		// debounce: ignore rapid transitions
		clearEvents();
		sys.clock.time += 0.01;
		btn.process(true);
		sys.clock.time += 0.01;
		btn.process(false);
		assert(events.length == 2); // valid press+release (time > debounce? debounce only blocks if too close? Actually Button doesn't have internal time check for minimum press length, just hold. So it will fire press immediately on true, then release on false. Fine.)
		trace("No debounce blocking yet (as expected)");

		// test isPressed
		clearEvents();
		btn.process(true);
		assert(btn.isPressed);
		btn.process(false);
		assert(!btn.isPressed);
		trace("isPressed works correctly.");
	}

	// ---------- Controller tests ----------
	static function testController() {
		var ctrl = new Controller();
		ctrl.system = sys;   // needed for Button inside attachPanel
		clearEvents();

		// attach APanel
		var aPanel = new APanel();
		ctrl.attachPanel(aPanel);
		assert(ctrl.buttons.length == 1);
		assert(ctrl.panel == aPanel);
		trace("Attached APanel, buttons count = " + ctrl.buttons.length);

		// simulate button press via process on controller's button
		var btn = ctrl.buttons[0];
		sys.clock.time += 0.1;
		// We need a way to receive events from Controller. Controller's Button handlers call system.handleInput.
		// We haven't defined system.handleInput in mock. We'll capture via a simple mock function.
		var capturedEvents:Array<{cid:Int, action:Action, event:InputEvent}> = [];
		ctrl.system = {
			clock: sys.clock,
			handleInput: function(cid, action, event) {
				capturedEvents.push({cid:cid, action:action, event:event});
			}
		};
		// re-attach to rebuild buttons with new system
		ctrl.detachPanel();
		ctrl.attachPanel(aPanel);
		btn = ctrl.buttons[0];
		assert(btn != null);
		btn.process(true);
		assert(capturedEvents.length == 1);
		assert(capturedEvents[0].cid == ctrl.id);
		assert(capturedEvents[0].action == Action.Action);  // APanel uses Action.Action
		trace("Controller routes ButtonEvent correctly to system.handleInput.");

		// detach
		ctrl.detachPanel();
		assert(ctrl.buttons.length == 0);
		assert(ctrl.panel == null);
		trace("Detach clears buttons.");
	}

	// ---------- Panel definitions ----------
	static function testPanels() {
		var models = [
			{ name:"ABCD", panel: new ABCDPanel(), expected:[Action.A, Action.B, Action.C, Action.D] },
			{ name:"ABC", panel: new ABCPanel(), expected:[Action.A, Action.B, Action.C] },
			{ name:"A", panel: new APanel(), expected:[Action.Action] },  // old name
			{ name:"UD", panel: new UDPanel(), expected:[Action.Up, Action.Down] },
			{ name:"LR", panel: new LRPanel(), expected:[Action.Left, Action.Right] },
			{ name:"LRA", panel: new LRAPanel(), expected:[Action.Left, Action.Right, Action.Action] },
			{ name:"UDA", panel: new UDAPanel(), expected:[Action.Up, Action.Down, Action.Action] }
		];

		var allOk = true;
		for (m in models) {
			var inputs = m.panel.inputs;
			var exp = m.expected;
			if (inputs.length != exp.length) {
				trace('ERROR: ${m.name} panel length mismatch. Got ${inputs.length}, expected ${exp.length}');
				allOk = false;
			} else {
				for (i in 0...inputs.length) {
					if (inputs[i] != exp[i]) {
						trace('ERROR: ${m.name} panel index $i: got ${inputs[i]}, expected ${exp[i]}');
						allOk = false;
					}
				}
			}
		}
		if (allOk) {
			trace("All ControlPanel inputs match expected.");
		} else {
			trace("Some panel definitions have errors (check Action.Action vs ActionA?)");
		}
	}

	static function assert(cond:Bool) {
		if (!cond) throw "Assertion failed";
	}
}
