import React from 'react';
import { Box, VStack, Heading } from '@chakra-ui/react';
import GoogleLoginButton from '../components/GoogleLoginButton';

const Login: React.FC = () => {
  return (
    <Box p={8} maxWidth="400px" margin="auto">
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center">Login</Heading>
        <GoogleLoginButton />
      </VStack>
    </Box>
  );
};

export default Login;