import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import ReactPlayer from 'react-player'
import peer from '../service/peer'

const RoomPage = () => {

    const socket = useSocket(); //initializing Socket

    // ALl the States
    const [remoteSocketId, setRemoteSocketId] = useState();
    const [myStream, setMyStream] = useState();
    const [remoteStream, setRemoteStream] = useState();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);

    // User Join Handling
    const handleUserJoined = useCallback(
        ({ email, id }) => {
            setRemoteSocketId(id);
            console.log(`Email : ${email} Joined Room`);
        }, []
    );

    // Call handler
    const handleCallUser = useCallback(
        async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            })
            const offer = await peer.getOffer();
            socket.emit("user:call", { to: remoteSocketId, offer });
            setMyStream(stream);
        }, [remoteSocketId, socket]
    );

    // Handling Incomming Call
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
        }, [socket]
    );

    // Sending Video Strems to receiver Side
    const sendStrems = useCallback(
        () => {
            for (const track of myStream.getTracks()) {
                peer.peer.addTrack(track, myStream);
            }
        }, [myStream]
    );

    // Handling call Accepted
    const handleCallAccepted = useCallback(
        async ({ from, ans }) => {
            try {
                peer.setLocalDescription(ans);
                setCallAccepted(true);
                console.log("Call Accepted!");
                sendStrems();
            } catch (error) {
                console.log(error);
            }
        }, [sendStrems]
    );

    // Negotiation Handling
    const handleNegotiationNeeded = useCallback(
        async () => {
            const offer = await peer.getOffer();
            socket.emit('peer:nego:needed', { offer, to: remoteSocketId })
        }, [remoteSocketId, socket]
    );

    useEffect(() => {
        peer.peer.addEventListener('negotiationneeded', handleNegotiationNeeded);
        return () => {
            peer.peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
        }
    }, [handleNegotiationNeeded]);

    // Handlinhg Incomming Negotiation Needs 
    const handleNegotiationNeededIncomming = useCallback(
        async ({ from, offer }) => {
            const ans = await peer.getAnswer(offer);
            socket.emit('peer:nego:done', { to: from, ans })
        }, [socket]);


    // Final Negotiaton
    const handleNegoFinal = useCallback(
        async ({ ans }) => {
            await peer.setLocalDescription(ans)
        }, []
    );

    // End Call
    const handleEndCall = useCallback(
        () => {
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop()); // Stop local tracks
            }
            if (remoteStream) {
                remoteStream.getTracks().forEach(track => track.stop()); // Stop remote tracks
            }

            setMyStream(null);
            setRemoteStream(null);
            setCallAccepted(false);
            setCallEnded(true);
            setRemoteSocketId(null);

            socket.emit("call:ended", { to: remoteSocketId }); // Notify the other user
        }, [myStream, remoteStream, remoteSocketId, socket]
    );

    useEffect(() => {
        socket.on("call:ended", () => {
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
            }
            if (remoteStream) {
                remoteStream.getTracks().forEach(track => track.stop());
            }

            setMyStream(null);
            setRemoteStream(null);
            setCallAccepted(false);
            setCallEnded(true);
            setIsCaller(false);
            setRemoteSocketId(null);
        });

        return () => {
            socket.off("call:ended");
        };
    }, [socket, myStream, remoteStream]);



    useEffect(() => {
        peer.peer.addEventListener("track", async (ev) => {
            const remoteStream = ev.streams;
            console.log("Got Tracks!!!!");
            setRemoteStream(remoteStream[0]);
        });
    }, []);


    useEffect(() => {
        socket.on('user:joined', handleUserJoined);
        socket.on("incomming:call", handleInCommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego:needed", handleNegotiationNeededIncomming)
        socket.on('peer:nego:final', handleNegoFinal)
        return () => {
            socket.off('user:joined', handleUserJoined)
            socket.off('incomming:call', handleInCommingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off("peer:nego:needed", handleNegotiationNeededIncomming)
            socket.off('peer:nego:final', handleNegoFinal)
        }
    }, [socket, handleUserJoined, handleInCommingCall, handleCallAccepted, handleNegotiationNeededIncomming, handleNegoFinal])


    return (
        <div>
            <h1 className='heading'>This is my Room Page</h1>

            <h1 className={`font-semibold ${remoteSocketId ? 'text-green-500' : 'text-red-600'}`}>{remoteSocketId ? 'Connected' : 'No One is Online'}</h1>

            <div className='grid grid-cols-2 w-full'>

                <div className='col-span-1 bg-gray-500 w-[100%] h-[90vh] flex flex-col justify-center items-center'>
                    <h1 className='heading'>Sender's Video</h1>
                    {myStream && <ReactPlayer playing height="450px" width="300px" url={myStream} />}
                    {remoteSocketId && !myStream && <button onClick={handleCallUser} className='btn'>CALL</button>}
                </div>

                <div className='bg-green-400 col-span-1 w-[100%] h-[90vh] flex flex-col justify-center items-center'>
                    <h1 className='heading'>Receiver's Video</h1>
                    {remoteStream && <ReactPlayer playing height="450px" width="300px" url={remoteStream} />}
                    {myStream && !callAccepted && <button className='btn' onClick={sendStrems}>Accept Call</button>}
                </div>
            </div>


        </div>
    )
}

export default RoomPage
