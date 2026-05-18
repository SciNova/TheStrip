from PIL import Image, ImageDraw, ImageFilter
import math



def apply_feather(input_path, output_path, feather_radius=50):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Create a gradient mask using radial gradient
    mask = Image.new("L", (width, height), 0)
    
    # Create radial gradient
    for y in range(height):
        for x in range(width):
            # Distance from center (normalized)
            dist_x = abs(x - width/2) / (width/2)
            dist_y = abs(y - height/2) / (height/2)
            distance = math.sqrt(dist_x**2 + dist_y**2)
            
            # Create smooth falloff
            alpha = max(0, min(255, int(255 * (1 - distance))))
            mask.putpixel((x, y), alpha)
    
    # Apply some blur to smooth the gradient
    mask = mask.filter(ImageFilter.GaussianBlur(radius=feather_radius/2))
    
    # Composite with black background
    black_bg = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    result = Image.composite(img, black_bg, mask)
    
    result.convert("RGB").save(output_path, quality=95)


if __name__ == "__main__":
    apply_feather("top.jpg", "topf.jpg")