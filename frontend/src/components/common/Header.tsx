import React from 'react';
import { Box, Flex, Heading, Button, Container } from '@chakra-ui/react';
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
    <Box bg="brand.500" py={3}>
      <Container maxW="container.xl">
        <Flex alignItems="center" justifyContent="space-between">
          <Heading size="lg" color="white">Style Shuffle</Heading>
          {isAuthenticated && (
            <Button onClick={handleLogout} colorScheme="red" size="sm">
              Logout
            </Button>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default Header;
