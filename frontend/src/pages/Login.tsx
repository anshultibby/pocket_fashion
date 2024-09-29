import React from 'react';
import { useHistory } from 'react-router-dom';
import { useToast, Box, VStack, Heading, Text } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const Login: React.FC = () => {
  const toast = useToast();
  const { login } = useAuth();
  const history = useHistory();

  const handleLogin = async (response: CredentialResponse) => {
    try {
      const apiResponse = await api.post('/api/auth/google', { token: response.credential });
      const { user } = apiResponse.data;
      login(user);
      history.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Handle login error (show message to user, etc.)
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8}>
        <Heading>Welcome to Pocket Fashion</Heading>
        <Text>Please sign in to continue</Text>
        <GoogleLogin
          onSuccess={handleLogin}
          onError={() => {
            console.log('Login Failed');
            toast({
              title: 'Login failed',
              description: 'An error occurred during login. Please try again.',
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
          }}
        />
      </VStack>
    </Box>
  );
};

export default Login;
