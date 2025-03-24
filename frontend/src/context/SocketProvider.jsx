import React,{createContext, useContext, useMemo} from "react";
import {io} from 'socket.io-client'
import { baseUrl } from "../config/keyConfig";

const SocketContext = createContext(null);

export const useSocket=()=>{
    return useContext(SocketContext);
}


export const SocketProvider=(props)=>{

    const socket = useMemo(()=>io(baseUrl),[]);
    
    return(
        <SocketContext.Provider value={socket}>
            {props.children}
        </SocketContext.Provider>
    )
}