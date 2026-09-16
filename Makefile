# All games are now hand-written ES modules in js/ (ported from ../py), not
# compiled from Haxe. GAMES is now empty; kept for TestNode/TestCpp only.
GAMES =
CORE = _System _Audio _Input _Game _Graphics

all: $(addprefix js/, $(addsuffix .js, $(GAMES)))

js/%.js: haxe/%.hx $(addprefix haxe/, $(addsuffix .hx, $(CORE)))
	@mkdir -p js
	haxe -cp haxe -js $@ -main $*

testnode: js/TestNode.js
	node js/TestNode.js

js/TestNode.js: haxe/TestNode.hx $(addprefix haxe/, $(addsuffix .hx, $(CORE))) haxe/FlappyBird.hx
	@mkdir -p js
	haxe -cp haxe -js js/TestNode.js -main TestNode

testcpp: haxe/TestCpp.hx $(addprefix haxe/, $(addsuffix .hx, $(CORE))) haxe/Cars.hx
	@mkdir -p cpp
	haxe -cp haxe -cpp cpp/TestCpp -main TestCpp
	cp cpp/TestCpp/TestCpp /root/testcpp
	chmod +x /root/testcpp

clean:
	rm -rf js cpp

