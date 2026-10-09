import { HashRouter, Route, Routes } from 'react-router-dom'
import ToyboxHome from './pages/ToyboxHome'
import JeopardyLibrary from './jeopardy/pages/JeopardyLibrary'
import JeopardyPlay from './jeopardy/pages/JeopardyPlay'
import AdminLayout from './jeopardy/admin/pages/AdminLayout'
import AdminBoards from './jeopardy/admin/pages/AdminBoards'
import AdminEditor from './jeopardy/admin/pages/AdminEditor'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ToyboxHome />} />
        <Route path="/jeopardy" element={<JeopardyLibrary />} />

        {/* Admin must be declared before the dynamic board route. */}
        <Route path="/jeopardy/admin" element={<AdminLayout />}>
          <Route index element={<AdminBoards />} />
          <Route path="new" element={<AdminEditor />} />
          <Route path="edit/:boardId" element={<AdminEditor />} />
        </Route>

        <Route path="/jeopardy/:boardId" element={<JeopardyPlay />} />
        <Route path="*" element={<ToyboxHome />} />
      </Routes>
    </HashRouter>
  )
}
