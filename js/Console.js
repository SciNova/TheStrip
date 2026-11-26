import { System, SystemState } from '../core/system.js';
import { PcbPanelModel, PANEL_CLASSES } from './hardware.js';

const ARROW_DIRECTION_INDEX = {
	ArrowUp: 0,
	ArrowDown: 1,
	ArrowLeft: 2,
	ArrowRight: 3,
};

const panelSvgCache = {};

const LOGO_FONT_FAMILY = 'Nasalization';
const LOGO_BG_COLOR = 'rgb(30, 50, 80)';
const LOGO_TEXT_COLOR = 'rgb(23, 38, 60)';
const LOGO_TILE_WIDTH_PX = 400;
const LOGO_FONT_SIZE_PX = 120;

const logoFont = new FontFace(LOGO_FONT_FAMILY, 'url(/brand/nasalization.otf)');
const logoFontReady = logoFont.load().then((loaded) => {
	document.fonts.add(loaded);
});

function measureLogoText() {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	ctx.font = `${LOGO_FONT_SIZE_PX}px ${LOGO_FONT_FAMILY}`;
	const m = ctx.measureText('STRIP');
	return {
		width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
		ascent: m.actualBoundingBoxAscent,
		descent: m.actualBoundingBoxDescent,
	};
}

function drawLogoTile(ctx, x, y, tileWidth, tileHeight, rotated, metrics) {
	ctx.save();
	ctx.translate(x + tileWidth / 2, y + tileHeight / 2);
	if (rotated) {
		ctx.rotate(Math.PI);
	}
	ctx.translate(-tileWidth / 2, -tileHeight / 2);

	ctx.fillStyle = LOGO_BG_COLOR;
	ctx.fillRect(0, 0, tileWidth, tileHeight);

	ctx.fillStyle = LOGO_TEXT_COLOR;
	ctx.textAlign = 'center';
	ctx.font = `${LOGO_FONT_SIZE_PX}px ${LOGO_FONT_FAMILY}`;
	ctx.fillText('STRIP', tileWidth / 2, tileHeight / 2 + (metrics.ascent - metrics.descent) / 2);

	ctx.restore();
}

function drawLogoPeriod(ctx, x0, y, tileWidth, tileHeight, metrics) {
	drawLogoTile(ctx, x0, y, tileWidth, tileHeight, false, metrics);
	drawLogoTile(ctx, x0 + tileWidth, y, tileWidth, tileHeight, true, metrics);
}

function buildLogoFloorTexture() {
	const metrics = measureLogoText();
	const padding = (LOGO_TILE_WIDTH_PX - metrics.width) / 2;
	const tileWidth = LOGO_TILE_WIDTH_PX;
	const tileHeight = (metrics.ascent + metrics.descent) + 2 * padding;

	const canvas = document.createElement('canvas');
	canvas.width = tileWidth * 2;
	canvas.height = tileHeight * 2;
	const ctx = canvas.getContext('2d');

	drawLogoPeriod(ctx, 0, 0, tileWidth, tileHeight, metrics);
	drawLogoPeriod(ctx, -1.5 * tileWidth, tileHeight, tileWidth, tileHeight, metrics);
	drawLogoPeriod(ctx, 0.5 * tileWidth, tileHeight, tileWidth, tileHeight, metrics);

	const texture = new THREE.CanvasTexture(canvas);
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	return { texture, tileWidth, tileHeight };
}

async function loadPanelSvg(model) {
	if (model === PcbPanelModel.NONE)
		return '';
	if (!panelSvgCache[model]) {
		const res = await fetch(`/svg/panels/${model}.svg`);
		panelSvgCache[model] = await res.text();
	}
	return panelSvgCache[model];
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
		const dark = this.system.state === SystemState.OFF;
		for (let i = 0; i < this.system.strip.length; i++) {
			const packed = dark ? 0x000000 : this.system.strip.pixels[i];
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
	constructor(container, system, isComposeActive, density = 144) {
		this.container = container;
		this.system = system;
		this.isComposeActive = isComposeActive;
		this.pixelElements = [];
		this.previousColors = new Array(system.strip.length).fill(null);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x202020);

		this.camera = new THREE.PerspectiveCamera(
			60,
			container.clientWidth / container.clientHeight,
			0.5,
			5000
		);

		const LED_PITCH_MM = 1000 / density;
		const stripCenter = (this.system.strip.length - 1) / 2 * LED_PITCH_MM;

		this.stripGroup = new THREE.Group();
		this.stripGroup.position.z = -stripCenter;
		this.scene.add(this.stripGroup);

		const FLOOR_SIZE = 4000;
		const LOGO_PX_PER_MM = LOGO_TILE_WIDTH_PX / 200;
		const floorY = -0.5;

		const floorGeometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
		const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1E3250 });
		const floorPlane = new THREE.Mesh(floorGeometry, floorMaterial);
		floorPlane.rotation.x = -Math.PI / 2;
		floorPlane.rotateZ(Math.PI / 2);
		floorPlane.position.set(0, floorY, 0);
		this.stripGroup.add(floorPlane);

		logoFontReady.then(() => {
			const { texture, tileWidth, tileHeight } = buildLogoFloorTexture();
			const tileWidthMM = tileWidth / LOGO_PX_PER_MM;
			const tileHeightMM = tileHeight / LOGO_PX_PER_MM;
			const repeatY = FLOOR_SIZE / (2 * tileHeightMM);
			texture.repeat.set(FLOOR_SIZE / (2 * tileWidthMM), repeatY);
			texture.offset.y = -((0.5 * repeatY) % 0.5);
			floorMaterial.map = texture;
			floorMaterial.color.set(0xFFFFFF);
			floorMaterial.needsUpdate = true;
		});

		const backingGeometry = new THREE.BoxGeometry(6, 0.25, this.system.strip.length * LED_PITCH_MM);
		const backingMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
		const backing = new THREE.Mesh(backingGeometry, backingMaterial);
		backing.position.y = -0.375;
		this.stripGroup.add(backing);

		for (let i = 0; i < this.system.strip.length; i++) {
			const geometry = new THREE.BoxGeometry(5, 0.5, 5);

			const sideMaterial = new THREE.MeshStandardMaterial({
				color: 0x808080,
				metalness: 0.3,
				roughness: 0.7,
				emissive: 0x000000
			});
			const topMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
			const bottomMaterial = sideMaterial.clone();

			const materials = [sideMaterial, sideMaterial, topMaterial, bottomMaterial, sideMaterial, sideMaterial];
			const led = new THREE.Mesh(geometry, materials);
			led.position.z = -i * LED_PITCH_MM + stripCenter;
			this.stripGroup.add(led);
			this.pixelElements.push({
				mesh: led,
				topMaterial: topMaterial,
				sideMaterial: sideMaterial
			});
		}

		this.cameraTheta = 0;
		this.cameraPhi = 65.0 / 180.0 * Math.PI;
		this.cameraRadius = 250;

		this.lookAtPoint = new THREE.Vector3(0, 0, -stripCenter);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(container.clientWidth, container.clientHeight);
		container.appendChild(this.renderer.domElement);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(0, 150, 0);
		this.scene.add(directionalLight);

		const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
		this.scene.add(ambientLight);

		const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
		fillLight.position.set(0, 50, -100);
		this.scene.add(fillLight);

		this.cameraLight = new THREE.PointLight(0xffffff, 0.3, 500);
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
			child instanceof THREE.DirectionalLight && child.position.y === 150
		);
		if (directionalLight) {
			directionalLight.position.set(
				this.camera.position.x,
				this.camera.position.y + 50,
				this.camera.position.z + 75
			);
			directionalLight.target.position.copy(this.stripGroup.position);
			directionalLight.target.updateMatrixWorld();
		}

		const fillLight = this.scene.children.find(child =>
			child instanceof THREE.DirectionalLight && child.position.z === -100
		);
		if (fillLight) {
			fillLight.position.set(
				this.lookAtPoint.x,
				this.lookAtPoint.y + 50,
				this.lookAtPoint.z - 100
			);
			fillLight.target.position.copy(this.stripGroup.position);
			fillLight.target.updateMatrixWorld();
		}
	}

	handleControls() {
		if (!this.isComposeActive()) return;

		const moveSpeed = 2.5;
		const rotateSpeed = 0.02;
		const zoomSpeed = 5.0;

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
				this.cameraRadius = Math.max(50, this.cameraRadius - zoomSpeed);
			}
			if (this.keyState.ArrowDown) {
				this.cameraRadius += zoomSpeed;
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
		const dark = this.system.state === SystemState.OFF;
		for (let i = 0; i < this.system.strip.length; i++) {
			const packed = dark ? 0x000000 : this.system.strip.pixels[i];
			this.pixelElements[i].topMaterial.color.setHex(packed);

			this.pixelElements[i].sideMaterial.color.setHex(packed);
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
	constructor(resolution) {
		this.system = new System(resolution);
		this.pads = [null, null];
		this.stripContainer = null;
		this.view = null;
		this.is3D = false;
		this.composeMode = false;
		this.registerHandlers();
	}

	registerHandlers() {
		this._boundHandleKeyDown = this.handleKeyDown.bind(this);
		this._boundHandleKeyUp = this.handleKeyUp.bind(this);
		document.addEventListener('keydown', this._boundHandleKeyDown);
		document.addEventListener('keyup', this._boundHandleKeyUp);
	}

	deregisterHandlers() {
		document.removeEventListener('keydown', this._boundHandleKeyDown);
		document.removeEventListener('keyup', this._boundHandleKeyUp);
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

		const home = this.pads[0];
		const guest = this.pads[1];

		const systemTarget = e.shiftKey ? guest : home;
		if (systemTarget) {
			if (e.key.toLowerCase() === 'p')
				systemTarget.setSystemButtonPressed(0, true);
			if (e.key.toLowerCase() === 'm')
				systemTarget.setSystemButtonPressed(1, true);
			if (e.key === ' ')
				systemTarget.setSystemButtonPressed(2, true);
			if (e.key.toLowerCase() === 'b')
				systemTarget.setSystemButtonPressed(3, true);
		}

		if (home) {
			if (e.key === '1')
				home.setNamedButtonPressed(0, true);
			if (e.key === '2')
				home.setNamedButtonPressed(1, true);
			if (e.key === '3')
				home.setNamedButtonPressed(2, true);
			if (e.key === '4')
				home.setNamedButtonPressed(3, true);
			if (e.key === '5' || e.key === 'Enter')
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

		const systemTarget = e.shiftKey ? guest : home;
		if (systemTarget) {
			if (e.key.toLowerCase() === 'p')
				systemTarget.setSystemButtonPressed(0, false);
			if (e.key.toLowerCase() === 'm')
				systemTarget.setSystemButtonPressed(1, false);
			if (e.key === ' ')
				systemTarget.setSystemButtonPressed(2, false);
			if (e.key.toLowerCase() === 'b')
				systemTarget.setSystemButtonPressed(3, false);
		}

		if (home) {
			if (e.key === '1')
				home.setNamedButtonPressed(0, false);
			if (e.key === '2')
				home.setNamedButtonPressed(1, false);
			if (e.key === '3')
				home.setNamedButtonPressed(2, false);
			if (e.key === '4')
				home.setNamedButtonPressed(3, false);
			if (e.key === '5' || e.key === 'Enter')
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
		const hasPanel = model !== PcbPanelModel.NONE;
		div.style.display = hasPanel ? 'block' : 'none';

		const systemRow = document.querySelector(`.systemRow[data-pad="${index}"]`);
		if (systemRow) {
			systemRow.style.display = hasPanel ? 'flex' : 'none';
			const svg = div.querySelector('svg');
			systemRow.style.width = svg ? `${svg.getBoundingClientRect().width}px` : '';
		}

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
