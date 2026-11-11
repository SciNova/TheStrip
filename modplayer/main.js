let player, view;

window.onload = function () {
	const audioWorkletSupport = !!AudioWorkletNode.toString().match(/native code/);

	player = new ModPlayer();
	view = new ModPlayerView(document.getElementById('visualizer'));
	view.attach(player);

	player.init({
		audioWorkletSupport: audioWorkletSupport
	}).then(() => {
		return player.loadModule('faggots_universe.mod');
	}).catch((err) => {
		console.error('Error loading module:', err);
	});
}

function togglePlay() {
	player.play();
	document.querySelector('button.play').innerText = player.playing ? 'Pause' : 'Play';

	if (player.playing) {
		view.start();
	}
}
