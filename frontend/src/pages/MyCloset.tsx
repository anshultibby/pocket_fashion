import React, { useState, useEffect } from 'react';
import { Box, VStack, Heading, SimpleGrid, Image, Text, Spinner, useToast, Badge, HStack } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// Add this line to define your static endpoint
const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:8000/static/';

interface ClosetItem {
  id: string;
  masked_images: string[];
  category: string;
  subcategory: string;
  color: string;
  attributes: {
    pattern: string;
    material: string;
    style: string;
  };
}

const MyCloset: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      fetchClosetItems();
    }
  }, [isAuthenticated]);

  const fetchClosetItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/closet');
      setClosetItems(response.data.items);
      console.log("Fetched closet items:", response.data.items);
    } catch (error) {
      console.error('Failed to fetch closet items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch closet items. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFullImageUrl = (path: string) => {
    if (path.startsWith('http')) {
      return path; // Return as is if it's already a full URL
    }
    return `${STATIC_BASE_URL}${path}`;
  };

  if (loading) {
    return (
      <Box textAlign="center" p={8}>
        <Spinner size="xl" />
        <Text mt={4}>Loading your closet...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {closetItems.length === 0 ? (
        <Text>Your closet is empty. Add some items to get started!</Text>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={4}>
          {closetItems.map((item) => (
            <Box key={item.id} borderWidth={1} borderRadius="lg" overflow="hidden" p={2}>
              {item.masked_images.length > 0 && (
                <Image 
                  src={getFullImageUrl(item.masked_images[0])} 
                  alt={`Masked item ${item.id}`}
                  objectFit="cover"
                  boxSize="200px"
                />
              )}
              <VStack align="start" mt={2} spacing={2}>
                <HStack>
                  <Badge colorScheme="blue">{item.category}</Badge>
                  <Badge colorScheme="green">{item.subcategory}</Badge>
                  <Badge colorScheme="red">{item.color}</Badge>
                </HStack>
                <Text fontSize="sm">Pattern: {item.attributes.pattern}</Text>
                <Text fontSize="sm">Material: {item.attributes.material}</Text>
                <Text fontSize="sm">Style: {item.attributes.style}</Text>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
};

export default MyCloset;
