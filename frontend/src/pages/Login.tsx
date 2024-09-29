import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Box, VStack, Heading, Text, Button, useToast } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Login: React.FC = () => {
  const toast = useToast();
  const { login } = useAuth();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    if (code) {
      handleGoogleCallback(code);
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    try {
      const response = await api.get('/api/auth/google');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error initiating Google login:', error);
      toast({
        title: 'Login failed',
        description: 'An error occurred during login. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGoogleCallback = async (code: string) => {
    try {
      const response = await api.get(`/api/auth/google/callback?code=${code}`);
      const { access_token } = response.data;
      await login(access_token);
      history.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login failed',
        description: 'An error occurred during login. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <VStack spacing={8}>
        <Heading>Welcome to Pocket Fashion</Heading>
        <Text>Please sign in to continue</Text>
        <Button onClick={handleGoogleLogin} colorScheme="blue">
          Sign in with Google
        </Button>
      </VStack>
    </Box>
  );
};

export default Login;