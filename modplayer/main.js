let player, view;

const FADE_DURATION = 2;

const TRACKS = [
	'mods/faggots_universe.mod',
	'mods/viraxor_-_backdoor2.mod',
	'mods/thumbknack.mod',
	'mods/war_in_the_middle_earth.s3m',
	'mods/2nd_reality.s3m',
	'mods/heavy_gargoyle_theme.s3m',
	'mods/Spltfest.s3m',
	'mods/skaven-invtro94_music.s3m',
	'mods/intro_music_ii.s3m',
	'mods/mangrove.s3m',
	'mods/suzys_grease_pit.s3m',
	'mods/SYMPHONY.S3M',
	'mods/party_1992_intromusic.s3m',
	'mods/A94FINAL.S3M',
	'mods/ICEFRONT.S3M'
];

window.onload = function () {
	player = new ModPlayerHost();
	view = new ModPlayerView(document.getElementById('visualizer'));
	view.attach(player);

	// exposed for debugging in devtools
	window.player = player;
	window.view = view;

	const select = document.getElementById('track');
	populateTrackList(select);
	select.addEventListener('change', () => loadTrack(select.value));

	player.init().then(() => {
		return loadTrack(TRACKS[0]);
	}).catch((err) => {
		console.error('Error loading module:', err);
	});
}

/**
 * Adds one <option> per track immediately (so the list is usable right away),
 * then fills in each one's track count in the background once its header
 * has been fetched and parsed.
 */
function populateTrackList(select) {
	TRACKS.forEach(async (path) => {
		const name = path.split('/').pop();
		const option = document.createElement('option');
		option.value = path;
		option.textContent = name;
		select.appendChild(option);

		try {
			const channelCount = await getTrackChannelCount(path);
			option.textContent = `${name} (${channelCount})`;
		} catch (err) {
			console.error(`Could not read track count for ${path}:`, err);
		}
	});
}

async function getTrackChannelCount(path) {
	const response = await fetch(path);

	if (!response.ok) {
		throw new Error(`${response.statusText} (${response.status})`);
	}

	const buffer = await response.arrayBuffer();
	const song = S3mLoader.isModule(buffer) ? S3mLoader.load(buffer) : ModLoader.load(buffer);

	return song.channelCount;
}

function loadTrack(path) {
	return player.loadModule(path).then(() => {
		document.querySelector('button.play').innerText = 'Play';
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
