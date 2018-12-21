var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var PORT = process.env.PORT || 3000

app.get('/',function(req, res){
    res.sendFile(__dirname+'/index.html');
})
io.on('connection',function(socket){
    console.log('one user connected : '+socket.id);
    socket.on('message',function (data) {
        // console.log(data);
        var sockets = Object.keys(io.sockets.sockets);
        // sockets.forEach(function(sock){
        //     if (sock.id != socket.id){
        //         sock.emit('message',{message:data});
        //     }
        // })
        sockets.forEach(function(sock){
            if (sock.id != socket.id){
                // sock.emit('message',{message:data});
                io.emit('message',{message:data});
            }
        })

    });
    socket.on('disconnect',function () {
        console.log('one user disconnected '+socket.id);
    })
})
http.listen(PORT,function(){
    console.log('Server listening on port '+PORT);
})
