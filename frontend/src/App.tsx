import React, { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
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

function App() {
  const { isAuthenticated, login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/api/auth/verify');
        if (response.data) {
          login(response.data);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [login]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Flex direction="column" minHeight="100vh">
        <Header />
        <Flex flex={1}>
          {isAuthenticated && <Navigation />}
          <Box flex={1}>
            <Switch>
              <Route exact path="/" render={() => (
                isAuthenticated ? <Redirect to="/dashboard" /> : <Login />
              )} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/closet" component={Closet} />
              <Route path="/recommendations" component={OutfitRecommendation} />
              <Route path="/try-on" component={VirtualTryOn} />
              <Route path="/shopper" component={PersonalShopper} />
            </Switch>
          </Box>
        </Flex>
        <Footer />
      </Flex>
    </Router>
  );
}

export default App;
