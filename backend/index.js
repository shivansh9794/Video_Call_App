const { Server, Socket } = require('socket.io');

const io = new Server(5000,{
    cors:true,
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", socket=>{
    console.log("socket Connected with ",socket.id); 
    socket.on('room:join',data=>{
        const {email,room}=data;
        emailToSocketIdMap(email,socket.id);
        socketIdToEmailMap(socket.id,email);
        console.log("socket's data --",data);
        socket.to("room:join",data);
    })
});
