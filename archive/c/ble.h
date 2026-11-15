#ifndef BLE_H
#define BLE_H

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "system.h"

#define STRIP_SERVICE_UUID   "cc17afa2-f14c-4d89-a9a2-079f0f5f1a0a"
#define STRIP_IDENTITY_UUID  "f9e9d826-113d-4f15-815e-dab5ce822b96"
#define STRIP_COMMAND_UUID   "c864acdf-4712-4e28-becf-8cb6fddc71a9"
#define STRIP_ACTION_UUID    "fb4163e4-1e6a-4cfd-bd15-75433c54c71c"

class BLE;

// -------------------------------------------------------
//  Handler declarations – only method signatures
// -------------------------------------------------------

class BLEHandler : public BLEServerCallbacks {
public:
	BLEHandler(BLE* ble);
private:
	BLE* ble;
	void onConnect(BLEServer* server) override;
	void onDisconnect(BLEServer* server) override;
};

class BLEActionHandler : public BLECharacteristicCallbacks {
public:
	BLEActionHandler(BLE* ble);
private:
	BLE* ble;
	void onWrite(BLECharacteristic *characteristic) override;
};

class BLECommandHandler : public BLECharacteristicCallbacks {
public:
	BLECommandHandler(BLE* ble);
private:
	BLE* ble;
	void onWrite(BLECharacteristic *characteristic) override;
};

// -------------------------------------------------------
//  WebRemoteControlPad – plain data + handleInput (declared)
// -------------------------------------------------------

class WebRemoteControlPad {
public:
	int port;
	int connectionId;
	BLE* ble;

	void handleInput(uint8_t actionByte);   // only signature
};

// -------------------------------------------------------
//  BLE – full definition
// -------------------------------------------------------

class BLE {
public:
	System* system;
	WebRemoteControlPad* pad;

	void begin(System* sys) {
		system = sys;
		pad = nullptr;

		BLEDevice::init("RGB Strip");

		server = BLEDevice::createServer();
		server->setCallbacks(new BLEHandler(this));

		service = server->createService(STRIP_SERVICE_UUID);

		identityCharacteristic = service->createCharacteristic(
			STRIP_IDENTITY_UUID,
			BLECharacteristic::PROPERTY_READ
		);

		uint8_t identityValue[18] = {};
		memcpy(identityValue, "rgbstrip\0\0", 10);
		BLEAddress address = BLEDevice::getAddress();
		memcpy(identityValue + 10, address.getNative(), 6);
		identityValue[16] = 0x00;
		identityValue[17] = 0x01;
		identityCharacteristic->setValue(identityValue, 18);

		commandCharacteristic = service->createCharacteristic(
			STRIP_COMMAND_UUID,
			BLECharacteristic::PROPERTY_WRITE
		);
		commandCharacteristic->setCallbacks(new BLECommandHandler(this));

		actionCharacteristic = service->createCharacteristic(
			STRIP_ACTION_UUID,
			BLECharacteristic::PROPERTY_WRITE
		);
		actionCharacteristic->setCallbacks(new BLEActionHandler(this));

		service->start();

		BLEAdvertising* advertising = BLEDevice::getAdvertising();
		advertising->addServiceUUID(STRIP_SERVICE_UUID);
		advertising->setScanResponse(true);
		advertising->setMinPreferred(0x06);
		advertising->setMinPreferred(0x12);
		BLEDevice::startAdvertising();

		Serial.println("Strip advertising. Connect with web control pad...");
	}

private:
	BLEServer* server = nullptr;
	BLEService* service = nullptr;
	BLECharacteristic* identityCharacteristic = nullptr;
	BLECharacteristic* commandCharacteristic = nullptr;
	BLECharacteristic* actionCharacteristic = nullptr;
};

// -------------------------------------------------------
//  Implementation of all methods that need complete BLE
// -------------------------------------------------------

inline BLEHandler::BLEHandler(BLE* ble) {
	this->ble = ble;
}

inline void BLEHandler::onConnect(BLEServer* server) {
	uint16_t connId = server->getConnId();

	if (ble->pad != nullptr) {
		server->disconnect(connId);
		Serial.printf("Port occupied, disconnecting connId=%d\n", connId);
		return;
	}

	WebRemoteControlPad* newPad = new WebRemoteControlPad();
	newPad->port = 0;
	newPad->connectionId = connId;
	newPad->ble = ble;
	ble->pad = newPad;

	Serial.printf("Web control pad connected, connId=%d\n", connId);
}

inline void BLEHandler::onDisconnect(BLEServer* server) {
	uint16_t connId = server->getConnId();

	if (ble->pad != nullptr && ble->pad->connectionId == connId) {
		delete ble->pad;
		ble->pad = nullptr;
		Serial.printf("Web control pad disconnected, connId=%d\n", connId);
	}
}

inline BLEActionHandler::BLEActionHandler(BLE* ble) {
	this->ble = ble;
}

inline void BLEActionHandler::onWrite(BLECharacteristic *characteristic) {
	std::string value = characteristic->getValue();
	if (value.length() >= 1) {
		if (ble->pad != nullptr) {
			ble->pad->handleInput((uint8_t)value[0]);
		}
	}
}

inline BLECommandHandler::BLECommandHandler(BLE* ble) {
	this->ble = ble;
}

inline void BLECommandHandler::onWrite(BLECharacteristic *characteristic) {
	std::string value = characteristic->getValue();
	if (value.length() >= 1) {
		Serial.print("Command: 0x");
		Serial.println((uint8_t)value[0], HEX);
	}
}

inline void WebRemoteControlPad::handleInput(uint8_t actionByte) {
	InputEvent event;
	event.action = (Action)actionByte;
	event.value = 0.0f;
	System_handleInput(ble->system, port, &event);
}

#endif // BLE_H
