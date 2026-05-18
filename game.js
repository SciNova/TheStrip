
const SoundEvent = {
    LEVEL_COMPLETE: "LEVEL_COMPLETE",
    LEVEL_FAIL: "LEVEL_FAIL",
    GAME_COMPLETE: "GAME_COMPLETE",
    SHOOT: "SHOOT",
    HIT: "HIT",
    MISS: "MISS",
    GENERATE_ITEM: "GENERATE_ITEM",
	TICK: "TICK",
	CHECKPOINT: "CHECKPOINT",
    SIMONSAYS1: "SIMONSAYS1",
    SIMONSAYS2: "SIMONSAYS2",
    SIMONSAYS3: "SIMONSAYS3",
    SIMONSAYS4: "SIMONSAYS4",
    SIMONSAYS1_ORIGINAL: "SIMONSAYS1_ORIGINAL",
    SIMONSAYS2_ORIGINAL: "SIMONSAYS2_ORIGINAL",
    SIMONSAYS3_ORIGINAL: "SIMONSAYS3_ORIGINAL",
    SIMONSAYS4_ORIGINAL: "SIMONSAYS4_ORIGINAL"

//	GAME_INTRO: "GAME_INTRO",
//	LEVEL_START: "LEVEL_START",
//	GAME_OVER: "GAME_OVER",
//	ENEMY_HIT: "ENEMY_HIT",
//	ENEMY_DEFEATED: "ENEMY_DEFEATED",
//	ITEM_PICKUP: "ITEM_PICKUP",
//	ITEM_ACTIVATE: "ITEM_ACTIVATE",
//	ITEM_DEACTIVATE: "ITEM_DEACTIVATE",
//	WARNING: "WARNING",
//	WRONG: "WRONG",
//	CONFIRM: "CONFIRM",
//	BOUNCE: "BOUNCE",
//	DASH: "DASH",
//	EXPLOSION: "EXPLOSION",
//	NAVIGATE: "NAVIGATE",
//	CONFIRM_SELECT: "CONFIRM_SELECT",
//	BACK: "BACK",
//	PAUSE: "PAUSE",
//	UNPAUSE: "UNPAUSE",
//	COUNTDOWN: "COUNTDOWN",
//	TIMEOUT: "TIMEOUT",
//	ERROR: "ERROR"
};



class Audio {
    constructor(app) {
        this.app = app;
        this.samples = {};
        this.isReady = false;

        const events = Object.values(SoundEvent);
        let readySamples = 0;

        const onLoad = () => {
            readySamples++;
            if (readySamples == events.length) {
                this.isReady = true;
            }
        };

        for (const event of events) {
            const sample = new window.Audio(`/sounds/${event}.wav`);
            sample.addEventListener('canplaythrough', onLoad, { once: true });
            sample.addEventListener('error', onLoad, { once: true });
            this.samples[event] = sample;
        }
    }

    play(event) {
        const sample = this.samples[event];
        if (sample) {
            sample.currentTime = 0;
            sample.play();
        }
    }
}







const ButtonType = {
	A: { id: 0, label: 'A'},
	B: { id: 1, label: 'B'},
	C: { id: 2, label: 'C'},
	D: { id: 3, label: 'D'},
	X: { id: 0, label: 'X'},
	Y: { id: 1, label: 'Y'},
	Z: { id: 2, label: 'Z'},
	W: { id: 3, label: 'W'},
	R: { id: 0, label: 'R'},
	G: { id: 1, label: 'G'},
	B: { id: 2, label: 'B'},
	Y: { id: 3, label: 'Y'},
	Left: { id: 0, label: 'Left'},
	Right: { id: 2, label: 'Right'},
	Up: { id: 0, label: 'Up'},
	Down: { id: 2, label: 'Down'},
	Shoot: { id: 1, label: 'Shoot'}
};


const EventType = {
	Press: "Press",
	Hold: "Hold",
	Release: "Release",
	ReleaseHold: "ReleaseHold"
};

class ButtonEvent extends CustomEvent {
	constructor(eventType) {
		super(eventType);
	}
}

class ControllerEvent extends CustomEvent {
	constructor(eventType, buttonId) {
		super(eventType, {
			detail: {
				id: buttonId
			}
		});
	}
}

class VisualObject {
	constructor(container) {
		this.container = container;
	}
}

class Button extends VisualObject {
	static HOLD_DURATION = 1.0;

	constructor(button, container) {
		super(container);
		this.button = button;
		this.isPressed = false;
		this.pressTime = 0;
		this.isHolding = false;
	}
	
	_emitEvent(type) {
		const event = new ButtonEvent(type);
		this.container.dispatchEvent(event);
	}
	
	press() {
		if (this.isPressed)
			return;
		this.isPressed = true;
		this.pressTime = Date.now() / 1000;
		this.isHolding = false;
		this._emitEvent(EventType.Press);
	}

	release() {
		if (!this.isPressed)
			return;
		if (this.isHolding)
			this._emitEvent(EventType.ReleaseHold);
		else
			this._emitEvent(EventType.Release);
		this.isPressed = false;
		this.pressTime = 0;
		this.isHolding = false;
	}

	loop() {
		if (this.isPressed && !this.isHolding) {
			const now = Date.now() / 1000;
			if (now - this.pressTime >= Button.HOLD_DURATION) {
				this.isHolding = true;
				this._emitEvent(EventType.Hold);
			}
		}
	}
}

class Controller extends VisualObject {
	constructor(container) {
		super(container);

		this.keyDownHandler = Controller.handleKeyDown(this);
		this.keyUpHandler = Controller.handleKeyUp(this);

		const buttonContainers = [
			document.createElement('div'),
			document.createElement('div'),
			document.createElement('div'),
			document.createElement('div')
		];

		this.buttons = [
			new Button(ButtonType.R, buttonContainers[0]),
			new Button(ButtonType.G, buttonContainers[1]),
			new Button(ButtonType.B, buttonContainers[2]),
			new Button(ButtonType.Y, buttonContainers[3])
		];

		for (let i = 0; i < buttonContainers.length; i++) {
			const buttonContainer = buttonContainers[i];
			const button = this.buttons[i];
			container.appendChild(buttonContainer);

			buttonContainer.addEventListener('Press', this.handleButtonEvent.bind(this, button, 'Press'));
			buttonContainer.addEventListener('Hold', this.handleButtonEvent.bind(this, button, 'Hold'));
			buttonContainer.addEventListener('Release', this.handleButtonEvent.bind(this, button, 'Release'));
			buttonContainer.addEventListener('ReleaseHold', this.handleButtonEvent.bind(this, button, 'ReleaseHold'));
		}

		document.addEventListener('keydown', this.keyDownHandler);
		document.addEventListener('keyup', this.keyUpHandler);
	}

	handleButtonEvent(button, eventType) {
		const event = new ControllerEvent(eventType, button.button.id);
		this.container.dispatchEvent(event);
	}

	static handleKeyDown(controller) {
		return function(e) {
			if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4')
				e.preventDefault();
			if (e.key === '1') controller.buttons[0].press();
			if (e.key === '2') controller.buttons[1].press();
			if (e.key === '3') controller.buttons[2].press();
			if (e.key === '4') controller.buttons[3].press();
		};
	}

	static handleKeyUp(controller) {
		return function(e) {
			if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4')
				e.preventDefault();
			if (e.key === '1') controller.buttons[0].release();
			if (e.key === '2') controller.buttons[1].release();
			if (e.key === '3') controller.buttons[2].release();
			if (e.key === '4') controller.buttons[3].release();
		};
	}

	loop() {
		for (let button of this.buttons) button.loop();
	}
}


class Strip {
	constructor(container, app) {
		this.container = container;
		this.app = app;
		this.pixelElements = [];
		this.container.innerHTML = '';
		for (let i = 0; i < this.app.resolution; i++) {
			const div = document.createElement('div');
			div.className = 'pixel';
			this.container.appendChild(div);
			this.pixelElements.push(div);
		}
	}

	update() {
		for (let i = 0; i < this.app.resolution; i++) {
			let [r, g, b] = this.app.pixels[i];
			const toHex = (n) => n.toString(16).padStart(2, '0');
			let color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
			//let color = `rgb(${r},${g},${b})`;
			this.pixelElements[i].style.backgroundColor = color;
		}
	}

	cleanup() {
	}
}



class Strip3D {
	constructor(container, app) {
		this.container = container;
		this.app = app;
		this.pixelElements = [];
		this.previousColors = new Array(app.resolution).fill(null);

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x000000);

		this.camera = new THREE.PerspectiveCamera(
			60,
			container.clientWidth / container.clientHeight,
			0.1,
			1000
		);

		this.stripGroup = new THREE.Group();
		this.scene.add(this.stripGroup);

		for (let i = 0; i < this.app.resolution; i++) {
			const geometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
			const material = new THREE.MeshBasicMaterial({ color: 0x000000 });

//			const material = new THREE.MeshStandardMaterial({
//				color: 0x000000,
//				metalness: 0.3,
//				roughness: 0.7,
//				emissive: 0x000000
//			});
			const led = new THREE.Mesh(geometry, material);
			led.position.z = -i * 1;
			this.stripGroup.add(led);
			this.pixelElements.push({
				mesh: led,
				material: material
			});
		}

		this.cameraTheta = 0;
		this.cameraPhi = 65.0 / 180.0 * Math.PI;
		this.cameraRadius = 50;

		this.lookAtPoint = new THREE.Vector3(0, 0, -60);

		this.stripRotation = 0;

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
			if (this.keyState.hasOwnProperty(e.key)) {
				this.keyState[e.key] = true;
				e.preventDefault();
			}
		};

		this.handleKeyUp = (e) => {
			if (this.keyState.hasOwnProperty(e.key)) {
				this.keyState[e.key] = false;
				e.preventDefault();
			}
		};

		this.handleModifierChange = (e) => {
			this.keyState.Shift = e.shiftKey;
			this.keyState.Control = e.ctrlKey;
		};

		container.addEventListener('keydown', this.handleKeyDown);
		container.addEventListener('keyup', this.handleKeyUp);
		container.addEventListener('keydown', this.handleModifierChange);
		container.addEventListener('keyup', this.handleModifierChange);

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
			directionalLight.target.position.copy(this.lookAtPoint);
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
			fillLight.target.position.copy(this.lookAtPoint);
			fillLight.target.updateMatrixWorld();
		}
	}

	handleControls() {
		const rotationSpeed = 0.02;
		const panSpeed = 0.5;
		const zoomSpeed = 1.0;
		const stripRotateSpeed = 0.05;

		if (!this.keyState.Shift && !this.keyState.Control) {
			if (this.keyState.ArrowLeft) {
				this.cameraTheta -= rotationSpeed;
			}
			if (this.keyState.ArrowRight) {
				this.cameraTheta += rotationSpeed;
			}
			if (this.keyState.ArrowUp) {
				this.cameraPhi = Math.max(0.1, this.cameraPhi - rotationSpeed);
			}
			if (this.keyState.ArrowDown) {
				this.cameraPhi = Math.min(Math.PI - 0.1, this.cameraPhi + rotationSpeed);
			}

			if (this.keyState.ArrowLeft || this.keyState.ArrowRight ||
				this.keyState.ArrowUp || this.keyState.ArrowDown) {
				this.updateCameraPosition();
			}
		}

		if (this.keyState.Shift && !this.keyState.Control) {
			const forward = new THREE.Vector3();
			this.camera.getWorldDirection(forward);

			const worldUp = new THREE.Vector3(0, 1, 0);
			const right = new THREE.Vector3();
			right.crossVectors(forward, worldUp).normalize();

			const up = new THREE.Vector3();
			up.crossVectors(right, forward).normalize();

			if (this.keyState.ArrowLeft) {
				this.lookAtPoint.add(right.multiplyScalar(-panSpeed));
			}
			if (this.keyState.ArrowRight) {
				this.lookAtPoint.add(right.multiplyScalar(panSpeed));
			}

			if (this.keyState.ArrowUp) {
				this.lookAtPoint.add(up.multiplyScalar(panSpeed));
			}
			if (this.keyState.ArrowDown) {
				this.lookAtPoint.add(up.multiplyScalar(-panSpeed));
			}

			this.updateCameraPosition();
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
				this.stripRotation -= stripRotateSpeed;
				this.stripGroup.rotation.z = this.stripRotation;
			}
			if (this.keyState.ArrowRight) {
				this.stripRotation += stripRotateSpeed;
				this.stripGroup.rotation.z = this.stripRotation;
			}
		}
	}

	update() {
		for (let i = 0; i < this.app.resolution; i++) {
			let [r, g, b] = this.app.pixels[i];

			const hexColor = (r === 0 && g === 0 && b === 0) ? 0x111111 : (r << 16) | (g << 8) | b;
			//const hexColor = (r << 16) | (g << 8) | b;
			this.pixelElements[i].material.color.setHex(hexColor);


			//this.pixelElements[i].material.color.setHex(hexColor);
			//this.pixelElements[i].material.emissive.setHex(hexColor);
		}

		this.handleControls();

		this.renderer.render(this.scene, this.camera);
	}

	cleanup() {
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
















class GameController {
	constructor(stripContainer, controllerContainer, debugContainer, appClass, options = {}) {
		this.stripContainer = stripContainer;
		this.controllerContainer = controllerContainer;
		this.debugContainer = debugContainer;
		this.fps = options.fps || 30;

		this.controller = new Controller(this.controllerContainer);
		this.is3D = options.is3D || false;

		this.handleButtonEvent = this.handleButtonEvent.bind(this);
		this.controller.container.addEventListener('Press', this.handleButtonEvent);
		this.controller.container.addEventListener('Hold', this.handleButtonEvent);
		this.controller.container.addEventListener('Release', this.handleButtonEvent);
		this.controller.container.addEventListener('ReleaseHold', this.handleButtonEvent);

		this.audio = new Audio(this.app);
		this.app = new appClass(this.audio, 120);

		this.createStrip();

		this.lastFrameTime = 0;

		this.handleGlobalKeyDown = this.handleGlobalKeyDown.bind(this);
		document.addEventListener('keydown', this.handleGlobalKeyDown);

		this.loop = this.loop.bind(this);
		this.animationId = requestAnimationFrame(this.loop);
	}

	createStrip() {
		if (this.strip)
			this.strip.cleanup()

		if (this.is3D)
				this.strip = new Strip3D(this.stripContainer, this.app);
			else
				this.strip = new Strip(this.stripContainer, this.app);
	}

	handleGlobalKeyDown(e) {
		if (e.key === 'F10') {
			e.preventDefault();
			this.is3D = !this.is3D;
			this.createStrip();
		}
	}

	stop() {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		
		if (this.handleButtonEvent) {
			this.controller.container.removeEventListener('Press', this.handleButtonEvent);
			this.controller.container.removeEventListener('Hold', this.handleButtonEvent);
			this.controller.container.removeEventListener('Release', this.handleButtonEvent);
			this.controller.container.removeEventListener('ReleaseHold', this.handleButtonEvent);
		}
		
		document.removeEventListener('keydown', this.handleGlobalKeyDown);
		
		if (this.strip) {
			this.strip.cleanup();
		}
		
		if (this.debugContainer) {
			this.debugContainer.innerHTML = '';
		}
	}

	handleButtonEvent(e) {
		const buttonId = e.detail.id;
		switch (e.type) {
			case 'Press':
				this.app.buttonPress(buttonId);
				break;
			case 'Hold':
				this.app.buttonHold(buttonId);
				break;
			case 'Release':
				this.app.buttonRelease(buttonId);
				break;
			case 'ReleaseHold':
				this.app.buttonReleaseHold(buttonId);
				break;
		}
	}


	loop(timestamp) {
		if (timestamp - this.lastFrameTime >= 1000 / this.fps) {
			this.app.loop();
			this.controller.loop();
			this.strip.update();
			if (this.debugContainer) {
				let debugHTML = '';
				debugHTML += `uptime: ${this.app.uptime.toFixed(2)}s<br />`;
				debugHTML += `time: ${this.app.time.toFixed(2)}s<br />`;
				if (this.app.level !== undefined)
					debugHTML += `level: ${this.app.level}<br />`;
				if (this.app.levelTime !== undefined)
					debugHTML += `levelTime: ${this.app.levelTime.toFixed(2)}s<br />`;
				//this.debugContainer.innerHTML = debugHTML;
			}
			this.lastFrameTime = timestamp;
		}
		this.animationId = requestAnimationFrame(this.loop);
	}

}
