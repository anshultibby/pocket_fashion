import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';  // Import the CSS file

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Closet from './pages/Closet';
import OutfitRecommendation from './pages/OutfitRecommendation';
import VirtualTryOn from './pages/VirtualTryOn';
import PersonalShopper from './pages/PersonalShopper';

import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Navigation from './components/common/Navigation';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Flex direction="column" minHeight="100vh">
        <Header />
        <Flex flex={1}>
          {isAuthenticated && <Navigation />}
          <Box flex={1} bg="gray.50">
            <Routes>
              <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/closet" element={<PrivateRoute><Closet /></PrivateRoute>} />
              <Route path="/recommendations" element={<PrivateRoute><OutfitRecommendation /></PrivateRoute>} />
              <Route path="/try-on" element={<PrivateRoute><VirtualTryOn /></PrivateRoute>} />
              <Route path="/shopper" element={<PrivateRoute><PersonalShopper /></PrivateRoute>} />
            </Routes>
          </Box>
        </Flex>
        <Footer />
      </Flex>
    </Router>
  );
}

export default App;