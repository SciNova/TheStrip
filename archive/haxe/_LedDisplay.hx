import _Game.Colors;

class LedDisplay {
	public var id:Int;
	public var length:Int;
	public var isRing:Bool;
	public var pixels:Array<Int>;

	public function new(length:Int) {
		this.length = length;
		this.pixels = [for (i in 0...length) 0];
	}

	public function clear():Void {
		fill(0);
	}

	public function fill(color:Int):Void {
		for (i in 0...length) {
			pixels[i] = color;
		}
	}

	public function begin():Void {}
	public function update():Void {}
}

@:expose
@:keep
class Strip120 extends LedDisplay {
	public function new() {
		super(120);
		id = 0x10;
		isRing = false;
	}
}

class Strip2M extends LedDisplay {
	public function new() {
		super(120);
		id = 0x11;
		isRing = false;
	}
}

class Strip4M extends LedDisplay {
	public function new() {
		super(120);
		id = 0x12;
		isRing = false;
	}
}

class Strip60 extends LedDisplay {
	public function new() {
		super(60);
		id = 0x13;
		isRing = false;
	}
}

class StripMini extends LedDisplay {
	public function new() {
		super(120);
		id = 0x20;
		isRing = false;
	}
}

class StripMini60 extends LedDisplay {
	public function new() {
		super(60);
		id = 0x21;
		isRing = false;
	}
}

class StripStick extends LedDisplay {
	public function new() {
		super(60);
		id = 0x40;
		isRing = false;
	}
}

class StripStickMini120 extends LedDisplay {
	public function new() {
		super(120);
		id = 0x41;
		isRing = false;
	}
}

class StripRing extends LedDisplay {
	public function new() {
		super(24);
		id = 0x30;
		isRing = true;
	}
}

class StripRing64 extends LedDisplay {
	public function new() {
		super(64);
		id = 0x31;
		isRing = true;
	}
}
