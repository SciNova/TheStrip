export class Sample {
	static system = null;

	constructor(data) {
		this.data = data;
	}

	get ready() {
		return this.data !== null;
	}

	static decodeWav(buffer) {
		const view = new DataView(buffer);
		let offset = 12;
		let numChannels = 1;
		let bitsPerSample = 16;
		let dataOffset = 0;
		let dataLength = 0;

		while (offset < buffer.byteLength) {
			const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
			const size = view.getUint32(offset + 4, true);
			if (id === 'fmt ') {
				numChannels = view.getUint16(offset + 10, true);
				bitsPerSample = view.getUint16(offset + 22, true);
			} else if (id === 'data') {
				dataOffset = offset + 8;
				dataLength = size;
			}
			offset += 8 + size + (size % 2);
		}

		const frameCount = dataLength / (numChannels * (bitsPerSample / 8));
		const data = new Float32Array(frameCount);
		for (let i = 0; i < frameCount; i++) {
			const sampleOffset = dataOffset + i * numChannels * (bitsPerSample / 8);
			data[i] = view.getInt16(sampleOffset, true) / 32768;
		}
		return data;
	}

	static async load(path) {
		const buffer = await Sample.system.load(path);
		return new Sample(Sample.decodeWav(buffer));
	}
}
