let mixer, view;
// 1-indexed to match the two rows in index.html
const trackers = {};

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
	mixer = new Mixer();
	view = new MixerView(document.getElementById('visualizer'));

	// exposed for debugging in devtools
	window.mixer = mixer;
	window.view = view;

	[1, 2].forEach((n) => {
		const select = document.getElementById(`track${n}`);
		populateTrackList(select);
		// give the two rows different starting songs by default
		select.selectedIndex = n - 1;
		select.addEventListener('change', () => loadTrack(n, select.value));
	});

	mixer.init().then(() => {
		view.attach(mixer);
		return loadTrack(1, document.getElementById('track1').value);
		// track 2 stays unloaded until picked or played, so opening the page
		// is the single-track case; pressing play on row 2 makes it two at once
	}).catch((err) => {
		console.error('Error initializing mixer:', err);
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
	const bytes = await fetchBytes(path);
	const song = S3mLoader.isModule(bytes) ? S3mLoader.load(bytes) : ModLoader.load(bytes);

	return song.channelCount;
}

/**
 * The one platform-specific byte-source for this demo page. Tracker.loadSong()
 * itself only ever sees a plain byte array - on the ESP32 the equivalent of
 * this function reads from an SD card instead, with no other code changing.
 */
async function fetchBytes(url) {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`${response.statusText} (${response.status})`);
	}

	return await response.arrayBuffer();
}

function loadTrack(n, path) {
	if (!trackers[n]) {
		trackers[n] = mixer.createTracker();
		window[`tracker${n}`] = trackers[n];
	}

	document.querySelector(`button.play${n}`).innerText = 'Play';

	return fetchBytes(path).then((bytes) => trackers[n].loadSong(bytes)).catch((err) => {
		console.error(`Error loading module into tracker ${n}:`, err);
	});
}

function toggleTrack(n) {
	const path = document.getElementById(`track${n}`).value;

	// row 2 (and any further row, in principle) only actually gets a
	// Tracker/reserved mixer capacity once it's used for the first time
	const ready = trackers[n] && trackers[n].loaded;

	const afterReady = ready ? Promise.resolve() : loadTrack(n, path);

	afterReady.then(() => {
		trackers[n].togglePlay();
		document.querySelector(`button.play${n}`).innerText = trackers[n].playing ? 'Pause' : 'Play';
	});
}
