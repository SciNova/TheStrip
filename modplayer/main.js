let player, view;

const FADE_DURATION = 2;

window.onload = function () {
	player = new ModPlayerHost();
	view = new ModPlayerView(document.getElementById('visualizer'));
	view.attach(player);

	// exposed for debugging in devtools
	window.player = player;
	window.view = view;

	player.init().then(() => {
		return player.loadModule('faggots_universe.mod');
	}).catch((err) => {
		console.error('Error loading module:', err);
	});
}

function togglePlay() {
	player.play(FADE_DURATION);
	document.querySelector('button.play').innerText = player.playing ? 'Pause' : 'Play';

	if (player.playing) {
		view.start();
	}
}

function seekRandom() {
	if (!player.song) {
		return;
	}

	const pattern = Math.floor(Math.random() * player.song.order.length);
	player.seek(pattern);
}
