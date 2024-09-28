import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const OutfitRecommendation: React.FC = () => {
  return (
    <Box p={8}>
      <Heading mb={4}>Outfit Recommendations</Heading>
      <Text>Your personalized outfit suggestions will appear here.</Text>
    </Box>
  );
};

export default OutfitRecommendation;
