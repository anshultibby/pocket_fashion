import React from 'react';
import { Button, VStack, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const NavButton: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const activeBgColor = useColorModeValue('blue.500', 'blue.600');
  const activeTextColor = useColorModeValue('white', 'white');
  const inactiveTextColor = useColorModeValue('blue.600', 'blue.200');
  const hoverBgColor = useColorModeValue('blue.100', 'blue.700');

  return (
    <Button
      as={RouterLink}
      to={to}
      variant={isActive ? "solid" : "ghost"}
      bg={isActive ? activeBgColor : "transparent"}
      color={isActive ? activeTextColor : inactiveTextColor}
      _hover={{
        bg: isActive ? activeBgColor : hoverBgColor,
        color: isActive ? activeTextColor : 'blue.500',
      }}
      borderRadius="full"
      width="100%"
      justifyContent="flex-start"
      pl={6}
      py={6}
      fontWeight="medium"
      transition="all 0.2s"
    >
      {children}
    </Button>
  );
};

const Navigation: React.FC = () => {
  return (
    <VStack spacing={4} align="stretch" width="100%" maxWidth="250px" mx="auto">
      <NavButton to="/dashboard">Dashboard</NavButton>
      <NavButton to="/closet">Closet</NavButton>
      <NavButton to="/recommendations">Recommendations</NavButton>
      <NavButton to="/try-on">Try On</NavButton>
      <NavButton to="/shopper">Shopper</NavButton>
    </VStack>
  );
};

export default Navigation;
