import { HashRouter, Route, Routes } from 'react-router-dom'
import ToyboxHome from './pages/ToyboxHome'
import JeopardyLibrary from './jeopardy/pages/JeopardyLibrary'
import JeopardyPlay from './jeopardy/pages/JeopardyPlay'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ToyboxHome />} />
        <Route path="/jeopardy" element={<JeopardyLibrary />} />
        <Route path="/jeopardy/:boardId" element={<JeopardyPlay />} />
        <Route path="*" element={<ToyboxHome />} />
      </Routes>
    </HashRouter>
  )
}
