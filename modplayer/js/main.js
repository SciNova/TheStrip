window.onload = function () {
    var canvas = document.getElementById('visualizer'),
        audioWorkletSupport = !!AudioWorkletNode.toString().match(/native code/);

    ModPlayer.init({
        canvas: canvas,
        audioWorkletSupport: audioWorkletSupport
    }).then(() => {
        ModPlayer.loadModule('faggots_universe.mod');
    }).catch((err) => {
        console.error('Error loading module:', err);
    });
}

function togglePlay() {
    ModPlayer.play();
    document.querySelector('button.play').innerText = ModPlayer.playing ? 'Pause' : 'Play';
}
