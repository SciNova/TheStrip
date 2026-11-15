# Platform API Reference

This is one API, not three. The same classes, fields and functions exist in
JavaScript (`js/`), Python (`python/`) and C++ (`cpp/`), kept in sync by hand
on every change. Names below are given in camelCase (as JS and C++ spell
them); Python spells the same names in snake_case (`handleInput` →
`handle_input`, `nextLevel` → `next_level`) — same name, same shape, same
behaviour either way. Signatures below are written in a neutral, language-
agnostic notation, not any one language's actual syntax.

## Core

### System

```
System
    clock: Clock
    audio: Audio
    strip: Strip
    game: Game | none
    uptime: number
    state: SystemState

    loop()
    togglePause()
    toggleMenu()
    handleCommand(padId: number, event: InputEvent)
```

The owner of the hardware services and the currently active game. `loop()`
advances the clock, and while `state` is `GAME` and the game is playing,
calls the game's own `loop()`. `togglePause()` delegates to the active
game's `togglePause()`. `toggleMenu()` switches `state` between `GAME` and
`MENU`. `handleCommand()` is the system's own input entry point — it handles
power/menu/pause presses itself, and forwards anything else to the active
game's `handleInput()`.

### SystemState

```
SystemState
    STANDBY
    MENU
    GAME
    POWERSAVE
```

### Game

```
Game
    system: System
    pixels: Array<number>
    resolution: number
    audio: Audio
    name: string
    time: number
    levelTime: number
    level: number
    state: GameState

    loop()
    handleInput(padId: number, event: InputEvent)
    buildStage()
    pause()
    play()
    togglePause()
    delay(seconds: number)
    clear()
    setLevel(n: number)
    nextLevel()
    playLevel()
```

The base class every game extends. `pixels` is the same array as
`system.strip.pixels`. `loop()` advances `time`/`levelTime` and counts down
any pending delay; every game overrides it and calls the base version
first. `handleInput()` is the game's own reactive entry point; the base
version does nothing. `buildStage()` (re)builds whatever a level needs; the
base version does nothing, games with levels override it. `delay()` pauses
the game's own logic for a duration without changing `state`. `playLevel()`
calls `buildStage()` if the game has one, resets `levelTime`, and resumes
play.

A game that also declares a `sounds` enum (see **Sound**, below) owns a set
of sounds of its own, in addition to the system's; nothing is required of a
game that doesn't declare one.

### GameState

```
GameState
    PLAY
    PAUSED
    COMPLETED
```

---

## Input

### Command

```
Command
    NONE
    A
    A_PRESS
    A_RELEASE
    B
    B_PRESS
    B_RELEASE
    C
    C_PRESS
    C_RELEASE
    D
    D_PRESS
    D_RELEASE
    X
    X_PRESS
    X_RELEASE
    Y
    Y_PRESS
    Y_RELEASE
    Z
    Z_PRESS
    Z_RELEASE
    W
    W_PRESS
    W_RELEASE
    FIRE
    FIRE_PRESS
    FIRE_RELEASE
    FIRE2
    FIRE2_PRESS
    FIRE2_RELEASE
    UP
    UP_PRESS
    UP_RELEASE
    DOWN
    DOWN_PRESS
    DOWN_RELEASE
    LEFT
    LEFT_PRESS
    LEFT_RELEASE
    RIGHT
    RIGHT_PRESS
    RIGHT_RELEASE
    ENCODER_LEFT
    ENCODER_RIGHT
    ENCODER2_LEFT
    ENCODER2_RIGHT
    POWER_SHORT_PRESS
    POWER_LONG_PRESS
    MENU_SHORT_PRESS
    MENU_LONG_PRESS
    PAUSE_SHORT_PRESS
    PAUSE_LONG_PRESS
    BT_SHORT_PRESS
    BT_LONG_PRESS

isGameButtonPress(command: Command): boolean
```

The complete catalogue of input signals a game can receive. Every
button-like command exists as a `_PRESS`/`_RELEASE` pair; the bare name
(e.g. `Command.A`) is an alias for its `_PRESS` value. `isGameButtonPress()`
tests whether a command is one of the ordinary gameplay button presses, as
opposed to an encoder tick or a system-reserved power/menu/pause/BT press.

### InputEvent

```
InputEvent
    command: Command
    value: number
```

A single input occurrence. `value` is used only by analogue signals; `0`
otherwise.

### Button

```
Button
    state: ButtonState
    pressTimestamp: number
    held: boolean

    process(value: boolean, now: number): ButtonEvent | none
```

Debounced press/hold/release tracking for one physical button. Call
`process()` each tick with the raw signal and the current time; it returns
a `ButtonEvent` on a state transition, or nothing.

### ButtonState

```
ButtonState
    IDLE
    PRESS
    HOLD
```

### ButtonEvent

```
ButtonEvent
    PRESS
    RELEASE
    HOLD
    HOLDRELEASE
```

### Encoder

```
Encoder
    state: EncoderState
    rawQuadState: number
    previousQuadState: number
    clkTimestamp: number
    inputChangeTimestamp: number

    update(clk: boolean, direction: boolean, now: number): EncoderEvent | none
```

Quadrature decoding for one rotary encoder. Call `update()` each tick with
the two raw signal lines and the current time; it returns an `EncoderEvent`
on a detent, or nothing.

### EncoderState

```
EncoderState
    IDLE
    DEBOUNCING
```

### EncoderEvent

```
EncoderEvent
    LEFT
    RIGHT
```

### PcbPanelModel

```
PcbPanelModel
    NONE
    F
    UD
    LR
    LRF
    UDF
    LRUDFF
    ABC
    ABCD
```

The set of physical button-panel variants a `ControlPad` can have attached.
`F` is a single fire button. `UD`/`LR` are two-button direction-only panels.
`LRF`/`UDF` add a fire button to one direction pair. `LRUDFF` has both
direction pairs and two fire buttons. `ABC`/`ABCD` are three- and
four-button colour panels, built to match a specific game's own colour
language (`Stack`'s three colours, `SimonSays`'s four) rather than being
generic.

### ControlPad

```
ControlPad
    system: System
    id: number
    panel: PcbPanel | none
    buttons: Array<Button>
    pressedState: Array<boolean>
    directionButtons: Array<Button>
    directionPressedState: Array<boolean>
    namedButtons: Array<Button>
    namedPressedState: Array<boolean>

    update()
    setButtonPressed(index: number, pressed: boolean)
    setDirectionPressed(index: number, pressed: boolean)
    setNamedButtonPressed(index: number, pressed: boolean)
    poll(now: number)
```

One player's full set of inputs. `directionButtons`/`namedButtons` are
always live, independent of whichever `panel` (if any) is attached — a
panel only ever decides which physical buttons exist to click or wire on
real hardware, never which `Command`s a game can receive;
`UP`/`DOWN`/`LEFT`/`RIGHT`/`FIRE`/`FIRE2` and `A`/`B`/`C`/`D` always work.
`poll()` reads every live button and encoder and forwards the resulting
events to `system.handleCommand()`.

---

## Audio

### Sound

```
Sound
    LEVEL_COMPLETE
    LEVEL_FAIL
    GAME_COMPLETE
    SHOOT
    HIT
    MISS
    GENERATE_ITEM
    TICK
    CHECKPOINT
    SIMONSAYS1
    SIMONSAYS2
    SIMONSAYS3
    SIMONSAYS4
    SIMONSAYS1_ORIGINAL
    SIMONSAYS2_ORIGINAL
    SIMONSAYS3_ORIGINAL
    SIMONSAYS4_ORIGINAL
```

The system's own shared vocabulary of sound events. Every game gets these
for free.

A game with sounds of its own declares a `sounds` enum on its own class,
following the same convention `Sound` itself uses — name the base variant
plainly, number the rest (`CROAK`, `CROAK2`, `CROAK3`). Both are played
through the identical call below; there is no difference between a system
sound and a game's own sound from the game's point of view.

### Audio

```
Audio
    play(sound: Sound | string)
```

The base class does nothing. The browser simulator's implementation
(`SampleAudio`) plays the matching `.wav` file, loading the system set
always and a game's own `sounds` set (if it declares one) once that game is
active.

---

## Colours

### Colors

```
Colors
    RED
    ROYAL_BLUE
    DARK_SLATE_GRAY
    ... (one entry per official CSS colour)
```

One name per official CSS colour (`js/color.js`, mirrored in
`system.py`/`system.h`), plus a small handful of aliases (`OFF`, and the
fruit names `Slots` uses) for names CSS doesn't have. A game should reach
for the closest named colour here rather than a literal hex value.

### Colour functions

```
hsvToRgb(h: number, s: number, v: number): number
balanceColors(color: number): number
correctGamma(color: number): number
```

`hsvToRgb()` converts a hue/saturation/value colour to packed RGB.
`balanceColors()`/`correctGamma()` are hooks for colour correction applied
during rendering; both are currently no-ops.

---

## Timing

### Clock

```
Clock
    time: number
    timestamp: number
    delta: number

    update()
```

`update()` advances `time`/`delta` from the current wall-clock time. Called
once per frame by `System`.

### Strip

```
Strip
    pixels: Array<number>
    length: number

    clear()
```

`clear()` sets every pixel to off.

---

## Graphics

### Shape

```
Shape
    game: Game
    pixels: Array<number | none>
    alignment: Alignment
    rotation: number
    viewAngle: number

    update()
    render(position: number, edge: EdgeMode, scale: number)
```

The rendering primitive: a fixed-size buffer of colours (or none, meaning
transparent), blitted onto `game.pixels` at a given position. `update()`
fills `pixels`; the base version does nothing, every subclass overrides it.
`render()` blits non-empty pixels into `game.pixels` at `position`,
resampling for `scale` and handling the strip's boundaries per `edge`.

### Alignment

```
Alignment
    CENTER
    FORWARD
    BACKWARD
```

How a `Shape`'s buffer sits relative to the position passed to `render()`.
`CENTER` centres it on the position. `FORWARD` extends toward higher
indices. `BACKWARD` extends toward lower indices.

### EdgeMode

```
EdgeMode
    CLIP
    MIRROR
    WRAP
```

How `render()` handles pixels that fall outside the strip. `CLIP` drops
them. `MIRROR` reflects them back in. `WRAP` treats the strip as toroidal.

### Shape2D

```
Shape2D extends Shape
    x: number
    z: number

    collides(z: number, x: number): boolean
```

A `Shape` with a position in a 2D world. `collides()` is a circular
collision test against the shape's own size, respecting the game's
`World2D` wrapping.

### Square / Square2D

```
Square extends Shape
    faces: Array<Array<number | none>>
    invert: boolean

    update()

Square2D extends Shape2D
    faces: Array<Array<number | none>>
    invert: boolean

    update()
```

A shape that looks like a rotating cube's face, used for dice, clock digits
and similar. Built from a set of `faces` (one 1D pattern per face);
`rotation` (inherited from `Shape`) selects which face is showing, blended
with its neighbour as it turns. `invert` flips the forward direction by
180°. `Square2D` additionally carries a 2D position via `Shape2D`. Both
delegate their `update()` to `SquareView`.

### SquareView

```
SquareView
    update(obj: Square | Square2D)    [static]
```

The shared projection math behind `Square`/`Square2D`. Not used directly by
games.

### Camera

```
Camera
    x: number
    z: number
    rotation: number
```

A viewpoint for 2D games, positioned behind the player and used to compute
view-relative angles for `Square2D` rendering.

### BaseWorld / World / World2D

```
BaseWorld

World extends BaseWorld
    size: number
    wraps: boolean

World2D extends BaseWorld
    width: number
    depth: number
    wrapsX: boolean
    wrapsZ: boolean
```

`BaseWorld` is the empty common root for `game.world`. `World` is a 1D
world (`size` in screens). `World2D` is a 2D toroidal world (`width`/`depth`
in screens, wrapping controlled independently per axis).

### BasePlayer / BasePlayer1D / BasePlayer2D

```
BasePlayer
    game: Game

BasePlayer1D extends BasePlayer
    location: number

    distance(location: number): number

BasePlayer2D extends BasePlayer
    x: number
    z: number
    rotation: number

    distance(z: number, x: number): number
    direction(z: number, x: number): number
```

`BasePlayer` is the empty common root. `BasePlayer1D.distance()` returns
the shortest distance to `location`, respecting `World.wraps`.
`BasePlayer2D.distance()` returns Euclidean distance respecting
`World2D`'s wrapping; `direction()` returns the absolute world angle (0–1,
0 = +X, 0.25 = +Z, and so on).
