import { System, Sound, Audio } from '../core/system.js';
import { PcbPanelModel, PANEL_CLASSES } from './hardware.js';

const ARROW_DIRECTION_INDEX = {
	ArrowUp: 0,
	ArrowDown: 1,
	ArrowLeft: 2,
	ArrowRight: 3,
};

const panelSvgCache = {};

async function loadPanelSvg(model) {
	if (model === PcbPanelModel.NONE)
		return '';
	if (!panelSvgCache[model]) {
		const res = await fetch(`/svg/panels/${model}.svg`);
		panelSvgCache[model] = await res.text();
	}
	return panelSvgCache[model];
}

class SampleAudio extends Audio {
	constructor(system) {
		super(system);
		this.system = system;
		this.samples = {};
		this.isReady = false;
		this.load();
	}

	load() {
		this.isReady = false;

		const entries = Object.values(Sound).map((sound) => ({ sound, path: `/sounds/${sound}.wav` }));

		const game = this.system.game;
		if (game && game.constructor.sounds) {
			for (const sound of Object.values(game.constructor.sounds)) {
				entries.push({ sound, path: `/apps/${game.constructor.name}/${sound}.wav` });
			}
		}

		const pending = entries.filter(({ sound }) => !this.samples[sound]);
		if (pending.length === 0) {
			this.isReady = true;
			return;
		}

		let remaining = pending.length;
		const onLoad = () => {
			remaining--;
			if (remaining === 0) {
				this.isReady = true;
			}
		};

		for (const { sound, path } of pending) {
			const sample = new window.Audio(path);
			sample.addEventListener('canplaythrough', onLoad, { once: true });
			sample.addEventListener('error', onLoad, { once: true });
			this.samples[sound] = sample;
		}
	}

	play(sound) {
		const sample = this.samples[sound];
		if (sample) {
			sample.currentTime = 0;
			sample.play();
		}
	}
}

class StripView {
	constructor(container, system) {
		this.container = container;
		this.system = system;
		this.pixelElements = [];
		this.container.innerHTML = '';
		for (let i = 0; i < this.system.strip.length; i++) {
			const div = document.createElement('div');
			div.className = 'pixel';
			this.container.appendChild(div);
			this.pixelElements.push(div);
		}
	}

	begin() {}

	update() {
		const game = this.system.game;
		for (let i = 0; i < this.system.strip.length; i++) {
			const packed = game ? this.system.strip.pixels[i] : 0x000000;
			const r = (packed >> 16) & 0xFF;
			const g = (packed >> 8) & 0xFF;
			const b = packed & 0xFF;
			const toHex = (n) => n.toString(16).padStart(2, '0');
			const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
			this.pixelElements[i].style.backgroundColor = color;
		}
	}

	cleanup() {
		this.container.innerHTML = '';
	}
}

class StripView3D {
	constructor(container, system, isComposeActive) {
		this.container = container;
		this.system = system;
		this.isComposeActive = isComposeActive;
		this.pixelElements = [];
		this.previousColors = new Array(system.strip.length).fill(null);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);

		this.camera = new THREE.PerspectiveCamera(
			60,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);

		const stripCenter = (this.system.strip.length - 1) / 2;

		this.stripGroup = new THREE.Group();
		this.stripGroup.position.z = -stripCenter;
		this.scene.add(this.stripGroup);

		for (let i = 0; i < this.system.strip.length; i++) {
			const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);

			const sideMaterial = new THREE.MeshStandardMaterial({
				color: 0x808080,
				metalness: 0.3,
				roughness: 0.7,
				emissive: 0x000000
			});
			const topMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
			const bottomMaterial = sideMaterial.clone();

			const materials = [sideMaterial, topMaterial, bottomMaterial];
			const led = new THREE.Mesh(geometry, materials);
			led.position.z = -i + stripCenter;
			this.stripGroup.add(led);
			this.pixelElements.push({
				mesh: led,
				topMaterial: topMaterial
			});
		}

		// Camera view angle/target are fixed (this is a video backdrop, not a
		// scene you fly around) — only cameraRadius changes, via zoom.
		this.cameraTheta = 0;
		this.cameraPhi = 65.0 / 180.0 * Math.PI;
		this.cameraRadius = 50;

		this.lookAtPoint = new THREE.Vector3(0, 0, -stripCenter);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		container.appendChild(this.renderer.domElement);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(0, 30, 0);
		this.scene.add(directionalLight);

		const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
		this.scene.add(ambientLight);

		const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
		fillLight.position.set(0, 10, -20);
		this.scene.add(fillLight);

		this.cameraLight = new THREE.PointLight(0xffffff, 0.3, 100);
		this.scene.add(this.cameraLight);

		this.updateCameraPosition();

		this.keyState = {
			ArrowLeft: false,
			ArrowRight: false,
			ArrowUp: false,
			ArrowDown: false,
			Shift: false,
			Control: false
		};

		this.handleKeyDown = (e) => {
			if (!this.isComposeActive()) return;
			if (this.keyState.hasOwnProperty(e.key)) {
				this.keyState[e.key] = true;
				e.preventDefault();
			}
		};

		this.handleKeyUp = (e) => {
			if (!this.isComposeActive()) return;
			if (this.keyState.hasOwnProperty(e.key)) {
				this.keyState[e.key] = false;
				e.preventDefault();
			}
		};

		this.handleModifierChange = (e) => {
			if (!this.isComposeActive()) return;
			this.keyState.Shift = e.shiftKey;
			this.keyState.Control = e.ctrlKey;
		};

		container.addEventListener('keydown', this.handleKeyDown);
		container.addEventListener('keyup', this.handleKeyUp);
		container.addEventListener('keydown', this.handleModifierChange);
		container.addEventListener('keyup', this.handleModifierChange);

		this.handleResize = () => {
			const width = this.container.clientWidth;
			const height = this.container.clientHeight;
			if (width === 0 || height === 0) return;
			this.camera.aspect = width / height;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(width, height);
		};
		this.resizeObserver = new ResizeObserver(this.handleResize);
		this.resizeObserver.observe(container);

		container.tabIndex = 0;
		container.focus();

		this.renderer.render(this.scene, this.camera);
	}

	updateCameraPosition() {
		const x = this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);
		const y = this.cameraRadius * Math.cos(this.cameraPhi);
		const z = this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);

		this.camera.position.set(
			this.lookAtPoint.x + x,
			this.lookAtPoint.y + y,
			this.lookAtPoint.z + z
		);

		this.camera.lookAt(this.lookAtPoint);

		if (this.cameraLight) {
			this.cameraLight.position.copy(this.camera.position);
		}

		this.updateLightPositions();
	}

	updateLightPositions() {
		const directionalLight = this.scene.children.find(child =>
			child instanceof THREE.DirectionalLight && child.position.y === 30
		);
		if (directionalLight) {
			directionalLight.position.set(
				this.camera.position.x,
				this.camera.position.y + 10,
				this.camera.position.z + 15
			);
			directionalLight.target.position.copy(this.stripGroup.position);
			directionalLight.target.updateMatrixWorld();
		}

		const fillLight = this.scene.children.find(child =>
			child instanceof THREE.DirectionalLight && child.position.z === -20
		);
		if (fillLight) {
			fillLight.position.set(
				this.lookAtPoint.x,
				this.lookAtPoint.y + 10,
				this.lookAtPoint.z - 20
			);
			fillLight.target.position.copy(this.stripGroup.position);
			fillLight.target.updateMatrixWorld();
		}
	}

	// No modifier: move the strip. Shift: rotate it (yaw/pitch). Ctrl: zoom
	// the (fixed) camera and roll the strip. The camera itself never moves
	// on its own — this is a fixed backdrop you place the strip into, for
	// recording video, not a scene you fly a camera around.
	handleControls() {
		if (!this.isComposeActive()) return;

		const moveSpeed = 0.5;
		const rotateSpeed = 0.02;
		const zoomSpeed = 1.0;

		if (!this.keyState.Shift && !this.keyState.Control) {
			if (this.keyState.ArrowLeft) {
				this.stripGroup.position.x -= moveSpeed;
			}
			if (this.keyState.ArrowRight) {
				this.stripGroup.position.x += moveSpeed;
			}
			if (this.keyState.ArrowUp) {
				this.stripGroup.position.y += moveSpeed;
			}
			if (this.keyState.ArrowDown) {
				this.stripGroup.position.y -= moveSpeed;
			}
		}

		if (this.keyState.Shift && !this.keyState.Control) {
			if (this.keyState.ArrowLeft) {
				this.stripGroup.rotation.y -= rotateSpeed;
			}
			if (this.keyState.ArrowRight) {
				this.stripGroup.rotation.y += rotateSpeed;
			}
			if (this.keyState.ArrowUp) {
				this.stripGroup.rotation.x -= rotateSpeed;
			}
			if (this.keyState.ArrowDown) {
				this.stripGroup.rotation.x += rotateSpeed;
			}
		}

		if (this.keyState.Control && !this.keyState.Shift) {
			if (this.keyState.ArrowUp) {
				this.cameraRadius = Math.max(10, this.cameraRadius - zoomSpeed);
			}
			if (this.keyState.ArrowDown) {
				this.cameraRadius = Math.min(200, this.cameraRadius + zoomSpeed);
			}

			if (this.keyState.ArrowUp || this.keyState.ArrowDown) {
				this.updateCameraPosition();
			}

			if (this.keyState.ArrowLeft) {
				this.stripGroup.rotation.z -= rotateSpeed;
			}
			if (this.keyState.ArrowRight) {
				this.stripGroup.rotation.z += rotateSpeed;
			}
		}
	}

	begin() {}

	update() {
		const game = this.system.game;
		for (let i = 0; i < this.system.strip.length; i++) {
			const packed = game ? game.pixels[i] : 0x000000;
			this.pixelElements[i].topMaterial.color.setHex(packed);
		}

		this.handleControls();
		this.renderer.render(this.scene, this.camera);
	}

	cleanup() {
		this.resizeObserver.disconnect();

		if (this.container) {
			this.container.removeEventListener('keydown', this.handleKeyDown);
			this.container.removeEventListener('keyup', this.handleKeyUp);
			this.container.removeEventListener('keydown', this.handleModifierChange);
			this.container.removeEventListener('keyup', this.handleModifierChange);
		}

		if (this.renderer && this.container && this.container.contains(this.renderer.domElement)) {
			this.container.removeChild(this.renderer.domElement);
		}
	}
}

class Console {
	constructor() {
		this.system = new System();
		this.system.audio = new SampleAudio(this.system);
		this.pads = [null, null];
		this.stripContainer = null;
		this.view = null;
		this.is3D = false;
		this.composeMode = false;
		document.addEventListener('keydown', this.handleKeyDown.bind(this));
		document.addEventListener('keyup', this.handleKeyUp.bind(this));
	}

	setStripContainer(container) {
		this.stripContainer = container;
		this.view = new StripView(container, this.system);
		this.is3D = false;
	}

	updateView() {
		if (this.view)
			this.view.update();
	}

	poll(now) {
		for (const ctrl of this.pads) {
			if (ctrl) ctrl.poll(now);
		}
	}

	handleKeyDown(e) {
		if (e.key === '+')
			this.swapPanel(0);
		if (e.key === '-')
			this.swapPanel(1);
		if (e.key.toLowerCase() === 'v')
			this.toggle3D();
		if (e.key.toLowerCase() === 'c')
			this.composeMode = !this.composeMode;
		if (e.key === 'F11')
			this.toggleFullscreen();
		if (e.key === 'F12')
			this.system.toggleMenu();
		if (e.key === ' ')
			this.system.togglePause();

		const home = this.pads[0];
		const guest = this.pads[1];
		if (home) {
			if (e.key === '1')
				home.setNamedButtonPressed(0, true);
			if (e.key === '2')
				home.setNamedButtonPressed(1, true);
			if (e.key === '3')
				home.setNamedButtonPressed(2, true);
			if (e.key === '4')
				home.setNamedButtonPressed(3, true);
			if (e.key === '5')
				home.setDirectionPressed(4, true);
			if (e.key === '6')
				home.setDirectionPressed(5, true);

			const arrowIdx = ARROW_DIRECTION_INDEX[e.key];
			if (arrowIdx !== undefined && !(this.is3D && this.composeMode)) {
				home.setDirectionPressed(arrowIdx, true);
				e.preventDefault();
			}
		}
		if (guest) {
			if (e.key === '7')
				guest.setNamedButtonPressed(0, true);
			if (e.key === '8')
				guest.setNamedButtonPressed(1, true);
			if (e.key === '9')
				guest.setNamedButtonPressed(2, true);
			if (e.key === '0')
				guest.setNamedButtonPressed(3, true);
		}
	}

	handleKeyUp(e) {
		const home = this.pads[0];
		const guest = this.pads[1];
		if (home) {
			if (e.key === '1')
				home.setNamedButtonPressed(0, false);
			if (e.key === '2')
				home.setNamedButtonPressed(1, false);
			if (e.key === '3')
				home.setNamedButtonPressed(2, false);
			if (e.key === '4')
				home.setNamedButtonPressed(3, false);
			if (e.key === '5')
				home.setDirectionPressed(4, false);
			if (e.key === '6')
				home.setDirectionPressed(5, false);

			const arrowIdx = ARROW_DIRECTION_INDEX[e.key];
			if (arrowIdx !== undefined && !(this.is3D && this.composeMode)) {
				home.setDirectionPressed(arrowIdx, false);
				e.preventDefault();
			}
		}
		if (guest) {
			if (e.key === '7')
				guest.setNamedButtonPressed(0, false);
			if (e.key === '8')
				guest.setNamedButtonPressed(1, false);
			if (e.key === '9')
				guest.setNamedButtonPressed(2, false);
			if (e.key === '0')
				guest.setNamedButtonPressed(3, false);
		}
	}

	swapPanel(index) {
		const ctrl = this.pads[index];
		if (!ctrl) return;

		const models = Object.values(PcbPanelModel);
		const currentName = ctrl.panel ? ctrl.panel.model : PcbPanelModel.NONE;
		const idx = models.indexOf(currentName);
		const next = models[(idx + 1) % models.length];

		if (next === PcbPanelModel.NONE) {
			ctrl.panel = null;
		} else {
			const PanelClass = PANEL_CLASSES[next];
			ctrl.panel = new PanelClass();
		}
		ctrl.update();
		this.renderPad(index);
	}

	async renderPad(index) {
		const id = index === 0 ? 'pad' : 'pad2';
		const div = document.getElementById(id);
		const ctrl = this.pads[index];
		if (!div || !ctrl)
			return;
		const model = ctrl.panel ? ctrl.panel.model : PcbPanelModel.NONE;
		div.innerHTML = await loadPanelSvg(model);
		div.style.display = model === PcbPanelModel.NONE ? 'none' : 'block';
		this._updateHandlers(index);
	}

	_updateHandlers(index) {
		const id = index === 0 ? 'pad' : 'pad2';
		const div = document.getElementById(id);
		if (!div)
			return;
		const ctrl = this.pads[index];
		if (!ctrl)
			return;
		const elements = div.querySelectorAll('[data-code]');
		for (let i = 0; i < elements.length; i++) {
			const el = elements[i];
			const idx = i;
			el.addEventListener('mousedown', () => {
				ctrl.setButtonPressed(idx, true);
			});
			el.addEventListener('mouseup', () => {
				ctrl.setButtonPressed(idx, false);
			});
			el.addEventListener('touchstart', (e) => {
				e.preventDefault();
				ctrl.setButtonPressed(idx, true);
			});
			el.addEventListener('touchend', (e) => {
				e.preventDefault();
				ctrl.setButtonPressed(idx, false);
			});
		}
	}

	toggle3D() {
		if (!this.stripContainer)
			return;

		if (this.view)
			this.view.cleanup();

		this.is3D = !this.is3D;
		this.view = this.is3D
			? new StripView3D(this.stripContainer, this.system, () => this.composeMode)
			: new StripView(this.stripContainer, this.system);
	}

	toggleFullscreen() {
		if (!document.fullscreenElement)
			document.documentElement.requestFullscreen();
		else
			document.exitFullscreen();
	}
}

export { Console, StripView, StripView3D };
