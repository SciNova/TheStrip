import App;

class Square extends RotatingShape {
	public var pixels:Array<Int>;
	public var renderSize:Int;
	
	private var color:Int;
	private var faces:Array<Array<Int>>;
	private var background:Int;
	private var foreground:Int;
	
	public function new(app:App, color:Int, faces:Array<Array<Int>>, renderSize:Int, 
					?background:Int, ?foreground:Int) {
		super(app);

		this.color = color;
		this.faces = faces;
		this.renderSize = (renderSize % 2 == 0) ? renderSize + 1 : renderSize;
		this.background = (background != null) ? background : color;
		this.foreground = foreground;

		pixels = [for (i in 0...this.renderSize) 0x000000];
	}
	
	public function render():Void {
		for (i in 0...renderSize)
			pixels[i] = color;
		if (faces.length == 0) {
			renderSolid();
			return;
		}

		var faceIndex = Math.floor(rotation * faces.length) % faces.length;
		var pattern = faces[faceIndex];
		var patternSize = pattern.length;
		
		var quarterRotation = (rotation * 4) % 1.0;
		var angle = quarterRotation * Math.PI * 0.5;
		var cosA = Math.cos(angle);
		var sinA = Math.sin(angle);
		
		var S = renderSize / Math.sqrt(2);
		var length1 = Math.floor(cosA * S);
		var length2 = Math.floor(sinA * S);
		var currentWidth = length1 + length2;
		if (currentWidth % 2 == 0) currentWidth += 1;
		
		var startPos = Math.floor((renderSize - currentWidth) / 2);
		var maxY = renderSize / 2;
		
		for (p in 0...length1) {
			var t = p / length1;
			var x = (t - 0.5) * S;
			var y = x * sinA;
			
			var intensity = (y + maxY) / (2 * maxY);
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			
			var patternIndex = Math.floor(t * patternSize) % patternSize;
			var patternColor = pattern[patternIndex];
			var finalColor = getFinalColor(patternColor);
			
			if (finalColor != null) {
				var baseRgb = rgb(finalColor);
				var r = Math.floor(baseRgb[0] * intensity);
				var g = Math.floor(baseRgb[1] * intensity);
				var b = Math.floor(baseRgb[2] * intensity);
				var outputIndex = startPos + p;
				if (outputIndex >= 0 && outputIndex < renderSize) {
					pixels[outputIndex] = (r << 16) | (g << 8) | b;
				}
			}
		}
		
		for (p in 0...length2) {
			var t = p / length2;
			var yVal = (t - 0.5) * S;
			var y = yVal * cosA;
			
			var intensity = (y + maxY) / (2 * maxY);
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			
			var patternIndex = Math.floor(t * patternSize) % patternSize;
			var patternColor = pattern[patternIndex];
			var finalColor = getFinalColor(patternColor);
			
			if (finalColor != null) {
				var baseRgb = rgb(finalColor);
				var r = Math.floor(baseRgb[0] * intensity);
				var g = Math.floor(baseRgb[1] * intensity);
				var b = Math.floor(baseRgb[2] * intensity);
				var outputIndex = startPos + length1 + p;
				if (outputIndex >= 0 && outputIndex < renderSize) {
					pixels[outputIndex] = (r << 16) | (g << 8) | b;
				}
			}
		}
	}
	
	private function renderSolid():Void {
		var quarterRotation = (rotation * 4) % 1.0;
		var angle = quarterRotation * Math.PI * 0.5;
		var cosA = Math.cos(angle);
		var sinA = Math.sin(angle);
		
		var S = renderSize / Math.sqrt(2);
		var length1 = Math.floor(cosA * S);
		var length2 = Math.floor(sinA * S);
		var currentWidth = length1 + length2;
		if (currentWidth % 2 == 0) currentWidth += 1;
		
		var startPos = Math.floor((renderSize - currentWidth) / 2);
		var maxY = renderSize / 2;
		var baseRgb = rgb(color);
		
		for (p in 0...length1) {
			var t = p / length1;
			var x = (t - 0.5) * S;
			var y = x * sinA;
			var intensity = (y + maxY) / (2 * maxY);
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			
			var r = Math.floor(baseRgb[0] * intensity);
			var g = Math.floor(baseRgb[1] * intensity);
			var b = Math.floor(baseRgb[2] * intensity);
			var outputIndex = startPos + p;
			if (outputIndex >= 0 && outputIndex < renderSize) {
				pixels[outputIndex] = (r << 16) | (g << 8) | b;
			}
		}
		
		for (p in 0...length2) {
			var t = p / length2;
			var yVal = (t - 0.5) * S;
			var y = yVal * cosA;
			var intensity = 1.0 - (y + maxY) / (2 * maxY);
			if (intensity < 0) intensity = 0;
			if (intensity > 1) intensity = 1;
			
			var r = Math.floor(baseRgb[0] * intensity);
			var g = Math.floor(baseRgb[1] * intensity);
			var b = Math.floor(baseRgb[2] * intensity);
			var outputIndex = startPos + length1 + p;
			if (outputIndex >= 0 && outputIndex < renderSize) {
				pixels[outputIndex] = (r << 16) | (g << 8) | b;
			}
		}
	}
	
	private function getFinalColor(patternColor:Int):Int {
		if (patternColor == 0) {
			return background;
		} else if (foreground != 0) {
			return foreground;
		} else {
			return patternColor;
		}
	}
	
	override public function loop():Void {
		super.loop();
		render();
	}
}

@:expose
class Test extends App {
	var square:Square;
	var centerPosition:Int;

	public function new(sound:Dynamic, resolution:Int) {
		super(sound, resolution);
		square = new Square(this, Colors.White, [], 60);
		centerPosition = Math.floor(resolution / 2);
	}

	override public function loop():Void {
		super.loop();

		for (i in 0...resolution)
			pixels[i] = rgb(Colors.DarkGreen);

		square.loop();
		var squarePixels = square.pixels;
		var squareSize = squarePixels.length;
		var squareCenter = Math.floor(squareSize / 2);
		var startPos = centerPosition - squareCenter;
		
		for (i in 0...squareSize) {
			var stripPos = startPos + i;
			if (stripPos >= 0 && stripPos < resolution) {
				var colorInt = squarePixels[i];
				if (colorInt != 0x000000) {
					pixels[stripPos][0] = (colorInt >> 16) & 0xFF;
					pixels[stripPos][1] = (colorInt >> 8) & 0xFF;
					pixels[stripPos][2] = colorInt & 0xFF;
				}
			}
		}
	}

	override public function buttonPress(buttonIndex:Int):Void {
		switch (buttonIndex) {
			case 0:
				square.setSpeed(0.5);
			case 1:
				square.stop();
			case 2:
				square.setSpeed(-0.5);
		}
	}

	static public function main() {}
}
