#include "Game.h"
#include "Hardware.h"
#include <Adafruit_NeoPixel.h>

#if HAS_I2S
#include <driver/i2s.h>
#endif

Audio::Audio() {
}

void Audio::begin() {
	#if HAS_I2S
	i2s_config_t config;
	config.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX);
	config.sample_rate = 44100;
	config.bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT;
	config.channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT;
	config.communication_format = I2S_COMM_FORMAT_STAND_I2S;
	config.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1;
	config.dma_buf_count = 2;
	config.dma_buf_len = 512;
	config.use_apll = false;
	config.tx_desc_auto_clear = true;
	
	i2s_pin_config_t pins;
	pins.bck_io_num = 26;
	pins.ws_io_num = 25;
	pins.data_out_num = 27;
	pins.data_in_num = I2S_PIN_NO_CHANGE;
	
	i2s_driver_install(I2S_NUM_0, &config, 0, NULL);
	i2s_set_pin(I2S_NUM_0, &pins);
	#endif
}






/*Audio::Audio() {
	#ifdef HAS_I2S
	for (int i = 0; i < NUM_SOUNDS; i++) {
		sounds[i].pcm = SOUNDS[i];
		sounds[i].length = DURATIONS[i] * 2;
		sounds[i].position = 0;
		sounds[i].isPlaying = false;
	}
	#endif
}*/












Adafruit_NeoPixel leds = Adafruit_NeoPixel(120, 13, NEO_GRB + NEO_KHZ800);

Strip::Strip(Game* g) {
	game = g;
}

void Strip::update() {
	for (int i = 0; i < 120; i++) {
		leds.setPixelColor(i,
			game->pixels[i][0],
			game->pixels[i][1],
			game->pixels[i][2]
		);
	}
	leds.show();
}

void Strip::begin() {
	leds.begin();
	leds.clear();
	leds.show();
}
