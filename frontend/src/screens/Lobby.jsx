import React, { useCallback, useState } from 'react'
import { useSocket } from '../context/SocketProvider';

const Lobby = () => {

  const [formData, setFormData] = useState({ email: "", room: "" });
  const socket = useSocket()
  console.log(socket);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    console.log("data -->>", formData);
    socket.emit('room:join',formData);
  },[formData,socket]
  );



  return (
    <div className='bg-[#200c0c3f] w-full h-[100vh]'>

      <h1 className='heading' >Video Call Lobby</h1>

      <div className='flex w-full h-full justify-center items-start mt-5'>

        <form action="" onSubmit={handleSubmit} className='flex flex-col gap-2 bg-[#631818d8]
         backdrop-blur-3xl w-[50%] p-6 rounded-2xl justify-center items-center'>

          <input
            className='input'
            type="email"
            name="email"
            id="email"
            placeholder='Email ID......'
            value={formData.email}
            onChange={handleChange}
          />

          <input
            className='input'
            type="text"
            name="room"
            id="room"
            placeholder='Room......'
            value={formData.room}
            onChange={handleChange}
          />

          <button className='btn' type='submit'>Submit</button>
        </form>

      </div>

    </div>
  )
}

export default Lobby