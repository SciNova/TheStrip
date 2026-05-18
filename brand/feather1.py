from PIL import Image, ImageDraw, ImageFilter
import math

def apply_feather(input_path, output_path, feather_radius=50):
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    # Create a mask that's white in the center and fades to black at edges
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Create a gradient from center to edges
    # We'll draw multiple rectangles with increasing alpha
    center_x, center_y = width // 2, height // 2
    max_distance = math.sqrt(center_x**2 + center_y**2)
    
    # Alternative simpler approach: create a white rectangle and blur heavily
    # This creates feathered edges all around
    margin = feather_radius * 2
    draw.rectangle(
        [margin, margin, width - margin, height - margin],
        fill=255
    )
    
    # Apply Gaussian blur to create the feather effect
    mask = mask.filter(ImageFilter.GaussianBlur(radius=feather_radius))
    
    # Composite with black background
    black_bg = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    result = Image.composite(img, black_bg, mask)
    
    result.convert("RGB").save(output_path, quality=95)

if __name__ == "__main__":
    apply_feather("top.orig.jpg", "top.jpg")