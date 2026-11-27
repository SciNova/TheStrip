export class SquareView {
	static update(obj) {
		for (let i = 0; i < obj.pixels.length; i++) {
			obj.pixels[i] = null;
		}

		const faceSize = obj.faces[0].length;
		const faceCount = obj.faces.length;

		let eff = obj.rotation - obj.viewAngle;
		if (obj.invert) {
			eff += 0.5;
		}
		eff = eff % 1.0;
		if (eff < 0) {
			eff += 1.0;
		}

		const quarterRotation = (eff * faceCount) % 1.0;
		const angle = quarterRotation * Math.PI / 2.0;
		const cosA = Math.cos(angle);
		const sinA = Math.sin(angle);

		const length1 = Math.floor(cosA * faceSize);
		const length2 = Math.floor(sinA * faceSize);
		const totalWidth = length1 + length2;
		const startPos = Math.floor((obj.pixels.length - totalWidth) / 2);

		const faceIndex = Math.floor(eff * faceCount) % faceCount;
		const nextFaceIndex = (faceIndex + 1) % faceCount;
		const pattern1 = obj.faces[faceIndex];
		const pattern2 = obj.faces[nextFaceIndex];

		const maxY = faceSize * Math.sqrt(2) / 2.0;

		if (length1 > 0) {
			for (let p = 0; p < length1; p++) {
				const xFace = (p / length1 - 0.5) * faceSize;
				const y = xFace * sinA;
				let intensity = (y + maxY) / (2.0 * maxY);
				if (intensity < 0) intensity = 0;
				if (intensity > 1) intensity = 1;
				const patternPos = Math.min(faceSize - 1, Math.max(0, Math.floor(p / length1 * faceSize)));
				const src = pattern1[patternPos];
				if (src !== null && src !== undefined) {
					const r = (src >> 16) & 0xFF;
					const g = (src >> 8) & 0xFF;
					const b = src & 0xFF;
					obj.pixels[startPos + p] = (Math.floor(r * intensity) << 16) | (Math.floor(g * intensity) << 8) | Math.floor(b * intensity);
				}
			}
		}

		if (length2 > 0) {
			for (let p = 0; p < length2; p++) {
				const yFace = (p / length2 - 0.5) * faceSize;
				const y = yFace * cosA;
				const rawIntensity = (y + maxY) / (2.0 * maxY);
				let intensity = 1.0 - rawIntensity;
				if (intensity < 0) intensity = 0;
				if (intensity > 1) intensity = 1;
				const patternPos = Math.min(faceSize - 1, Math.max(0, Math.floor(p / length2 * faceSize)));
				const src = pattern2[patternPos];
				if (src !== null && src !== undefined) {
					const r = (src >> 16) & 0xFF;
					const g = (src >> 8) & 0xFF;
					const b = src & 0xFF;
					obj.pixels[startPos + length1 + p] = (Math.floor(r * intensity) << 16) | (Math.floor(g * intensity) << 8) | Math.floor(b * intensity);
				}
			}
		}
	}
}
