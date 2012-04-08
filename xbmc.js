// Sonos Media Controller
// Copyright 2010 Remote Technologies Inc.

System.Print("Boxee: Initializing Driver\r\n");

// CONSTANTS

// GLOBAL VARIABLES

// Not nedded in XBMC 11 (Eden)
//var g_playerList = {audio:0, picture:2, video:3};

// Comm Port Definitions
var g_TCPAddress = Config.Get("TCPAddress");
var g_comm = new TCP(OnCommRx, g_TCPAddress, 9090);
g_comm.OnConnectFunc = TCPConnect;
g_comm.OnDisonnectFunc = TCPDisconnect;


// SYSVARS

// VIEWS

// CONNECTION FUNCTIONS
function TCPConnect() {
	System.Print('----------------------- TCP Connect ------------------------');
}

function TCPDisconnect() {
	System.Print('---------------------- TCP Disconnect ----------------------');
}

// STARTUP CODE STARTS HERE

// Debug info and function
var g_debug = Config.Get("DebugTrace") == "true";
function dbg(msg, val) {
	if (g_debug) {
		if (val === undefined) {
			System.Print('XBMC: ' + msg);
		}
		else {
			System.Print('XBMC: ' + msg + ': ' + val);
		}
	}
}


function OnCommRx(data) {
	dbg(' ');
	dbg(' << ' + data);
	var rtnJSON = eval('(' + data + ')');
	for (var element in rtnJSON){
//		dbg(element + ': ' + rtnJSON[element]);
		switch (element) {
			case 'jsonrpc':
			case 'id':
			case 'params':
				break;
			case 'method':
				dbg('method: ' + rtnJSON.method);
				switch (rtnJSON.method) {
					case 'Player.PlaybackResumed':
						SystemVars.Write('Player', 2);
						SystemVars.Write('Playing', true);
						SystemVars.Write('Paused', false);
						SystemVars.Write('Stopped', false);
						break;
					case 'Player.PlaybackPaused':
						SystemVars.Write('Player', 1);
						SystemVars.Write('Playing', false);
						SystemVars.Write('Paused', true);
						SystemVars.Write('Stopped', false);
						break;
					case 'Player.PlaybackStopped':
						SystemVars.Write('Player', 0);
						SystemVars.Write('Playing', false);
						SystemVars.Write('Paused', false);
						SystemVars.Write('Stopped', true);
						break;
					case 'Player.PlaybackStarted':
//						SendCmd('VideoPlaylist.GetItems', 'title');
						SendCmd('Player.GetActivePlayers', 'player');
						SystemVars.Write('Player', 2);
						SystemVars.Write('Playing', true);
						SystemVars.Write('Paused', false);
						SystemVars.Write('Stopped', true);
						SystemVars.Write('Chapter', 1);
						break;
					case 'Player.PlaybackSeekChapter':
						SystemVars.Write('Chapter', rtnJSON.params.chapter);
						break;
					case 'Player.PlaybackSpeedChanged':
						var speed = parseInt(rtnJSON.params.speed,10);
						dbg('Speed: ' + speed);
						SystemVars.Write('FastForward',speed>1)
						if (speed>1) {
							SystemVars.Write('Player', 3);
						}
						SystemVars.Write('Rewind',speed<0)
						if (speed<0) {
							SystemVars.Write('Player', 4);
						}
						SystemVars.Write('Speed',Math.abs(speed));
						SystemVars.Write('Playing', speed==1);
						break;
				}
				break;
			case 'result':
				switch (rtnJSON.id) {
					case 'title':
						SystemVars.Write('Title', rtnJSON.result.items[0].label);
						dbg('Title', rtnJSON.result.items[0].label);
						break;
					case 'volume':
						SystemVars.Write('Volume', rtnJSON.result);
						dbg('Volume', rtnJSON.result);
						if (rtnJSON.result > 0) {
							SystemVars.Write('Mute', false);
						}
						break;
					case 'mute':
						SystemVars.Write('Mute', rtnJSON.result == 0);
						dbg('Mute', rtnJSON.result == 0);
						break;
					case 'player': 
						var currPlayer;
						SystemVars.Write('AudioPlayer', rtnJSON.result.audio);
						if (rtnJSON.result.audio) {
							SystemVars.Write('ActivePlayer', 0);
							SendParams('AudioPlaylist.GetItems', '{"limits":{"start":0, "end":1}}', 'current');
						}
						SystemVars.Write('PicturePlayer', rtnJSON.result.picture);
						if (rtnJSON.result.picture) {
							SystemVars.Write('ActivePlayer', 1);
						}
						SystemVars.Write('VideoPlayer', rtnJSON.result.video);
						if (rtnJSON.result.video) {
							SystemVars.Write('ActivePlayer', 2);
							SendCmd('VideoPlaylist.GetItems', 'title');
						}
						break;
					case 'current':
						var current = rtnJSON.result.state.current;
						SystemVars.Write('Current', current+1);
						dbg('Current', current+1);
						SystemVars.Write('PLSize', rtnJSON.result.limits.total);
						dbg('PLSize', rtnJSON.result.limits.total);
						SendParams('AudioPlaylist.GetItems', '{"limits":{"start":' + current + ', "end":' + (current+1) + '}, "fields":["title","artist","album":"thumbnail"]}', 'audioMetadata');
						break;
					case 'audioMetadata':
						SystemVars.Write('AudioTitle', rtnJSON.result.items[0].title);
						dbg('AudioTitle', rtnJSON.result.items[0].title);
						SystemVars.Write('Album', rtnJSON.result.items[0].album);
						SystemVars.Write('Artist', rtnJSON.result.items[0].artist);
						SystemVars.Write('Banner', rtnJSON.result.items[0].label);
						break;
				}
				break;
		}
	}
}

function SendCmd(cmd, id) {
	if (id === undefined) {
		id = '1'
	}
	g_comm.Write('{"jsonrpc":"2.0", "method":"' + cmd + '", "id":"' + id + '"}')
	dbg('{"jsonrpc":"2.0", "method":"' + cmd + '", "id":"' + id + '"}')
}

function SendParams(cmd, params, id) {
	if (id === undefined) {
		id = '1'
	}
	if (params === undefined) {
		params = '[]'
	}
	g_comm.Write('{"jsonrpc":"2.0", "method":"' + cmd + '", "params":' + params + ', "id":"' + id + '"}');
	dbg('{"jsonrpc":"2.0", "method":"' + cmd + '", "params":' + params + ', "id":"' + id + '"}');
}

function SetVolume(volume, cmd) {
	g_comm.Write('{"jsonrpc": "2.0", "method":"' + cmd + '", "params":{"value":' + volume + '}, "id":"volume"}')
	dbg('{"jsonrpc": "2.0", "method":"' + cmd + '", "params":{"value":' + volume + '}, "id":"volume"}')
}
