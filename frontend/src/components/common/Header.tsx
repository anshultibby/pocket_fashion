import React from 'react';
import { Box, Flex, Heading, Button } from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Box bg="brand.500" py={4} px={6}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading color="white">Style Shuffle</Heading>
        {isAuthenticated && (
          <Button onClick={handleLogout} colorScheme="red">
            Logout
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
