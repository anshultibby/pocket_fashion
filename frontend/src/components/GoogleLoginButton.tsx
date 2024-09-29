import React from 'react';
import { Button, useToast, Box } from '@chakra-ui/react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleLoginButton: React.FC = () => {
  const toast = useToast();
  const history = useHistory();
  const { login } = useAuth();

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const response = await axios.post('http://localhost:8000/api/auth/google', {
          code: codeResponse.code
        });
        
        const { access_token } = response.data;
        localStorage.setItem('token', access_token);
        login(access_token);
        history.push('/dashboard');
        
        toast({
          title: "Login Successful",
          description: "You've been successfully logged in.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error during Google Sign-In:', error);
        toast({
          title: "Login Failed",
          description: "There was an error logging in. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    onError: (error) => {
      console.error('Google Sign-In Error:', error);
      toast({
        title: "Login Failed",
        description: "There was an error with Google Sign-In. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  });

  return (
    <Box>
      <Button
        onClick={() => googleLogin()}
        colorScheme="blue"
        variant="outline"
      >
        Sign in with Google
      </Button>
    </Box>
  );
};

export default GoogleLoginButton;
