(function (window) {

	function RemoteClock(server, callback) {
		var synced = false,
			done = false,
			socket,
			minDiff = Infinity,
			maxDiff = -Infinity,
			accuracy = Infinity,
			timingDiff = 0;

		function onMessage(evt) {
			var clientReceived,
				improved = 0,
				acc;

			if (!evt.data) {
				return;
			}

			var message = JSON.parse(evt.data);
			console.log('message', message);

			clientReceived = Date.now();

			if (message.timing !== undefined) {
				minDiff = Math.min(minDiff, clientReceived - message.timing);

				if (minDiff !== undefined) {
					if (message.maxDiff !== undefined) {
						maxDiff = message.maxDiff;
						timingDiff = minDiff + (maxDiff - minDiff) / 2;

						acc = Math.abs(maxDiff - minDiff);
						improved = accuracy - acc;
						accuracy = acc;
						console.log('remote clock', Date.now() - timingDiff, timingDiff, accuracy);
						if (acc < 200) {
							if (!synced) {
								synced = true;
								//todo: fire callback
							}

							if (acc < 50) {
								done = true;
							}
						}
						if ((improved >= 10 || done) && callback) {
							callback();
						}
					} else {
						timingDiff = minDiff;
					}
				}
			}
		}

		function requestTiming() {
			socket.send(JSON.stringify({
				action: 'sync',
				minDiff: minDiff,
				timing: Date.now()
			}));
			if (!done) {
				setTimeout(requestTiming, 1000);
			}
		}

		if (!window.SockJS) {
			throw new Error('Unable to initialize RemoteSync. Missing SockJS');
		}

		socket = new SockJS(server || location.origin);
		socket.onmessage = onMessage;
		socket.onopen = requestTiming;

		this.time = function () {
			return Date.now() - timingDiff;
		};

		this.accuracy = function () {
			return accuracy;
		};
	}

	window.RemoteClock = RemoteClock;
}(this));