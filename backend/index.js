const { Server, Socket } = require('socket.io');

const io = new Server(5000,{
    cors:true,
});

io.on("connection", socket=>{
    console.log("socket Connected with ",socket.id); 
    socket.on('room:join',data=>{
        console.log("socket's data --",data);
    })
});
