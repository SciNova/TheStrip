#ifndef HARDWARE_STRIP_H
#define HARDWARE_STRIP_H

#include <Arduino.h>
#include "system.h"
#include "ws2812b.h"
#include "Adafruit_NeoPixel.h"

/* ----------------------------------------------------------
   Platform pin constants
   ---------------------------------------------------------- */

#define STRIP_DATA 3

#if defined(ARDUINO_AVR_UNO) || defined(ARDUINO_AVR_NANO)
	#define LED           13
	#define SPI_SCK       13
	#define SPI_MOSI      11
	#define SPI_MISO      12
	#define SPI_CS        10
	#define DISPLAY_DC    -1
	#define I2C_SCL       A5
	#define I2C_SDA       A4
#elif defined(ARDUINO_AVR_MEGA2560)
	#define LED           13
	#define SPI_SCK       52
	#define SPI_MOSI      51
	#define SPI_MISO      50
	#define SPI_CS        53
	#define DISPLAY_DC    -1
	#define I2C_SCL       21
	#define I2C_SDA       20
#elif defined(ESP32)
	#define LED           2
	#define SPI_SCK       18
	#define SPI_MOSI      23
	#define SPI_MISO      19
	#define SPI_CS        5
	#define DISPLAY_DC    4
	#define I2C_SCL       22
	#define I2C_SDA       21
#endif

/* ----------------------------------------------------------
   StripView — assembly bit‑bang driver
   ---------------------------------------------------------- */

typedef struct {
	Strip*  strip;
	uint8_t buffer[STRIP_MAX_LEDS * 3];
} StripView;

static inline void StripView_init(StripView* view, Strip* strip) {
	view->strip = strip;
	pinMode(STRIP_DATA, OUTPUT);
}

static inline void StripView_update(StripView* view) {
	uint16_t length = view->strip->length;
	for (uint16_t i = 0; i < length; i++) {
		uint32_t pixel = view->strip->pixels[i];
		view->buffer[i * 3]     = (pixel >> 8)  & 0xFF;
		view->buffer[i * 3 + 1] = (pixel >> 16) & 0xFF;
		view->buffer[i * 3 + 2] = pixel         & 0xFF;
	}
	ws2812b_write(view->buffer, length * 3);
	delayMicroseconds(80);
	#ifdef WOKWI
		delay(1);
	#endif
}

/* ----------------------------------------------------------
   AdafruitStripView — library‑based fallback (labelled scar)
   ---------------------------------------------------------- */

typedef struct {
	Adafruit_NeoPixel* pixels;
	Strip* strip;
} AdafruitStripView;

static inline void AdafruitStripView_init(AdafruitStripView* view, Strip* strip) {
	view->strip = strip;
	view->pixels = new Adafruit_NeoPixel(view->strip->length, STRIP_DATA, NEO_GRB + NEO_KHZ800);
	view->pixels->begin();
	view->pixels->show();
}

static inline void AdafruitStripView_update(AdafruitStripView* view) {
	for (uint16_t i = 0; i < view->strip->length; i++)
		view->pixels->setPixelColor(i, view->strip->pixels[i]);
	view->pixels->show();
}

#endif /* HARDWARE_STRIP_H */
