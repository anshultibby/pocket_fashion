import React from 'react';
import { VStack, Button, Icon } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FaHome, FaTshirt, FaClipboardList, FaCamera, FaShoppingBag } from 'react-icons/fa';

export const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FaHome },
  { path: '/closet', label: 'Closet', icon: FaTshirt },
  { path: '/recommendations', label: 'Recommendations', icon: FaClipboardList },
  { path: '/try-on', label: 'Virtual Try-On', icon: FaCamera },
  { path: '/shopper', label: 'Personal Shopper', icon: FaShoppingBag },
];

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <VStack spacing={4} align="stretch" p={4} bg="gray.50" width="200px" height="100%">
      {navItems.map((item) => (
        <Button
          key={item.path}
          as={RouterLink}
          to={item.path}
          variant={location.pathname === item.path ? 'solid' : 'outline'}
          colorScheme="brand"
          leftIcon={<Icon as={item.icon} />}
        >
          {item.label}
        </Button>
      ))}
    </VStack>
  );
};

export default Navigation;
