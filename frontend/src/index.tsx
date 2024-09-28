import React from 'react';
import ReactDOM from 'react-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { theme } from './theme';
import App from './App';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
