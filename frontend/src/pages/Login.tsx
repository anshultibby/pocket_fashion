import React from 'react';
import { Box, Heading, VStack, useToast } from '@chakra-ui/react';
import { GoogleLogin } from '@react-oauth/google';
import axios, { AxiosError } from 'axios';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Add this import
import api from '../api/axios';

const Login: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const toast = useToast();

  const handleSuccess = async (credentialResponse: any) => {
    try {
      const response = await api.post('/api/auth/google', {
        token: credentialResponse.credential
      });
      
      const { access_token, user } = response.data;
      login(access_token, user);
      
      history.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "There was an error logging in. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spacing={8}>
        <Heading>Login to Pocket Fashion</Heading>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            toast({
              title: "Login Failed",
              description: "There was an error logging in. Please try again.",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }}
        />
      </VStack>
    </Box>
  );
}

export default Login;
