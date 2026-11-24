import math
from enum import Enum

from system import balance_colors

class Alignment(Enum):
	CENTER = 0
	FORWARD = 1
	BACKWARD = 2

class EdgeMode(Enum):
	CLIP = 0
	MIRROR = 1
	WRAP = 2

class Shape:
	def __init__(self, game, size, alignment=Alignment.CENTER):
		self.game = game
		self.alignment = alignment
		self.pixels = [None] * size
		self.rotation = 0.0
		self.view_angle = 0.0

	def update(self):
		pass

	def render(self, position, edge=EdgeMode.CLIP, scale=1.0):
		if scale <= 0:
			return

		src_len = len(self.pixels)
		scaled_len = math.ceil(src_len * scale)
		if scaled_len % 2 == 0:
			scaled_len += 1

		temp = [None] * scaled_len
		for i in range(scaled_len):
			offset = i - (scaled_len - 1) / 2.0
			src_index = int(round((src_len - 1) / 2.0 + offset / scale))
			if 0 <= src_index < src_len and self.pixels[src_index] is not None:
				temp[i] = balance_colors(self.pixels[src_index])

		half = (scaled_len - 1) // 2
		if self.alignment == Alignment.CENTER:
			draw_start = int(round(position)) - half
		elif self.alignment == Alignment.FORWARD:
			draw_start = int(round(position))
		else:
			draw_start = int(round(position)) - scaled_len + 1

		for i, px in enumerate(temp):
			if px is None:
				continue
			pixel_pos = draw_start + i

			if edge == EdgeMode.CLIP:
				if 0 <= pixel_pos < self.game.resolution:
					self.game.pixels[pixel_pos] = px
			elif edge == EdgeMode.MIRROR:
				while pixel_pos < 0:
					pixel_pos = -pixel_pos
				while pixel_pos >= self.game.resolution:
					pixel_pos = 2 * (self.game.resolution - 1) - pixel_pos
				self.game.pixels[pixel_pos] = px
			else:
				pixel_pos = pixel_pos % self.game.resolution
				self.game.pixels[pixel_pos] = px


class Shape2D(Shape):
	def __init__(self, game, size, alignment=Alignment.CENTER):
		super().__init__(game, size, alignment)
		self.z = 0.0
		self.x = 0.0

	def collides(self, z, x):
		radius = len(self.pixels) / 2.0
		dx = self.x - x
		dz = self.z - z
		world = self.game.world
		if world.wraps_z:
			half_z = world.width * self.game.resolution / 2.0
			dz = ((dz + half_z) % (2 * half_z)) - half_z
		if world.wraps_x:
			half_x = world.depth * self.game.resolution / 2.0
			dx = ((dx + half_x) % (2 * half_x)) - half_x
		return (dx * dx + dz * dz) < (radius * radius)


class SquareView:
	@staticmethod
	def update(obj):
		for i in range(len(obj.pixels)):
			obj.pixels[i] = None

		face_size = len(obj.faces[0])
		face_count = len(obj.faces)

		eff = obj.rotation - obj.view_angle
		if obj.invert:
			eff += 0.5
		eff = eff % 1.0
		if eff < 0:
			eff += 1.0

		quarter_rotation = (eff * face_count) % 1.0
		angle = quarter_rotation * math.pi / 2.0
		cos_a = math.cos(angle)
		sin_a = math.sin(angle)

		length1 = int(math.floor(cos_a * face_size))
		length2 = int(math.floor(sin_a * face_size))
		total_width = length1 + length2
		start_pos = (len(obj.pixels) - total_width) // 2

		face_index = int(eff * face_count) % face_count
		next_face_index = (face_index + 1) % face_count
		pattern1 = obj.faces[face_index]
		pattern2 = obj.faces[next_face_index]

		max_y = face_size * math.sqrt(2) / 2.0

		if length1 > 0:
			for p in range(length1):
				x_face = (p / length1 - 0.5) * face_size
				y = x_face * sin_a
				intensity = (y + max_y) / (2.0 * max_y)
				if intensity < 0: intensity = 0
				if intensity > 1: intensity = 1
				pattern_pos = min(face_size - 1, max(0, int(p / length1 * face_size)))
				src = pattern1[pattern_pos]
				if src is not None:
					r = (src >> 16) & 0xFF
					g = (src >> 8) & 0xFF
					b = src & 0xFF
					obj.pixels[start_pos + p] = (int(r * intensity) << 16) | (int(g * intensity) << 8) | int(b * intensity)

		if length2 > 0:
			for p in range(length2):
				y_face = (p / length2 - 0.5) * face_size
				y = y_face * cos_a
				raw_intensity = (y + max_y) / (2.0 * max_y)
				intensity = 1.0 - raw_intensity
				if intensity < 0: intensity = 0
				if intensity > 1: intensity = 1
				pattern_pos = min(face_size - 1, max(0, int(p / length2 * face_size)))
				src = pattern2[pattern_pos]
				if src is not None:
					r = (src >> 16) & 0xFF
					g = (src >> 8) & 0xFF
					b = src & 0xFF
					obj.pixels[start_pos + length1 + p] = (int(r * intensity) << 16) | (int(g * intensity) << 8) | int(b * intensity)


class Square(Shape):
	def __init__(self, game, faces, invert=False):
		self.faces = faces
		self.invert = invert
		face_size = len(faces[0])
		size = math.ceil(face_size * math.sqrt(2))
		if size % 2 == 0:
			size += 1
		super().__init__(game, size, Alignment.CENTER)

	def update(self):
		SquareView.update(self)


class Square2D(Shape2D):
	def __init__(self, game, faces, invert=False):
		self.faces = faces
		self.invert = invert
		face_size = len(faces[0])
		size = math.ceil(face_size * math.sqrt(2))
		if size % 2 == 0:
			size += 1
		super().__init__(game, size, Alignment.CENTER)

	def update(self):
		SquareView.update(self)


class Camera:
	def __init__(self, x=0.0, z=0.0, rotation=0.0):
		self.x = x
		self.z = z
		self.rotation = rotation


class BasePlayer:
	def __init__(self, game):
		self.game = game


class BasePlayer1D(BasePlayer):
	def __init__(self, game):
		super().__init__(game)
		self.location = 0.0

	def distance(self, location):
		world = self.game.world
		d = self.location - location
		if world.wraps:
			half = world.size * self.game.resolution / 2.0
			d = ((d + half) % (2 * half)) - half
		return abs(d)


class BasePlayer2D(BasePlayer):
	def __init__(self, game):
		super().__init__(game)
		self.z = 0.0
		self.x = 0.0
		self.rotation = 0.0

	def distance(self, z, x):
		world = self.game.world
		dx = self.x - x
		dz = self.z - z
		if world.wraps_z:
			half_z = world.width * self.game.resolution / 2.0
			dz = ((dz + half_z) % (2 * half_z)) - half_z
		if world.wraps_x:
			half_x = world.depth * self.game.resolution / 2.0
			dx = ((dx + half_x) % (2 * half_x)) - half_x
		return math.sqrt(dx * dx + dz * dz)

	def direction(self, z, x):
		dx = x - self.x
		dz = z - self.z
		angle = math.atan2(dz, dx)
		return (angle / (2 * math.pi) + 1) % 1


class BaseWorld:
	def __init__(self):
		pass


class World(BaseWorld):
	def __init__(self, size, wraps):
		super().__init__()
		self.size = size
		self.wraps = wraps


class World2D(BaseWorld):
	def __init__(self, width, depth, wraps_x, wraps_z):
		super().__init__()
		self.width = width
		self.depth = depth
		self.wraps_x = wraps_x
		self.wraps_z = wraps_z
