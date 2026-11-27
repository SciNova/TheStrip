import { SystemState } from '../core/System.js';

export class StripView3D {
	static LOGO_FONT_FAMILY = 'Nasalization';
	static LOGO_BG_COLOR = 'rgb(30, 50, 80)';
	static LOGO_TEXT_COLOR = 'rgb(23, 38, 60)';
	static LOGO_TILE_WIDTH_PX = 400;
	static LOGO_FONT_SIZE_PX = 120;

	static logoFont = new FontFace(StripView3D.LOGO_FONT_FAMILY, 'url(/brand/nasalization.otf)');
	static logoFontReady = StripView3D.logoFont.load().then((loaded) => {
		document.fonts.add(loaded);
	});

	static _measureLogoText() {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		ctx.font = `${StripView3D.LOGO_FONT_SIZE_PX}px ${StripView3D.LOGO_FONT_FAMILY}`;
		const m = ctx.measureText('STRIP');
		return {
			width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
			ascent: m.actualBoundingBoxAscent,
			descent: m.actualBoundingBoxDescent,
		};
	}

	static _drawLogoTile(ctx, x, y, tileWidth, tileHeight, rotated, metrics) {
		ctx.save();
		ctx.translate(x + tileWidth / 2, y + tileHeight / 2);
		if (rotated) {
			ctx.rotate(Math.PI);
		}
		ctx.translate(-tileWidth / 2, -tileHeight / 2);

		ctx.fillStyle = StripView3D.LOGO_BG_COLOR;
		ctx.fillRect(0, 0, tileWidth, tileHeight);

		ctx.fillStyle = StripView3D.LOGO_TEXT_COLOR;
		ctx.textAlign = 'center';
		ctx.font = `${StripView3D.LOGO_FONT_SIZE_PX}px ${StripView3D.LOGO_FONT_FAMILY}`;
		ctx.fillText('STRIP', tileWidth / 2, tileHeight / 2 + (metrics.ascent - metrics.descent) / 2);

		ctx.restore();
	}

	static _drawLogoPeriod(ctx, x0, y, tileWidth, tileHeight, metrics) {
		StripView3D._drawLogoTile(ctx, x0, y, tileWidth, tileHeight, false, metrics);
		StripView3D._drawLogoTile(ctx, x0 + tileWidth, y, tileWidth, tileHeight, true, metrics);
	}

	static _buildLogoFloorTexture() {
		const metrics = StripView3D._measureLogoText();
		const padding = (StripView3D.LOGO_TILE_WIDTH_PX - metrics.width) / 2;
		const tileWidth = StripView3D.LOGO_TILE_WIDTH_PX;
		const tileHeight = (metrics.ascent + metrics.descent) + 2 * padding;

		const canvas = document.createElement('canvas');
		canvas.width = tileWidth * 2;
		canvas.height = tileHeight * 2;
		const ctx = canvas.getContext('2d');

		StripView3D._drawLogoPeriod(ctx, 0, 0, tileWidth, tileHeight, metrics);
		StripView3D._drawLogoPeriod(ctx, -1.5 * tileWidth, tileHeight, tileWidth, tileHeight, metrics);
		StripView3D._drawLogoPeriod(ctx, 0.5 * tileWidth, tileHeight, tileWidth, tileHeight, metrics);

		const texture = new THREE.CanvasTexture(canvas);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		return { texture, tileWidth, tileHeight };
	}

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
		const LOGO_PX_PER_MM = StripView3D.LOGO_TILE_WIDTH_PX / 200;
		const floorY = -0.5;

		const floorGeometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
		const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1E3250 });
		const floorPlane = new THREE.Mesh(floorGeometry, floorMaterial);
		floorPlane.rotation.x = -Math.PI / 2;
		floorPlane.rotateZ(Math.PI / 2);
		floorPlane.position.set(0, floorY, 0);
		this.stripGroup.add(floorPlane);

		StripView3D.logoFontReady.then(() => {
			const { texture, tileWidth, tileHeight } = StripView3D._buildLogoFloorTexture();
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
