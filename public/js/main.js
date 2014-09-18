(function (window) {
	var CLOCK_PORT = 5001,
		video = document.getElementById('video'),
		clock = document.getElementById('clock'),
		videoTime = document.getElementById('video-time'),
		serverUrl,
		remoteClock;

	/*
	This runs whenever either the clock accuracy changes or the video duration changes.
	*/

	function isBuffered(time) {
		var i;
		if (!video.buffered) {
			return true;
		}

		for (i = 0; i < video.buffered.length; i++) {
			if (video.buffered.start(i) > time) {
				return false;
			}
			if (video.buffered.end(i) >= time) {
				return true;
			}
		}
		return false;
	}

	function updateClockDisplay() {
		clock.innerHTML = (new Date(remoteClock.time())).toTimeString();
		videoTime.innerHTML = video.currentTime;
		requestAnimationFrame(updateClockDisplay);
	}

	function checkSync() {
		var currentTime,
			durationInMilliseconds,
			diff;

		durationInMilliseconds = Math.round(video.duration * 1000);
		currentTime = (remoteClock.time() % durationInMilliseconds) / 1000;
		
		diff = Math.abs(video.currentTime - currentTime);
		if (diff > 0.2 || isBuffered(currentTime) && diff > 0.1) {
			console.log('seeking and playing', currentTime);
		}
	}

	function stateUpdate() {
		if (!video.duration) {
			console.log('No video duration yet');
			video.pause();
			return;
		}

		if (remoteClock.accuracy() > 100) {
			return;
		}

		checkSync();
		video.play();
	}

	serverUrl = location.protocol + '//' + location.hostname + ':' + CLOCK_PORT + '/time-server';
	remoteClock = new RemoteClock(serverUrl, stateUpdate);

	video.muted = true;
	video.addEventListener('durationchange', stateUpdate, false);
	video.addEventListener('playing', stateUpdate, false);
	setInterval(checkSync, 1000);
	updateClockDisplay();
}(this));