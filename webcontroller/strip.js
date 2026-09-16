const STRIP_SERVICE_UUID = "cc17afa2-f14c-4d89-a9a2-079f0f5f1a0a";
const STRIP_IDENTITY_UUID = "f9e9d826-113d-4f15-815e-dab5ce822b96";
const STRIP_COMMAND_UUID = "c864acdf-4712-4e28-becf-8cb6fddc71a9";
const STRIP_WHITELIST_UUID = "bf5401f6-33da-4c18-8bfb-04e581b62c47";
const STRIP_ACTION_UUID = "fb4163e4-1e6a-4cfd-bd15-75433c54c71c";

const Action = Object.freeze({
	A_PRESS: 0xC1,
	A_RELEASE: 0x81,
	B_PRESS: 0xC2,
	B_RELEASE: 0x82,
	C_PRESS: 0xC3,
	C_RELEASE: 0x83,
	D_PRESS: 0xC4,
	D_RELEASE: 0x84,
	UP_PRESS: 0xC5,
	UP_RELEASE: 0x85,
	DOWN_PRESS: 0xC6,
	DOWN_RELEASE: 0x86,
	LEFT_PRESS: 0xC7,
	LEFT_RELEASE: 0x87,
	RIGHT_PRESS: 0xC8,
	RIGHT_RELEASE: 0x88,
	FIRE_PRESS: 0xC9,
	FIRE_RELEASE: 0x89,
	FIRE2_PRESS: 0xCA,
	FIRE2_RELEASE: 0x8A,
	ENCODER_LEFT: 0x01,
	ENCODER_RIGHT: 0x02,
	ENCODER2_LEFT: 0x03,
	ENCODER2_RIGHT: 0x04,
	PAUSE_PRESS: 0xD8,
	MENU_PRESS: 0xD9,
	POWER_PRESS: 0xDA,
});

class WebControlPad {
	constructor(div, svgs) {
		this.div = div;
		this.svgs = svgs;
		this.currentPanel = Object.keys(svgs)[0];

		this.isConnected = false;

		this.div.setAttribute("tabindex", "-1");

		this.update();

		this.boundKeyDown = (event) => this.handleKeyboardPress(event.key, event);
		this.boundKeyUp = (event) => this.handleKeyboardRelease(event.key, event);
		document.addEventListener("keydown", this.boundKeyDown);
		document.addEventListener("keyup", this.boundKeyUp);

		this.div.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
		this.div.addEventListener("pointerup", (event) => this.handlePointerUp(event));
	}

	async connect() {
		try {
			this.device = await navigator.bluetooth.requestDevice({
				filters: [{ services: [STRIP_SERVICE_UUID] }]
			});
		} catch (error) {
			return;
		}

		this.device.addEventListener("gattserverdisconnected", () => this.onDisconnect());

		const server = await this.device.gatt.connect();
		const service = await server.getPrimaryService(STRIP_SERVICE_UUID);

		this.actionChar = await service.getCharacteristic(STRIP_ACTION_UUID);

		const identityChar = await service.getCharacteristic(STRIP_IDENTITY_UUID);
		const identityValue = await identityChar.readValue();
		const magic = new TextDecoder().decode(identityValue.buffer.slice(0, 10)).replace(/\0/g, "");
		console.log("Connected to", magic);

		this.onConnect();
	}

	onConnect() {
		this.isConnected = true;
	}

	onDisconnect() {
		this.isConnected = false;
		this.actionChar = null;
	}

	sendAction(action) {
		if (!this.isConnected || !this.actionChar) {
			return;
		}
		const bytes = new Uint8Array([action]);
		this.actionChar.writeValue(bytes).catch(error => {
			console.error("BLE write failed:", error);
		});
	}

	nextPanel() {
		const keys = Object.keys(this.svgs);
		const index = keys.indexOf(this.currentPanel);
		const nextIndex = (index + 1) % keys.length;
		this.currentPanel = keys[nextIndex];
		this.update();
	}

	previousPanel() {
		const keys = Object.keys(this.svgs);
		const index = keys.indexOf(this.currentPanel);
		const prevIndex = (index - 1 + keys.length) % keys.length;
		this.currentPanel = keys[prevIndex];
		this.update();
	}

	update() {
		this.div.innerHTML = this.svgs[this.currentPanel];
	}

	handleInput(action) {
		this.sendAction(action);
	}

	handleKeyboardPress(key, event) {
		if (key === "+" || key === "=") {
			event.preventDefault();
			this.nextPanel();
			return;
		}
		if (key === "-") {
			event.preventDefault();
			this.previousPanel();
			return;
		}

		const element = this.div.querySelector(`[data-key="${key}"]`);
		if (element) {
			event.preventDefault();
			const pressName = element.getAttribute("data-press");
			if (pressName && Action[pressName] !== undefined) {
				this.handleInput(Action[pressName]);
			}
		}
	}

	handleKeyboardRelease(key, event) {
		const element = this.div.querySelector(`[data-key="${key}"]`);
		if (element) {
			event.preventDefault();
			const releaseName = element.getAttribute("data-release");
			if (releaseName && Action[releaseName] !== undefined) {
				this.handleInput(Action[releaseName]);
			}
		}
	}






handlePointerDown(event) {
	const element = event.target.closest("[data-press]");
	if (element) {
		const pressName = element.getAttribute("data-press");
		if (pressName && Action[pressName] !== undefined) {
			event.preventDefault();
			this.handleInput(Action[pressName]);
			element.setPointerCapture(event.pointerId);
		}
	}
	this.div.focus();
}

handlePointerUp(event) {
	const element = event.target.closest("[data-release]");
	if (element) {
		const releaseName = element.getAttribute("data-release");
		if (releaseName && Action[releaseName] !== undefined) {
			event.preventDefault();
			this.handleInput(Action[releaseName]);
			element.releasePointerCapture(event.pointerId);
		}
	}
	this.div.focus();
}


}
