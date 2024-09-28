import React from 'react';
import { Box, Flex, Heading, Button } from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { isAuthenticated } = useAuth();

  return (
    <Box bg="brand.500" py={4} px={6}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading color="white">Pocket Fashion</Heading>
        {isAuthenticated && (
          <Button onClick={onLogout} colorScheme="red">
            Logout
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
