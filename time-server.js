var server,
	app,
	http = require('http'),
	SockJS = require('sockjs'),
	socket,
	server;

//socket = require('socket.io')(5001);
socket = SockJS.createServer();

socket.on('connection', function(client) {
	'use strict';

	function max(a, b) {
		return a !== undefined && a > b ? a : b;
	}

	function onMessage(data){
		var serverReceived;

		if (!data) {
			return;
		}

		var message = JSON.parse(data);

		console.log(client.id + ': ' + (typeof message) + ': ' + JSON.stringify(message));

		//diff = (client clock - server clock) milliseconds
		serverReceived = Date.now();
		if (message.timing !== undefined) {
			client.maxDiff = max(client.maxDiff, message.timing - serverReceived);

			client.write(JSON.stringify({
				maxDiff: client.maxDiff,
				timing: Date.now()
			}));

			if (client.maxDiff !== undefined) {
				if (message.minDiff !== undefined) {
					client.minDiff = message.minDiff;
					client.timingDiff = client.minDiff + (client.maxDiff - client.minDiff) / 2;
				} else {
					client.timingDiff = client.maxDiff;
				}
			}
		}
	}

	if (!client) {
		console.log('no client!');
		return;
	}
	if (client.remoteAddress) {
		console.log('client connected. ' + client.id + ' (' + client.remoteAddress + ':' + client.remotePort + ')');
	} else {
		console.log('client connected. ' + client.id);
	}

	//console.log('properties', JSON.stringify(properties, null, 4));
	//client.json.send(properties);

	//client.on('message', onMessage);
	client.on('data', onMessage);

	/*
	client.on('disconnect', function(){
		//delete clients[client.id];
		client.removeListener('message', onMessage);
	});
	*/
});

var server = http.createServer();
socket.installHandlers(server, {prefix:'/time-server'});
server.listen(5001);

/*

B:	actual time that server clock started (1/1/1970 @ 12am)
b:	actual time that client clock started (1/1/1970 @ 12am)

Sx:	time that server sent timing packet
rx:	time that client received timing packet

d:	b - B
tx:	transmission time + processing time
dx:	rx - Sx
*solve for d

r0 = S0 + b - B + t0
r0 = S0 + d + t

d = r0 - S0 - t
t = r0 - S0 - d
t = d0 - d, t >= 0

********************************************
d <= d0
d <= d0 && d <= d1  --->  d <= min(d0, d1)
********************************************


sx:	time that client sent timing packet
Rx:	time that server received timing packet

Tx:	transmission time
Dx:	Rx - sX

R1 = s1 + B - b + t1
R1 = s1 - d + t
d = s1 - R1 + t
t = d + R1 - s1
t = D1 + d, t >= 0

********************************************
d >= -D1
d >= -D1 && d >= -D2 --->  d >= max(-D1,-D2)

*/
