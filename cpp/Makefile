BUILD_DIR = build

FQBN_uno   = arduino:avr:uno
FQBN_mega  = arduino:avr:mega
FQBN_esp32 = esp32:esp32:esp32

.PHONY: uno mega esp32 clean

uno:
	arduino-cli -v compile --fqbn $(FQBN_uno) --output-dir $(BUILD_DIR)/uno .

mega:
	arduino-cli -v compile --fqbn $(FQBN_mega) --output-dir $(BUILD_DIR)/mega .

esp32:
	arduino-cli -v compile --fqbn $(FQBN_esp32) --output-dir $(BUILD_DIR)/esp32 .

clean:
	rm -rf $(BUILD_DIR)
