APPS = Stack Pacman Moodlight SimonSays Race Slots FlappyBird Dices DicesClock
## Playground Test
all: $(addprefix js/, $(addsuffix .js, $(APPS)))

js/%.js: haxe/%.hx haxe/App.hx
	@mkdir -p js
	haxe -cp haxe -js $@ -main $*

clean:
	rm -rf js