import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SchemeGenerator } from './pages/SchemeGenerator';
import { Footer } from './components/layout/Footer';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<SchemeGenerator />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}
