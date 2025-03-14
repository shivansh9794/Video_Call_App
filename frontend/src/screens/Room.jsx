import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../service/peer'

const RoomPage = () => {

    const socket = useSocket(); //initializing Socket
    const [remoteSocketId, setRemoteSocketId] = useState();
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();

    // User Join Handling
    const handleUserJoined = useCallback(({ email, id }) => {
        setRemoteSocketId(id);
        console.log(`Email : ${email} Joined Room`);
    }, [])

    // Call handler
    const handleCallUser = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        const offer = await peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer });
        setMyStream(stream);
    }, [remoteSocketId, socket]);

    const handleInCommingCall = useCallback(
        async ({ from, offer }) => {
            try {
                setRemoteSocketId(from);
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                })
                setMyStream(stream);
                console.log(`Incomming call from`, from, offer);
                const ans = await peer.getAnswer(offer);
                socket.emit("call:accepted", { to: from, ans });
            } catch (error) {
                console.error("Error handling incoming call:", error);
            }
        }, [socket]);

    const handleCallAccepted = useCallback(
        async ({ from, ans }) => {
            try {
                peer.setLocalDescription(ans);
                console.log("Call Accepted!");

                for (const track of myStream.getTracks()) {
                    peer.peer.addTrack(track, myStream);
                }
            } catch (error) {
                console.log(error);
            }
        }, [myStream]
    );

    const handleNegotiationNeeded = useCallback(async()=>{
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed',{offer , to: remoteSocketId})
    },[remoteSocketId,socket]);

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded',handleNegotiationNeeded);
        return()=>{
            peer.peer.removeEventListener("negotiationneeded",handleNegotiationNeeded);
        }
    },[handleNegotiationNeeded])
    

    useEffect(() => {
        peer.peer.addEventListener('track', async ev => {
            const remoteStream = ev.streams
            setRemoteStream(remoteStream);
        })
    }, [])
    console.log("hello");
    


    const handleNegotiationNeededIncomming=useCallback(({from,offer})=>{
        const ans=peer.getAnswer(offer);
        socket.emit('peer:nego:done',{to:from , ans})
    },[]);

    const handleNegoFinal=useCallback(async({ans})=>{
        await peer.setLocalDescription(ans)
    },[]);


    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on("incomming:call", handleInCommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed",handleNegotiationNeededIncomming)
        socket.on('peer:nego:final',handleNegoFinal)
        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incomming:call', handleInCommingCall)
            socket.off('call:accepted', handleCallAccepted)
        }
    }, [socket, handleUserJoined, handleInCommingCall, handleCallAccepted])

    return (
        <div>
            <h1 className='heading'>This is my Room Page</h1>
            <h4>{remoteSocketId ? 'Connected' : 'No One in Room'}</h4>
            {remoteSocketId && <button onClick={handleCallUser} className='btn'>CALL</button>}

            <div className='bg-gray-500'>
                <h1 className='heading'>Video 1</h1>
                {
                    myStream && <ReactPlayer playing muted height="100px" width="200px" url={myStream} />
                }
            </div>

            <div className='bg-green-400'>
            <h1 className='heading'>Video 2</h1>
            {
                remoteStream && <ReactPlayer playing muted height="100px" width="200px" url={remoteStream} />
            }
            </div>
        </div>
    )
}

export default RoomPage