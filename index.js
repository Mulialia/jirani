'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = {};

let roomname;
let username;

io.on('connection', (socket) => {
  console.log('Client connected');

  // socket.on('sendchat', function(data){
  //   socket.broadcast.emit('receivechat',{message:data});
  //   console.log(data);
  // });

  // when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(data){
		// store the username in the socket session for this client
    username = data.username;
		socket.username = username;
		// store the room name in the socket session for this client
    roomname = data.roomname;
    socket.room = roomname;
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
    console.log("The data username is "+socket.username+" while the room name is "+socket.room);
		socket.join(roomname);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to '+roomname);
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(roomname).emit('updatechat', 'SERVER', username + ' has connected to this room');
		// socket.emit('updaterooms', rooms, 'room1');
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
    socket.broadcast.to(roomname).emit('receivechat',{message:data});
    console.log("The data sent is: "+data);

		// io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
		// leave the current room (stored in session)
		socket.leave(socket.room);
		// join new room, received as function parameter
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		// io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		// socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
