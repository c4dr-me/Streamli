// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import { AnimatePresence } from 'framer-motion';

function App() {
  return (
    <AnimatePresence>
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
      </Router>
      </AnimatePresence>
  );
}

export default App;
