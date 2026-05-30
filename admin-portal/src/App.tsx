import './App.css'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AdminDashboard } from './pages/AdminDashboard'
import { LoginPage } from './pages/LoginPage'

function AppShell() {
  const { user } = useAuth()
  return user ? <AdminDashboard /> : <LoginPage />
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App
