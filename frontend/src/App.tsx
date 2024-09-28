import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext'; // Update this import

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Closet from './pages/Closet';
import OutfitRecommendation from './pages/OutfitRecommendation';
import VirtualTryOn from './pages/VirtualTryOn';
import PersonalShopper from './pages/PersonalShopper';

import Header from './components/common/Header';
import Footer from './components/common/Footer';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

const PrivateRoute: React.FC<{
  component: React.ComponentType<any>;
  path: string; 
  exact?: boolean;
}> = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useAuth();
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/" />
        )
      }
    />
  );
};

function App() {
  return (
    <ChakraProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <Router>
            <Header />
            <Switch>
              <Route exact path="/" component={Login} />
              <PrivateRoute path="/dashboard" component={Dashboard} />
              <PrivateRoute path="/closet" component={Closet} />
              <PrivateRoute path="/recommendations" component={OutfitRecommendation} />
              <PrivateRoute path="/try-on" component={VirtualTryOn} />
              <PrivateRoute path="/shopper" component={PersonalShopper} />
            </Switch>
            <Footer />
          </Router>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ChakraProvider>
  );
}

export default App;
