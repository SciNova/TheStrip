import math


class LFO:
	def __init__(self, audio, waveform=Waveform.SINUS, frequency=1.0):
		self.audio = audio
		self.waveform = waveform
		self.frequency = frequency
		self.timestamp = self.audio.timestamp

	def render(self):
		time = self.audio.timestamp - self.timestamp
		phase = (time * self.frequency) % 1.0
		if phase < 0:
			phase += 1.0

		if self.waveform == Waveform.SINUS:
			return math.sin(2 * math.pi * phase)
		elif self.waveform == Waveform.SQUARE:
			return 1.0 if phase < 0.5 else -1.0
		elif self.waveform == Waveform.SAWTOOTH:
			return 2 * phase - 1.0
		elif self.waveform == Waveform.REVERSE_SAWTOOTH:
			return 1.0 - 2 * phase
		elif self.waveform == Waveform.NOISE:
			step = math.floor(time * self.frequency)
			n = math.sin(step * 12.9898) * 43758.5453
			return 2.0 * (n - math.floor(n)) - 1.0
		return 0.0
