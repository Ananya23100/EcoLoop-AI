import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import UploadPage from './pages/UploadPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-green-700 text-white py-4 px-6 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold">🌱 EcoLoop AI</span>
            </Link>
            <p className="text-green-100 text-sm hidden sm:block">
              AI-Powered Sustainability Platform
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto py-8 px-4">
          <Routes>
            <Route path="/" element={<UploadPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-gray-400 text-sm">
          Built for Amazon HackOn 2026
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
