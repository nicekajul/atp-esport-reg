import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DetailsPage from './pages/DetailsPage.jsx'
import MechanicsPage from './pages/MechanicsPage.jsx'
import BracketPage from './pages/BracketPage.jsx'

export default function App() {
  return (
    <div className="bg-rays relative flex min-h-screen flex-col items-center px-4 py-10">
      <NavBar />
      <main className="flex w-full flex-1 items-start justify-center">
        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/details" element={<DetailsPage />} />
          <Route path="/mechanics" element={<MechanicsPage />} />
          <Route path="/bracket" element={<BracketPage />} />
        </Routes>
      </main>
    </div>
  )
}
