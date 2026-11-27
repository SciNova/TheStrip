import { Shape } from './Shape.js';
import { Alignment } from './Alignment.js';
import { SquareView } from './SquareView.js';

export class Square extends Shape {
	constructor(game, faces, invert = false) {
		const faceSize = faces[0].length;
		let size = Math.ceil(faceSize * Math.sqrt(2));
		if (size % 2 === 0) {
			size += 1;
		}
		super(game, size, Alignment.CENTER);
		this.faces = faces;
		this.invert = invert;
	}

	update() {
		SquareView.update(this);
	}
}
