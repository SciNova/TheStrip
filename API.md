# Platform API Reference

## Core

### System

```haxe
class System {
    public static inline var RESOLUTION:Int = 120;
    public var resolution:Int;
    public var audio:Audio;
    public var clock:Clock;
    public var strip:Null<Strip>;
    public var controller:Controller;
    public var game:Null<Game>;
    public var menu:Null<Game>;
    public var uptime:Float;
    public var delta:Float;
    public var state:SystemState;

    public function new(?resolution:Int = RESOLUTION):Void;
    public function loop():Void;
    public function togglePause():Void;
    public function toggleMenu():Void;
    public function handleInput(controllerId:Int, input:Input, ?type:InputEvent, ?value:Float):Void;
}
```

The platform operating system. Owns all hardware services and the active game. `loop()` advances the clock, computes `delta` and `uptime`, then dispatches to the active game or menu based on `state`. `handleInput()` routes to the menu or game. `togglePause()` delegates to `game.togglePause()`. `toggleMenu()` swaps between `MENU` and `PLAY` states without pausing the game. On the JS target the constructor creates `SampleAudio`; on all other targets a silent `Audio`.

---

### Game

```haxe
class Game {
    public var pixels:Array<Int>;
    public var name:String;
    public var time:Float;
    public var levelTime:Float;
    public var level:Int;
    public var gameState:GameState;

    public function new(name:String, system:System):Void;
    public function pause():Void;
    public function play():Void;
    public function togglePause():Void;
    public function loop():Void;
    public function defer(handler:Void->Void, seconds:Float):Void;
    public function clear():Void;
    public function setLevel(n:Int):Void;
    public function nextLevel():Void;
    public function buildStage():Void;
    public function playLevel():Void;
    public function handleInput(controllerId:Int, input:Input, ?type:InputEvent, ?value:Float):Void;
}
```

Base class for every game. Owns the 120‑pixel canvas, a per‑game clock (`time`) that stops on pause, and a per‑level timer (`levelTime`). `audio` and `resolution` are read‑only properties delegating to `system`. `gameState` (`PLAY` / `PAUSED`) replaces the old `isPaused` boolean. `loop()` uses `system.delta` and `system.uptime` exclusively. `defer()` schedules a callback via `system.uptime`. `playLevel()` calls `buildStage()`, resets `levelTime`, and unpauses. `handleInput()` is the single reactive entry point replacing the old four button methods.

---

### Shape

```haxe
class Shape {
    public var game:Game;
    public var pixels:Array<Null<Int>>;
    public var alignment:Alignment;
    public var rotation:Float;
    public var viewAngle:Float;

    public function new(game:Game, size:Int, ?alignment:Alignment):Void;
    public function update():Void;
    public function render(position:Float, ?edge:EdgeMode, ?scale:Float):Void;
}
```

The rendering primitive. Owns a fixed‑size pixel buffer where `null` means transparent. Subclasses override `update()` to fill the buffer. `render()` blits non‑null pixels into `game.pixels` at the given strip position, applying `correctLuminance` and the chosen `EdgeMode`. The optional `scale` parameter enables perspective projection for 2D games. `rotation` and `viewAngle` support the rotating‑square projection.

---

### Alignment

```haxe
enum Alignment {
    CENTER;
    FORWARD;
    BACKWARD;
}
```

The three ways a `Shape` positions its pixel buffer relative to the strip position passed to `render()`. `CENTER` places the midpoint at the position. `FORWARD` extends from the position toward larger indices. `BACKWARD` extends from the position toward smaller indices.

---

### EdgeMode

```haxe
enum EdgeMode {
    CLIP;
    MIRROR;
    WRAP;
}
```

Determines how pixels that cross the strip boundaries (0–119) are handled during `render()`. `CLIP` drops out‑of‑bounds pixels. `MIRROR` reflects them at the edges. `WRAP` makes the strip toroidal.

---

### GameState

```haxe
enum GameState {
    PLAY;
    PAUSED;
}
```

Tracks whether the game is running or paused. `Game.gameState` replaces the old `isPaused` boolean. `pause()`, `play()`, and `togglePause()` manage transitions.

---

### SystemState

```haxe
enum SystemState {
    MENU;
    PLAY;
}
```

Tracks whether the system is showing the menu or running a game. `System.state` uses this to decide which game's `loop()` and `handleInput()` to call.

---

### Colors

```haxe
class Colors {
    static var Black:Int; static var White:Int; static var Silver:Int;
    static var Red:Int; static var Green:Int; static var Blue:Int;
    static var Yellow:Int; static var Cyan:Int; static var Magenta:Int;
    static var Orange:Int; static var Purple:Int; static var Pink:Int;
    // ... and many more

    static function correctLuminance(color:Int):Int;
}
```

Pre‑defined colour palette with perceptual luminance correction applied automatically during rendering.

---

### Clock

```haxe
class Clock {
    public var time:Float;
    public function new():Void;
    public function update():Void;
}
```

System timekeeping using `haxe.Timer.stamp()`. `System.loop()` calls `update()` each frame; `Button` reads `time` directly for debounce timing.

---

### Strip

```haxe
class Strip {
    public var game:Game;
    public function new():Void;
    public function begin():Void;
    public function update():Void;
}
```

LED output stub. The platform layer provides the real implementation — DOM‑based or Three.js in the browser, native LED driver on hardware. The stub allows the core to compile and run without a display.

---

## Input

### Input



```haxe
abstract Input(Int) {
    static var ButtonA;
    static var ButtonB;
    static var ButtonC;
    static var ButtonD;
    static var ButtonX;
    static var ButtonY;
    static var ButtonZ;
    static var ButtonW;
    static var Action;
    static var ActionB;

    static var DpadALeft;
    static var DpadARight;
    static var DpadAUp;
    static var DpadADown;

    static var Left;
    static var Right;
    static var Up;
    static var Down;

    static var DpadBLeft;
    static var DpadBRight;
    static var DpadBUp;
    static var DpadBDown;

    static var LeftB;
    static var RightB;
    static var UpB;
    static var DownB;

    static var EncoderA;
    static var EncoderAButton;
    static var EncoderB;
    static var EncoderBButton;
    static var EncoderC;
    static var EncoderCButton;

    static var JoystickAX;
    static var JoystickAY;
    static var JoystickBX;
    static var JoystickBY;

    static var Pause;
    static var Menu;
}
```


Bitmask catalogue of every signal a controller can emit. Constants are powers of two (bits 1–28 for regular inputs, bits 30‑31 for Pause/Menu), so signals can be OR'd together. The D‑pad shorthand aliases share integer values with their full names. Joystick axes are individual signals; the value parameter in handleInput carries the axis position. Pause and Menu are reserved at the platform level and never forwarded to games.

---

### InputEvent

```haxe
enum InputEvent {
    ButtonPress;
    ButtonRelease;
    ButtonHold;
    ButtonHoldRelease;
    EncoderLeft;
    EncoderRight;
}
```

Event type passed through `handleInput`. Joystick axes carry no event type — recognised by the signal ID with the `value` parameter carrying position.

---

### Button

```haxe
class Button {
    static var DEBOUNCE_DURATION:Float;    // 0.05 s
    static var HOLD_DURATION:Float;        // 1.0 s
    public var isPressed(get, null):Bool;

    public function new(system:System, onPress:Void->Void, ?onRelease, ?onHold, ?onHoldRelease):Void;
    public function update(val:Bool):Void;
}
```

Pure logic component. Uses `system.clock.time` for debounce and hold detection. The platform feeds raw boolean signals into `update()`; the appropriate callback fires on state transitions. `isPressed` returns true while the button is down or held.

---

### Controller

```haxe
class Controller {
    public var id:Int;
    public var model:Null<PanelModel>;
    public var system:System;
    public var buttonA:Button;  // through buttonD
    public var buttonPause:Button;
    public var buttonMenu:Button;

    public function new(system:System):Void;
    public function update():Void;
}
```

Owns the `Button` instances. `buttonPause` and `buttonMenu` are permanent, wired to `system.togglePause()` and `system.toggleMenu()`. Panel buttons (`buttonA`–`buttonD`) are created per the `PanelModel` enum when `update()` is called. All panel button callbacks route through `system.handleInput`. The platform feeds raw signals via `controller.buttonX.update(true/false)`.

---

### PanelModel

```haxe
enum PanelModel {
    A;
    LR;
    UD;
    ABC;
    ABCD;
    EE;
}
```

Detachable panel configurations. `A` is a single action button; `LR` and `UD` are two‑button directional panels; `ABC` and `ABCD` are three‑ and four‑button panels; `EE` is a dual encoder panel.

---

### ButtonState

```haxe
enum ButtonState {
    IDLE;
    PRESS;
    HOLD;
    RELEASE;
}
```

Internal state machine for `Button`. Not exposed to games.

---

## Audio

### Sound

```haxe
enum Sound {
    LEVEL_COMPLETE; LEVEL_FAIL; GAME_COMPLETE;
    SHOOT; HIT; MISS; GENERATE_ITEM; TICK; CHECKPOINT;
    SIMONSAYS1; SIMONSAYS2; SIMONSAYS3; SIMONSAYS4;
    SIMONSAYS1_ORIGINAL; SIMONSAYS2_ORIGINAL; SIMONSAYS3_ORIGINAL; SIMONSAYS4_ORIGINAL;
}
```

Enum of all audio events. The JS implementation uses the enum label as the WAV filename.

---

### Audio

```haxe
class Audio {
    public var system:System;
    public function new(system:System):Void;
    public function play(sound:Sound):Void;
}
```

Silent base class. `SampleAudio` (JS target, declared `extern` inside `#if js`) extends it with WAV playback. The platform constructor selects the correct backend at compile time.

---

## 2D Extensions

### World

```haxe
class World {
    public var size:Float;
    public var wraps:Bool;
    public function new(size:Float, wraps:Bool):Void;
}
```

1D world. `size` is in screens (multiplied by `system.resolution` for pixel extent). `wraps` enables toroidal lateral wrapping.

---

### World2D

```haxe
class World2D extends BaseWorld {
    public var width:Float;
    public var depth:Float;
    public var wrapsX:Bool;
    public var wrapsZ:Bool;
    public function new(width:Float, depth:Float, wrapsX:Bool, wrapsZ:Bool):Void;
}
```

2D toroidal world. `width` is the lateral (Z) extent, `depth` the forward (X) extent, both in screens. Wrapping is controlled independently per axis.

---

### BaseWorld

```haxe
class BaseWorld {
    public function new():Void;
}
```

Empty common root for typed `game.world:Null<BaseWorld>`. Not used directly by games.

---

### BasePlayer

```haxe
class BasePlayer {
    public var game:Game;
    public function new(game:Game):Void;
}
```

Minimal player root. Holds only a `game` reference.

---

### BasePlayer1D

```haxe
class BasePlayer1D extends BasePlayer {
    public var location:Float;
    public function distance(location:Float):Float;
}
```

1D player. `location` is the strip coordinate. `distance()` returns the shortest distance respecting `World.wraps`.

---

### BasePlayer2D

```haxe
class BasePlayer2D extends BasePlayer {
    public var x:Float;
    public var z:Float;
    public var rotation:Float;
    public function distance(z:Float, x:Float):Float;
    public function direction(z:Float, x:Float):Float;
}
```

2D player. `x` and `z` are world coordinates; `rotation` is heading (0–1). `distance()` returns Euclidean distance with optional toroidal wrapping. `direction()` returns the absolute world angle (0 = +X, 0.25 = +Z, etc.).

---

### Camera

```haxe
class Camera {
    public var x:Float;
    public var z:Float;
    public var rotation:Float;
    public function new(x:Float, z:Float, rotation:Float):Void;
}
```

Viewpoint for 2D games. Positioned behind the player and used by `Shape2D` to compute view‑relative angles for `Square2D` rendering.

---

### Shape2D

```haxe
class Shape2D extends Shape {
    public var x:Float;
    public var z:Float;
    public function collides(z:Float, x:Float):Bool;
}
```

Adds 2D position and collision detection (point‑vs‑circle with toroidal wrapping) to `Shape`.

---

### Square / Square2D

```haxe
class Square extends Shape {
    public var faces:Array<Array<Null<Int>>>;
    public var invert:Bool;
    public function new(game:Game, faces:Array<Array<Null<Int>>>, ?invert:Bool):Void;
    override public function update():Void;
}

class Square2D extends Shape2D {
    // identical interface, inherits 2D position and collision from Shape2D
}
```

Rotating square projection. `faces` is an array of 1D patterns (at least 1, typically 4 for the four sides of the square). `rotation` (inherited from `Shape`) determines which face is visible; `viewAngle` offsets for camera‑relative viewing. `invert` flips the forward direction by 180° (used when objects face +X into the strip rather than toward the player). Both delegate the projection math to `SquareView.update()`.

---

### SquareView

```haxe
class SquareView {
    public static function update(obj:Dynamic):Void;
}
```

Static projection engine shared by `Square` and `Square2D`. Avoids code duplication forced by Haxe's lack of multiple inheritance. The single acknowledged exception to the "does this thing exist?" test. Not used directly by games.
