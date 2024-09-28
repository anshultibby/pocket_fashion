import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import api from './api/axios';

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
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
      logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      logout();
      window.location.href = '/';
    }
  };

  return (
    <Router>
      <Flex>
        {isAuthenticated && <Navigation />}
        <Box flex={1}>
          <Header onLogout={handleLogout} />
          <Switch>
            <Route exact path="/" component={Login} />
            <PrivateRoute path="/dashboard" component={Dashboard} />
            <PrivateRoute path="/closet" component={Closet} />
            <PrivateRoute path="/recommendations" component={OutfitRecommendation} />
            <PrivateRoute path="/try-on" component={VirtualTryOn} />
            <PrivateRoute path="/shopper" component={PersonalShopper} />
          </Switch>
          <Footer />
        </Box>
      </Flex>
    </Router>
  );
}

export default App;
