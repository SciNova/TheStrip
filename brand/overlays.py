from PIL import Image

def generate_overlays():
	top_path = "top.jpg"
	logo_path = "logo.png"
	
	background = Image.open(top_path).convert("RGB")
	logo = Image.open(logo_path).convert("RGBA")
	
	# Settings for a balanced look
	logo_display_size = (180, 180)
	margin = 80 
	
	logo = logo.resize(logo_display_size, Image.LANCZOS)
	
	filenames = ["S1.jpg", "S2.jpg", "S3.jpg"]
	
	for name in filenames:
		final_image = background.copy()
		# logo is pasted at (80, 80) which is the margin from top and left
		final_image.paste(logo, (margin, margin), logo)
		final_image.save(name, quality=95)

if __name__ == "__main__":
	generate_overlays()
