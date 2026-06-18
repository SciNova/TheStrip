#ifndef HARDWARE_DISPLAY_H
#define HARDWARE_DISPLAY_H

#include "system.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <Adafruit_ST7735.h>

class DisplayILI9341 {
public:
	DisplayILI9341() {
	}

	DisplayILI9341(System* system) {
		this->system = system;
	}

	void begin() {
		tft = new Adafruit_ILI9341(SPI_CS, DISPLAY_DC);
		tft->begin();
		tft->fillScreen(ILI9341_BLACK);
	}

	void update() {
		int16_t x0 = (tft->width() - system->strip.length) / 2;
		int16_t y  = tft->height() / 2;

		for (uint16_t i = 0; i < system->strip.length; i++) {
			uint32_t c24 = system->strip.pixels[i];
			uint16_t c16 = ((c24 >> 8) & 0xF800) | ((c24 >> 5) & 0x07E0) | ((c24 >> 3) & 0x001F);
			tft->drawPixel(x0 + i, y, c16);
		}
	}

private:
	System* system;
	Adafruit_ILI9341* tft;
};

class DisplayST7735 {
public:
	DisplayST7735() {
	}

	DisplayST7735(System* system) {
		this->system = system;
	}

	void begin() {
		tft = new Adafruit_ST7735(SPI_CS, DISPLAY_DC);
		tft->initR(INITR_BLACKTAB);
		tft->fillScreen(ST7735_BLACK);
	}

	void update() {
		int16_t x0 = (tft->width() - system->strip.length) / 2;
		int16_t y  = tft->height() / 2;

		for (uint16_t i = 0; i < system->strip.length; i++) {
			uint32_t c24 = system->strip.pixels[i];
			uint16_t c16 = ((c24 >> 8) & 0xF800) | ((c24 >> 5) & 0x07E0) | ((c24 >> 3) & 0x001F);
			tft->drawPixel(x0 + i, y, c16);
		}
	}

private:
	System* system;
	Adafruit_ST7735* tft;
};

#endif /* HARDWARE_DISPLAY_H */
