'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const request = require('request');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const io = socketIO(server);

let chatId = 1;

//Custom Header pass
var headersOpt = {
    "content-type": "application/json",
};

io.on('connection', (socket) => {
  console.log('Client connected. ID: '+socket.id);

  // usernames which are currently connected to the chat
  let usernames = {};

  // rooms which are currently available in chat
  const rooms = [];

  let roomname;
  let username;

  let data = {};

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
    rooms.push(roomname);
		// send client to room 1
    console.log("The data username is "+socket.username+" while the room name is "+socket.room);
		socket.join(roomname);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to '+roomname);
    // echo to room 1 that a person has connected to their room
		socket.broadcast.to(roomname).emit('updatechat', 'SERVER', username + ' has connected to this room');
		// socket.emit('updaterooms', rooms, 'room1');
    console.log("The active rooms are ", rooms);
    console.log("The current members are ", usernames);
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
    data.sent_date = Date.now()/1000|0;
    data.sender_id = 8;
    request(
            {
            method:'post',
            url:'http://freekenya.blackstar.co.ke/chats',
            // form: {body:'The umpteenth message sent through node',sender_name:'Mulialia',sender_id:8,chatroom:'047_Nairobi',status:10},
            form: data,
            headers: headersOpt,
            json: true,
        }, function (error, response, body) {
            //Print the Response
            console.log(body);
            socket.broadcast.to(roomname).emit('receivechat',{message:body});
    });
    // socket.broadcast.to(roomname).emit('receivechat',{message:data});

    console.log("The data sent is: ",data);

		// io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom){
    console.log("We are now in the switchroom function");
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
    console.log("We have deleted the username");
		// update list of users in chat, client-side
		// io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		// socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
    console.log(username+" has exited "+socket.room);
    console.log("The usernames are: ", usernames);
	});
});

// request(
//         {
//         method:'get',
//         url:'https://test.economy.co.ke/chats',
//         // form: {body:'The first message sent through node',sender_name:'Mulialia',sender_id:8,chatroom:'047_Nairobi',status:10},
//         headers: headersOpt,
//         json: true,
//     }, function (error, response, body) {
//         //Print the Response
//         console.log(body);
// });

// function saveChats(data){
//   console.log("The data inside the saveChats method is ",data);
//   request(
//           {
//           method:'post',
//           url:'http://freekenya.api/chats',
//           form: {body:'The first message sent through node',sender_name:'Mulialia',sender_id:8,chatroom:'047_Nairobi',status:10},
//           // form: data,
//           headers: headersOpt,
//           json: true,
//       }, function (error, response, body) {
//           //Print the Response
//           console.log(body);
//   });
// }

// setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
