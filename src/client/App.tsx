import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SearchResults from './components/SearchResults';
import SitterProfile from './components/SitterProfile';
import Header from './components/Header';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/search" 
            element={
              <>
                <Header />
                <main>
                  <SearchResults />
                </main>
              </>
            } 
          />
          <Route
            path="/sitters/:id"
            element={
              <>
                <Header />
                <main>
                  <SitterProfile />
                </main>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;