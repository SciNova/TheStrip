import sys
import tty
import termios

fd = sys.stdin.fileno()
old = termios.tcgetattr(fd)
tty.setraw(fd)

print("Press keys (Ctrl-C to quit). Hex bytes will print immediately.")

try:
	while True:
		ch = sys.stdin.read(1)
		print(f"{ord(ch):02X}", end=" ", flush=True)
except KeyboardInterrupt:
	pass
finally:
	termios.tcsetattr(fd, termios.TCSADRAIN, old)
	print("\nDone.")