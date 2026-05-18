APPS = DicesClock Stack Pacman Moodlight Playground SimonSays Race Slots FlappyBird Dices Test

all: $(addprefix js/, $(addsuffix .js, $(APPS)))

js/%.js: haxe/%.hx haxe/App.hx
	@mkdir -p js
	haxe -cp haxe -js $@ -main $*

clean:
	rm -rf js