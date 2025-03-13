import './App.css'
import { Routes , Route } from 'react-router'
import Lobby from './screens/Lobby'
import RoomPage from './screens/Room'

function App() {

  return (
    <Routes>
      <Route path='/' element={<Lobby/>}/>
      <Route path='/room/:roomId' element={<RoomPage/>}/>

    </Routes>
  )
}

export default App
