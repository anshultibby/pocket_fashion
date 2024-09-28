import React from 'react';
import { VStack, Button } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/closet', label: 'Closet' },
    { path: '/recommendations', label: 'Recommendations' },
    { path: '/try-on', label: 'Virtual Try-On' },
    { path: '/shopper', label: 'Personal Shopper' },
  ];

  return (
    <VStack spacing={4} align="stretch" p={4} bg="gray.50" width="200px" height="100%">
      {navItems.map((item) => (
        <Button
          key={item.path}
          as={RouterLink}
          to={item.path}
          variant={location.pathname === item.path ? 'solid' : 'outline'}
          colorScheme="brand"
        >
          {item.label}
        </Button>
      ))}
    </VStack>
  );
};

export default Navigation;
