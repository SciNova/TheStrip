#include <avr/io.h>

#define __SFR_OFFSET 0

.global ws2812b_write

ws2812b_write:
	push r28
	push r29

#if defined(__AVR_ATmega328P__) // Uno: PD2
	ldi r28, lo8(0x2B)
	ldi r29, hi8(0x2B)
	ldi r30, (1 << 2)
	ldi r31, ~(1 << 2)
#elif defined(__AVR_ATmega2560__) // Mega: PE4
	ldi r28, lo8(0x2E)
	ldi r29, hi8(0x2E)
	ldi r30, (1 << 4)
	ldi r31, ~(1 << 4)
#elif defined(__AVR_ATtiny85__) // ATtiny85: PB2
	ldi r28, lo8(0x38)
	ldi r29, hi8(0x38)
	ldi r30, (1 << 2)
	ldi r31, ~(1 << 2)
#else
	#error "Unsupported MCU – add port/pin definitions for your chip"
#endif

	movw r26, r24 ; X = data
	movw r24, r22 ; r24:r25 = byte count

	in r22, SREG
	cli

	ld r20, Y
	mov r21, r20
	or r20, r30 ; our '1' output
	and r21, r31 ; our '0' output
	ldi r19, 7 ; 7‑bit counter (8th bit handled in bit8)
	ld r18, X+ ; get first data byte

#if F_CPU == 16000000UL
	; ============================================================
	; 16 MHz – exactly 19 cycles per bit
	; 0‑bit : high = 5 low = 14
	; 1‑bit : high = 9 low = 10
	; ============================================================

loop1:
	st Y, r20 ; (2) start HIGH
	lsl r18 ; (1) C = MSB
	brcs L1 ; (1/2)

	; ----- 0‑bit -----
	nop ; (1) +1 NOP → high = 5 cycles
	st Y, r21 ; (2) fall (LOW)
	bst r18, 7 ; (1) save next MSB
	subi r19, 1 ; (1)
	breq bit8 ; (1)
	nop ; (1) \
	nop ; (1) |
	nop ; (1) | 7 NOPs → low = 14
	nop ; (1) |
	nop ; (1) |
	nop ; (1) |
	nop ; (1) /
	rjmp loop1 ; (2)

L1:
	; ----- 1‑bit -----
	bst r18, 7 ; (1)
	subi r19, 1 ; (1)
	nop ; (1) \
	nop ; (1) / +2 NOPs → high = 9 cycles
	st Y, r21 ; (2) fall
	breq bit8 ; (1)
	nop ; (1) \
	nop ; (1) |
	nop ; (1) | 5 NOPs → low = 10
	nop ; (1) |
	nop ; (1) /
	rjmp loop1 ; (2)

	; -------------------- 8th bit --------------------
bit8:
	ldi r19, 7 ; (1) reload counter
	st Y, r20 ; (2) start HIGH
	brts L2 ; (1/2)

	; -- last bit = 0 --
	nop ; (1) \
	nop ; (1) / +2 NOPs → high = 5
	st Y, r21 ; (2) fall
	; low = 14 → 6 NOPs + load/loop (8 cycles total without NOPs = 2+2+2+2 = 8, need 14 so 6 NOPs)
	nop
	nop
	nop
	nop
	nop
	nop ; (6)
	ld r18, X+ ; (2) next byte
	sbiw r24, 1 ; (2) dec counter
	brne loop1 ; (2)
	out SREG, r22 ; (1)
	rjmp end

L2:
	; -- last bit = 1 --
	nop
	nop
	nop
	nop
	nop ; (5 nops) → high = 9
	st Y, r21 ; (2) fall
	; low = 10 → 2 NOPs + load/loop (8) = 10
	nop
	nop ; (2)
	ld r18, X+ ; (2)
	sbiw r24, 1 ; (2)
	brne loop1 ; (2)
	out SREG, r22 ; (1)
	rjmp end

#else
	; ============================================================
	; 8 MHz original (11 cycles per bit)
	; ============================================================
loop1:
	st Y, r20 ; 2
	lsl r18 ; 1
	brcs L1 ; 1/2
	st Y, r21 ; 2
	bst r18, 7 ; 1
	subi r19, 1 ; 1
	breq bit8 ; 1
	rjmp loop1 ; 2

L1:
	bst r18, 7 ; 1
	subi r19, 1 ; 1
	st Y, r21 ; 2
	brne loop1 ; 2

bit8:
	ldi r19, 7 ; 1
	st Y, r20 ; 1
	brts L2 ; 1/2
	st Y, r21 ; 2
	ld r18, X+ ; 2
	sbiw r24, 1 ; 2
	brne loop1 ; 2
	out SREG, r22 ; 1
	rjmp end

L2:
	ld r18, X+ ; 2
	sbiw r24, 1 ; 2
	st Y, r21 ; 2
	brne loop1 ; 2
	out SREG, r22 ; 1
	rjmp end
#endif

end:
	pop r29
	pop r28
	ret
