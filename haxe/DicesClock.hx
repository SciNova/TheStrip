import App;

// Square class - exactly from Test.hx (4 physical sides)
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
            
            var intensity = 1.0 - (y + maxY) / (2 * maxY);
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

// Dice class for clock - correctly maps 10 digits to 2.5 rotations of a 4-sided square
class Dice extends Square {
    // 10-digit patterns (21 pixels each)
    static var DIGIT_PATTERNS:Array<Array<Int>> = [
        // 0: 0 0000000 00 0 00 0000000 0
        [
            Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green
        ],
        // 1: 0 0000000 00 1 00 0000000 0
        [
            Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Black,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green
        ],
        // 2: 0 0001000 00 0 00 0001000 0
        [
            Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green
        ],
        // 3: 0 0001000 00 1 00 0001000 0
        [
            Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Black,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Green, Colors.Green,
            Colors.Green
        ],
        // 4: 0 0010100 00 0 00 0010100 0
        [
            Colors.Green,
            Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
            Colors.Green
        ],
        // 5: 0 0010100 00 1 00 0010100 0
        [
            Colors.Green,
            Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Black,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Green,
            Colors.Green
        ],
        // 6: 0 0101010 00 0 00 0101010 0
        [
            Colors.Green,
            Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
            Colors.Green
        ],
        // 7: 0 0101010 00 1 00 0101010 0
        [
            Colors.Green,
            Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Black,
            Colors.Green, Colors.Green,
            Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green,
            Colors.Green
        ],
        // 8: 0 1010101 00 0 00 1010101 0
        [
            Colors.Green,
            Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
            Colors.Green, Colors.Green,
            Colors.Green,
            Colors.Green, Colors.Green,
            Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
            Colors.Green
        ],
        // 9: 0 1010101 00 1 00 1010101 0
        [
            Colors.Green,
            Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
            Colors.Green, Colors.Green,
            Colors.Black,
            Colors.Green, Colors.Green,
            Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black, Colors.Green, Colors.Black,
            Colors.Green
        ]
    ];
    
    // Pre-calculated stopping rotations for each digit (0-1 range for 3D)
    // Each digit has a specific square angle it must stop at
    static var DIGIT_STOP_ROTATIONS:Array<Float> = [
        0.0,    // 0: 0° (face 0)
        0.25,   // 1: 90° (face 1)
        0.5,    // 2: 180° (face 2)
        0.75,   // 3: 270° (face 3)
        0.0,    // 4: 0° (face 0, next rotation)
        0.25,   // 5: 90° (face 1, next rotation)
        0.5,    // 6: 180° (face 2, next rotation)
        0.75,   // 7: 270° (face 3, next rotation)
        0.0,    // 8: 0° (face 0, 2nd rotation)
        0.25    // 9: 90° (face 1, 2nd rotation)
    ];
    
    public var currentDigit:Int;
    
    public function new(app:App) {
        // Square has 4 faces, populate with initial patterns
        var facePatterns = [
            DIGIT_PATTERNS[0].copy(),  // Face 0
            DIGIT_PATTERNS[1].copy(),  // Face 1
            DIGIT_PATTERNS[2].copy(),  // Face 2
            DIGIT_PATTERNS[3].copy()   // Face 3
        ];
        
        super(app, Colors.Green, facePatterns, 21, Colors.Black, Colors.Green);
        currentDigit = 0;
        rotation = 0.0;  // Start at digit 0 (0°)
        setSpeed(0);
        
        updateFacePatterns();
    }
    
    private function updateFacePatterns():Void {
        // Update all 4 faces with patterns for current digit and next 3
        for (face in 0...4) {
            var digitForThisFace = (currentDigit + face) % 10;
            var pattern = DIGIT_PATTERNS[digitForThisFace];
            
            // Copy pattern to this face
            for (i in 0...pattern.length) {
                faces[face][i] = pattern[i];
            }
        }
    }
    
    public function setDigit(digit:Int, animate:Bool = true):Void {
        if (digit < 0 || digit > 9) return;
        
        if (digit == currentDigit) return;
        
        var targetRotation = DIGIT_STOP_ROTATIONS[digit];
        
        if (animate) {
            // Calculate the shortest path to target rotation
            var currentRot = rotation;
            var targetRot = targetRotation;
            
            // Calculate difference (considering wrap-around)
            var diff = targetRot - currentRot;
            
            // Handle wrap-around for shortest path
            if (diff > 0.5) diff -= 1.0;
            else if (diff < -0.5) diff += 1.0;
            
            // Use rotateTo for animation (0.3 seconds)
            var targetRotWithOffset = (currentRot + diff) % 1.0;
            if (targetRotWithOffset < 0) targetRotWithOffset += 1.0;
            rotateTo(targetRotWithOffset, 0.3);
        } else {
            rotation = targetRotation;
            setSpeed(0);
        }
        
        currentDigit = digit;
        updateFacePatterns();
    }
    
    override public function loop():Void {
        super.loop();
        
        // When animation is done, force exact square angle
        if (Math.abs(speed) < 0.01) {
            var targetRotation = DIGIT_STOP_ROTATIONS[currentDigit];
            var diff = Math.abs(rotation - targetRotation);
            
            // If not at exact square angle, snap to it
            if (diff > 0.01 && diff < 0.99) {
                rotation = targetRotation;
            }
            
            // Ensure rotation is exactly 0.0, 0.25, 0.5, or 0.75
            var normalized = rotation % 1.0;
            if (normalized < 0) normalized += 1.0;
            
            // Round to nearest 0.25 increment
            var rounded = Math.round(normalized * 4) / 4;
            rotation = rounded;
        }
    }
}

// DicesClock game class - shows MM:SS using 4 dice
@:expose
class DicesClock extends Game {
    var dice:Array<Dice>;
    var lastUpdate:Float;
    var showColon:Bool;
    var digitWidth:Int = 21;
    var smallGap:Int = 7;
    var colonGap:Int = 14;

    public function new(resolution:Int, sound:Dynamic) {
        log("DicesClock");
        super("DiceClock", resolution, sound);
        
        dice = [];
        for (i in 0...4) {
            dice.push(new Dice(this));
        }
        
        lastUpdate = 0;
        showColon = true;
        updateTime();
    }

    function updateTime():Void {
        var now = Date.now();
        var minutes = now.getMinutes();
        var seconds = now.getSeconds();
        
        var minuteTens = Math.floor(minutes / 10);
        var minuteOnes = minutes % 10;
        var secondTens = Math.floor(seconds / 10);
        var secondOnes = seconds % 10;
        
        dice[0].setDigit(minuteTens);
        dice[1].setDigit(minuteOnes);
        dice[2].setDigit(secondTens);
        dice[3].setDigit(secondOnes);
        
        lastUpdate = time;
    }

    override public function loop() {
        super.loop();
        
        if (time - lastUpdate >= 1.0) {
            updateTime();
            showColon = !showColon;
        }
        
        for (d in dice) {
            d.loop();
        }
        
        for (i in 0...resolution) pixels[i] = rgb(Colors.Black);
        
        var totalWidth = (digitWidth * 4) + (smallGap * 2) + colonGap;
        var startX = Math.floor((resolution - totalWidth) / 2);
        var currentX = startX;
        
        renderDice(0, currentX);
        currentX += digitWidth + smallGap;
        
        renderDice(1, currentX);
        currentX += digitWidth;
        
        if (showColon) {
            var colonPos = currentX + Math.floor(colonGap / 2);
            if (colonPos >= 0 && colonPos < resolution) {
                pixels[colonPos] = rgb(Colors.White);
                if (colonPos + 1 < resolution) {
                    pixels[colonPos + 1] = rgb(Colors.White);
                }
            }
        }
        currentX += colonGap;
        
        renderDice(2, currentX);
        currentX += digitWidth + smallGap;
        
        renderDice(3, currentX);
    }
    
    function renderDice(diceIndex:Int, startX:Int):Void {
        var d = dice[diceIndex];
        var dicePixels = d.pixels;
        
        for (i in 0...dicePixels.length) {
            var pixelX = startX + i;
            if (pixelX >= 0 && pixelX < resolution) {
                var colorInt = dicePixels[i];
                if (colorInt != 0x000000) {
                    pixels[pixelX][0] = (colorInt >> 16) & 0xFF;
                    pixels[pixelX][1] = (colorInt >> 8) & 0xFF;
                    pixels[pixelX][2] = colorInt & 0xFF;
                }
            }
        }
    }

    override public function buttonPress(buttonIndex:Int):Void {
        switch (buttonIndex) {
            case 0:
                var now = Date.now();
                var newMinutes = (now.getMinutes() + 1) % 60;
                var minuteTens = Math.floor(newMinutes / 10);
                var minuteOnes = newMinutes % 10;
                
                dice[0].setDigit(minuteTens);
                dice[1].setDigit(minuteOnes);
                log("Advanced minutes by 1");
                
            case 1:
                updateTime();
                log("Reset to current time");
                
            case 2:
                showColon = !showColon;
                log("Colon blinking: " + showColon);
        }
    }

    static public function main() {}
}