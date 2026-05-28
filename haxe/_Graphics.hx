import _Game.Game;
import _Game.Colors;
import _Game.World2D;

enum Alignment {
	CENTER;
	FORWARD;
	BACKWARD;
}

enum EdgeMode {
	CLIP;
	MIRROR;
	WRAP;
}

class Shape {
	public var game:Game;
	public var pixels:Array<Null<Int>>;
	public var alignment:Alignment;
	public var rotation:Float = 0;
	public var viewAngle:Float = 0;

	public function new(game:Game, size:Int, ?alignment:Alignment = CENTER) {
		this.game = game;
		this.alignment = alignment;
		pixels = [for (i in 0...size) null];
	}

	public function update():Void {}

	public function render(position:Float, ?edge:EdgeMode = CLIP, ?scale:Float = 1):Void {
		if (scale <= 0)
			return;

		var srcLen = pixels.length;
		var scaledLen = Math.ceil(srcLen * scale);
		if (scaledLen % 2 == 0)
			scaledLen++;

		var temp:Array<Null<Int>> = [];

		for (i in 0...scaledLen) {
			var offset = i - (scaledLen - 1) / 2;
			var srcIndex = Std.int(Math.round((srcLen - 1) / 2 + offset / scale));
			if (srcIndex >= 0 && srcIndex < srcLen && pixels[srcIndex] != null)
				temp[i] = Colors.correctLuminance(pixels[srcIndex]);
			else
				temp[i] = null;
		}

		var half = Std.int((scaledLen - 1) / 2);
		var drawStart:Int = switch (alignment) {
			case CENTER: Std.int(Math.round(position)) - half;
			case FORWARD: Std.int(Math.round(position));
			case BACKWARD: Std.int(Math.round(position)) - scaledLen + 1;
		}

		for (i in 0...scaledLen) {
			var px = temp[i];
			if (px == null)
				continue;

			var pixelPos = drawStart + i;

			switch (edge) {
				case CLIP:
					if (pixelPos >= 0 && pixelPos < game.resolution)
						game.pixels[pixelPos] = px;
				case MIRROR:
					while (pixelPos < 0)
						pixelPos = -pixelPos;
					while (pixelPos >= game.resolution)
						pixelPos = 2 * (game.resolution - 1) - pixelPos;
					game.pixels[pixelPos] = px;
				case WRAP:
					pixelPos = ((pixelPos % game.resolution) + game.resolution) % game.resolution;
					game.pixels[pixelPos] = px;
			}
		}
	}
}

class Shape2D extends Shape {
	public var z:Float = 0;
	public var x:Float = 0;

	public function collides(z:Float, x:Float):Bool {
		var radius = pixels.length / 2;
		var dx = this.x - x;
		var dz = this.z - z;
		var world:World2D = cast game.world;
		if (world.wrapsZ) {
			var halfZ = world.width * game.resolution / 2;
			dz = ((dz + halfZ) % (halfZ * 2) + (halfZ * 2)) % (halfZ * 2) - halfZ;
		}
		if (world.wrapsX) {
			var halfX = world.depth * game.resolution / 2;
			dx = ((dx + halfX) % (halfX * 2) + (halfX * 2)) % (halfX * 2) - halfX;
		}
		return (dx * dx + dz * dz) < (radius * radius);
	}
}

@:expose
class SquareView {
	public static function update(obj:Dynamic):Void {
		for (i in 0...obj.pixels.length)
			obj.pixels[i] = null;

		var faceSize = obj.faces[0].length;
		var faceCount = obj.faces.length;

		var eff = obj.invert ? (obj.rotation - obj.viewAngle + 0.5) % 1 : (obj.rotation - obj.viewAngle) % 1;
		if (eff < 0)
			eff += 1;

		var quarterRotation = (eff * faceCount) % 1;
		var angle = quarterRotation * Math.PI / 2;
		var cosA = Math.cos(angle);
		var sinA = Math.sin(angle);

		var length1 = Math.floor(cosA * faceSize);
		var length2 = Math.floor(sinA * faceSize);
		var totalWidth = length1 + length2;
		var startPos = Math.floor((obj.pixels.length - totalWidth) / 2);

		var faceIndex = Math.floor(eff * faceCount) % faceCount;
		var nextFaceIndex = (faceIndex + 1) % faceCount;
		var pattern1 = obj.faces[faceIndex];
		var pattern2 = obj.faces[nextFaceIndex];

		var maxY = faceSize * Math.sqrt(2) / 2;

		for (p in 0...length1) {
			var xFace = (p / length1 - 0.5) * faceSize;
			var y = xFace * sinA;
			var intensity = (y + maxY) / (2 * maxY);
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			var patternPos = Math.floor((p / length1) * faceSize);
			if (patternPos < 0) patternPos = 0;
			if (patternPos >= faceSize) patternPos = faceSize - 1;
			var src = pattern1[patternPos];
			if (src != null) {
				var r = (src >> 16) & 0xFF;
				var g = (src >> 8) & 0xFF;
				var b = src & 0xFF;
				obj.pixels[startPos + p] = (Std.int(r * intensity) << 16) | (Std.int(g * intensity) << 8) | Std.int(b * intensity);
			}
		}

		for (p in 0...length2) {
			var yFace = (p / length2 - 0.5) * faceSize;
			var y = yFace * cosA;
			var rawIntensity = (y + maxY) / (2 * maxY);
			var intensity = 1 - rawIntensity;
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			var patternPos = Math.floor((p / length2) * faceSize);
			if (patternPos < 0) patternPos = 0;
			if (patternPos >= faceSize) patternPos = faceSize - 1;
			var src = pattern2[patternPos];
			if (src != null) {
				var r = (src >> 16) & 0xFF;
				var g = (src >> 8) & 0xFF;
				var b = src & 0xFF;
				obj.pixels[startPos + length1 + p] = (Std.int(r * intensity) << 16) | (Std.int(g * intensity) << 8) | Std.int(b * intensity);
			}
		}
	}
}

class Square extends Shape {
	public var faces:Array<Array<Null<Int>>>;
	public var invert:Bool;

	public function new(game:Game, faces:Array<Array<Null<Int>>>, invert:Bool = false) {
		this.faces = faces;
		this.invert = invert;
		var faceSize = faces[0].length;
		var size = Math.ceil(faceSize * Math.sqrt(2));
		if (size % 2 == 0)
			size++;
		super(game, size, CENTER);
	}

	override public function update():Void {
		SquareView.update(this);
	}
}

class Square2D extends Shape2D {
	public var faces:Array<Array<Null<Int>>>;
	public var invert:Bool;

	public function new(game:Game, faces:Array<Array<Null<Int>>>, invert:Bool = false) {
		this.faces = faces;
		this.invert = invert;
		var faceSize = faces[0].length;
		var size = Math.ceil(faceSize * Math.sqrt(2));
		if (size % 2 == 0)
			size++;
		super(game, size, CENTER);
	}

	override public function update():Void {
		SquareView.update(this);
	}
}
