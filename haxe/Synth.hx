package;

enum Waveform {
	SINE;
	SQUARE;
	SAWTOOTH;
	TRIANGLE;
}


typedef SynthPreset = {
	@:waveform
	var waveform:Waveform;

	@:range(0, 1) @:units("gain") @:default(0.5)
	var volume:Float;

	@:range(0, 2) @:units("s") @:default(0)
	var attackTime:Float;

	@:range(0, 2) @:units("s") @:default(0.07)
	var sustainTime:Float;

	@:range(0, 1) @:units("factor") @:default(0)
	var sustainPunch:Float;

	@:range(0, 2) @:units("s") @:default(0.3)
	var decayTime:Float;

	@:range(0, 4000) @:units("Hz") @:default(700)
	var frequency:Float;

	@:range(-4000, 4000) @:units("Hz") @:default(0)
	var pitchDelta:Float;

	@:range(0, 1) @:units("fraction") @:default(1)
	var pitchDuration:Float;

	@:range(0, 1) @:units("fraction") @:default(0)
	var pitchDelay:Float;

	@:range(0, 70) @:units("Hz") @:default(0)
	var vibratoRate:Float;

	@:range(0, 100) @:units("depth") @:default(0)
	var vibratoDepth:Float;

	@:range(0, 70) @:units("Hz") @:default(0)
	var tremoloRate:Float;

	@:range(0, 1) @:units("gain") @:default(0)
	var tremoloDepth:Float;

	@:range(0, 4000) @:units("Hz") @:default(0)
	var highPassCutoff:Float;

	@:range(0, 30) @:units("Q") @:default(0)
	var highPassResonance:Float;

	@:range(0, 4000) @:units("Hz") @:default(4000)
	var lowPassCutoff:Float;

	@:range(0, 30) @:units("Q") @:default(0)
	var lowPassResonance:Float;

	@:range(0, 1000) @:units("Hz") @:default(100)
	var phaserBaseFrequency:Float;

	@:range(0, 200) @:units("Hz") @:default(50)
	var phaserLfoFrequency:Float;

	@:range(0, 1000) @:units("depth") @:default(0)
	var phaserDepth:Float;

	@:range(0, 500) @:units("amount") @:default(0)
	var noiseAmount:Float;
}




class Synth {
	public static var presets:Array<SynthPreset> = [];

	private var engine:Dynamic;
	private var audioContext:Dynamic;

	public function new(engine:Dynamic, audioContext:Dynamic) {
		this.engine = engine;
		this.audioContext = audioContext;
	}

	public function play(event:SoundEvent):Void {
		var index = Type.enumIndex(event);
		var preset = Synth.presets[index];
		if (preset == null) return;

		var soundConfig:Dynamic = {
			waveForm: cast(preset.waveform, Int),
			volume: preset.volume,
			attackTime: preset.attackTime,
			sustainTime: preset.sustainTime,
			sustainPunch: preset.sustainPunch,
			decayTime: preset.decayTime,
			frequency: preset.frequency,
			pitchDelta: preset.pitchDelta,
			pitchDuration: preset.pitchDuration,
			pitchDelay: preset.pitchDelay,
			vibratoRate: preset.vibratoRate,
			vibratoDepth: preset.vibratoDepth,
			tremoloRate: preset.tremoloRate,
			tremoloDepth: preset.tremoloDepth,
			highPassCutoff: preset.highPassCutoff,
			highPassResonance: preset.highPassResonance,
			lowPassCutoff: preset.lowPassCutoff,
			lowPassResonance: preset.lowPassResonance,
			phaserBaseFrequency: preset.phaserBaseFrequency,
			phaserLfoFrequency: preset.phaserLfoFrequency,
			phaserDepth: preset.phaserDepth,
			noiseAmount: preset.noiseAmount
		};

		engine.playSound(soundConfig, audioContext, audioContext.destination);
	}
}
