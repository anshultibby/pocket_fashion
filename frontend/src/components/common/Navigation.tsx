import React from 'react';
import { Box, Flex, VStack, Button, Spacer } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation: React.FC = () => {
  const { logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/closet', label: 'Closet' },
    { path: '/recommendations', label: 'Recommendations' },
    { path: '/try-on', label: 'Virtual Try-On' },
    { path: '/shopper', label: 'Personal Shopper' },
  ];

  return (
    <Flex direction="column" width="200px" bg="gray.100" height="100vh">
      <VStack spacing={4} align="stretch" p={4}>
        {navItems.map((item) => (
          <Button
            key={item.path}
            as={RouterLink}
            to={item.path}
            variant={location.pathname === item.path ? 'solid' : 'ghost'}
          >
            {item.label}
          </Button>
        ))}
        <Button onClick={logout}>Logout</Button>
      </VStack>
    </Flex>
  );
};

export default Navigation;
