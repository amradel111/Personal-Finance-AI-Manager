import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Personal Finance AI Manager
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  ✅ Setup Complete!
                </h2>
                <p className="text-gray-600 mb-4">
                  Frontend: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5173</code>
                </p>
                <p className="text-gray-600 mb-4">
                  Backend: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:5000</code>
                </p>
                <p className="text-green-600 font-semibold">
                  🚀 Ready to start building Phase 2!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
