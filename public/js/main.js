(function (window) {
	var CLOCK_PORT = 5001,
		EPSILON = -1 / 30,

		maxOffset = 1 / 30,
		video = document.getElementById('video'),
		clock = document.getElementById('clock'),
		videoTime = document.getElementById('video-time'),

		targetTime = 0,
		serverUrl,
		remoteClock,
		durationInMilliseconds,
		timeout,
		retries = 0;

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

	function checkAgain(delay) {
		clearTimeout(timeout);
		timeout = setTimeout(checkSync, delay);
	}

	function checkSync() {
		var currentTime,
			current,
			currentBuffered,
			targetBuffered,
			targetDiff,
			currentDiff,

		//currentTime is the time we should be at NOW
		currentTime = (remoteClock.time() % durationInMilliseconds) / 1000;

		//targetTime is the time we're seeking to and want to catch up to later
		//it's a little bit ahead of where we are so we can take time to buffer
		targetTime = Math.max(targetTime, currentTime);

		currentDiff = currentTime - video.currentTime;

		current = currentDiff > EPSILON && currentDiff < maxOffset;
		targetBuffered = isBuffered(targetTime) ||
			(targetTime - video.currentTime < 5) && video.readyState >= 3;
		currentBuffered = isBuffered(currentTime) ||
			(currentTime - video.currentTime < 1) && video.readyState >= 3;

		if (currentBuffered && current) {
			if (video.paused) {
				console.log('buffered and current, so playing', currentTime, video.currentTime);
			}
			video.play();
			retries = 0;
			checkAgain(checkSync, 1000);
			return;
		}
		console.log('targetBuffered', targetBuffered);
		console.log('currentBuffered', currentBuffered);
		console.log('current', current);

		//we missed our window, so seek ahead and try again
		if (currentDiff >= EPSILON) {
			console.log('currentDiff', currentDiff);
			console.log(Math.pow(2, Math.min(4, retries / 2 + 1)));
			targetTime = currentTime + Math.pow(2, Math.min(4, retries / 2 + 1));
			video.pause();
			console.log('missed window, seeking from', video.currentTime, 'to', targetTime, retries, 'retries so far');
			video.currentTime = targetTime;
			retries++;
			maxOffset = Math.max(maxOffset, (retries + 1) * 2 / 30);
			console.log('maxOffset', maxOffset);
			checkAgain(1000);
			return;
		}

		//we haven't caught up yet, so give it a little more time to buffer and check in again
		targetDiff = targetTime - currentTime;
		console.log('waiting to catch up', targetDiff);
		checkAgain(targetDiff * 500);
	}

	function stateUpdate() {
		if (!video.duration) {
			console.log('No video duration yet');
			video.pause();
			return;
		}

		durationInMilliseconds = Math.round(video.duration * 1000);
		if (remoteClock.accuracy() > 100) {
			return;
		}

		checkSync();
	}

	serverUrl = location.protocol + '//' + location.hostname + ':' + CLOCK_PORT + '/time-server';
	remoteClock = new RemoteClock(serverUrl, stateUpdate);

	video.muted = true;
	video.addEventListener('durationchange', stateUpdate, false);
	video.addEventListener('playing', stateUpdate, false);
	video.addEventListener('seeked', stateUpdate, false);
	window.addEventListener('touchstart', function touchstart(evt) {
		video.load();
		evt.preventDefault();
		window.removeEventListener('touchstart', touchstart, true);
	}, true);
	updateClockDisplay();
}(this));