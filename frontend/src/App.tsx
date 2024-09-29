import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
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
            <Switch>
              <Route exact path="/" render={() => (
                isAuthenticated ? <Redirect to="/dashboard" /> : <Login />
              )} />
              <PrivateRoute path="/dashboard" component={Dashboard} />
              <PrivateRoute path="/closet" component={Closet} />
              <PrivateRoute path="/recommendations" component={OutfitRecommendation} />
              <PrivateRoute path="/try-on" component={VirtualTryOn} />
              <PrivateRoute path="/shopper" component={PersonalShopper} />
            </Switch>
          </Box>
        </Flex>
        <Footer />
      </Flex>
    </Router>
  );
}

export default App;