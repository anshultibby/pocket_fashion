import React from 'react';
import { Box, Flex, Button, Link as ChakraLink, Text } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaHome, FaTshirt, FaClipboardList, FaCamera, FaShoppingBag } from 'react-icons/fa';

const TopNavigation: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaHome },
    { name: 'Closet', path: '/closet', icon: FaTshirt },
    { name: 'Recommendations', path: '/recommendations', icon: FaClipboardList },
    { name: 'Virtual Try-On', path: '/try-on', icon: FaCamera },
    { name: 'Personal Shopper', path: '/shopper', icon: FaShoppingBag },
  ];

  return (
    <Box bg="blue.500" py={2} px={4}>
      <Flex justify="space-between" align="center">
        <Flex align="center">
          <Text fontSize="xl" fontWeight="bold" color="white" mr={6}>
            Style Shuffle
          </Text>
          {navItems.map((item) => (
            <ChakraLink
              key={item.path}
              as={RouterLink}
              to={item.path}
              mx={2}
              color={isActive(item.path) ? 'white' : 'whiteAlpha.800'}
              fontWeight={isActive(item.path) ? 'bold' : 'normal'}
              _hover={{ color: 'white', textDecoration: 'none' }}
              display="flex"
              alignItems="center"
            >
              <Box as={item.icon} mr={1} />
              {item.name}
            </ChakraLink>
          ))}
        </Flex>
        <Button colorScheme="red" size="sm" onClick={logout}>
          Logout
        </Button>
      </Flex>
    </Box>
  );
};

export default TopNavigation;
