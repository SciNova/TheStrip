from PIL import Image, ImageDraw

def generate_side_texture():
	width = 4096
	height = 144
	num_leds = 40
	led_diameter = 77
	
	colors = [
		(255, 0, 0),    # Red
		(255, 127, 0),  # Orange
		(255, 255, 0),  # Yellow
		(0, 255, 0),    # Green
		(0, 255, 255),  # Cyan
		(0, 0, 255),    # Blue
		(139, 0, 255),  # Violet
		(255, 255, 255) # White
	]
	
	img = Image.new("RGB", (width, height), (0, 0, 0))
	draw = ImageDraw.Draw(img)
	
	spacing = width / num_leds
	radius = led_diameter / 2
	center_y = height / 2
	
	for i in range(num_leds):
		center_x = (i * spacing) + (spacing / 2)
		color = colors[i % len(colors)]
		
		left = center_x - radius
		top = center_y - radius
		right = center_x + radius
		bottom = center_y + radius
		
		draw.ellipse([left, top, right, bottom], fill=color)
	
	img.save("side.jpg", quality=95)

if __name__ == "__main__":
	generate_side_texture()
