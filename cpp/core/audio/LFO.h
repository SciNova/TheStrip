class LFO {
public:
	Audio* audio;
	Waveform waveform;
	float frequency;
	float timestamp;

	LFO(Audio* audio, Waveform waveform = Waveform::SINUS, float frequency = 1.0) {
		this->audio = audio;
		this->waveform = waveform;
		this->frequency = frequency;
		timestamp = audio->timestamp;
	}

	float render() {
		float time = audio->timestamp - timestamp;
		float phase = fmod(time * frequency, 1.0);
		if (phase < 0) {
			phase += 1.0;
		}

		switch (waveform) {
			case Waveform::SINUS:
				return sin(2 * M_PI * phase);
			case Waveform::SQUARE:
				return phase < 0.5 ? 1.0 : -1.0;
			case Waveform::SAWTOOTH:
				return 2 * phase - 1.0;
			case Waveform::REVERSE_SAWTOOTH:
				return 1.0 - 2 * phase;
			case Waveform::NOISE: {
				float step = floor(time * frequency);
				float n = sin(step * 12.9898) * 43758.5453;
				return 2.0 * (n - floor(n)) - 1.0;
			}
		}
		return 0.0;
	}
};
