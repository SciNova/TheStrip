import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { System } from '../core/system.js';
import { Sample } from '../core/audio.js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const system = new System();
system.load = async (relativePath) => {
	const buffer = await readFile(path.join(ROOT_DIR, relativePath));
	return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};
system.clock.now = () => performance.now() / 1000;
Sample.system = system;
