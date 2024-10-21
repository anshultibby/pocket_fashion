import React from 'react';
import { Flex, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const TopNavigation = () => {
  return (
    <Flex as="nav" bg="blue.500" color="white" p={4} justifyContent="space-around">
      <Link as={RouterLink} to="/dashboard">Dashboard</Link>
      <Link as={RouterLink} to="/closet">Closet</Link>
      <Link as={RouterLink} to="/recommendations">Recommendations</Link>
      <Link as={RouterLink} to="/try-on">Virtual Try-On</Link>
      <Link as={RouterLink} to="/shopper">Personal Shopper</Link>
    </Flex>
  );
};

export default TopNavigation;

