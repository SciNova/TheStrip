#ifndef WS2812B_H
#define WS2812B_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

void ws2812b_write(uint8_t *data, uint16_t len);

#ifdef __cplusplus
}
#endif

#endif