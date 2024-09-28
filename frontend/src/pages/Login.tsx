import React from 'react';
import { Box, Heading, VStack, useToast } from '@chakra-ui/react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import axios, { AxiosError } from 'axios';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Add this import

const Login: React.FC = () => {
  const toast = useToast();
  const history = useHistory();
  const { login } = useAuth(); // Add this line

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await axios.post('http://localhost:8000/api/auth/google', {
        token: credentialResponse.credential
      });
      
      // Store the token from your backend
      localStorage.setItem('token', response.data.access_token);
      
      // Call the login function from AuthContext
      login(); // Add this line
      
      // Redirect to dashboard
      history.push('/dashboard');
      
      toast({
        title: "Login Successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = "There was an error logging in. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.detail || errorMessage;
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
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
};

export default Login;
