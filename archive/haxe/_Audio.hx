import _System;
import _Game;

enum Sound {
	LEVEL_COMPLETE;
	LEVEL_FAIL;
	GAME_COMPLETE;
	SHOOT;
	HIT;
	MISS;
	GENERATE_ITEM;
	TICK;
	CHECKPOINT;
	SIMONSAYS1;
	SIMONSAYS2;
	SIMONSAYS3;
	SIMONSAYS4;
	SIMONSAYS1_ORIGINAL;
	SIMONSAYS2_ORIGINAL;
	SIMONSAYS3_ORIGINAL;
	SIMONSAYS4_ORIGINAL;
}

class Audio {
	public var system:System;
	public function new(system:System):Void {
		this.system = system;
	}
	public function play(sound:Sound):Void {}
}

extern class SampleAudio extends Audio {
	public function new(system:System):Void;
	override public function play(sound:Sound):Void;
}
