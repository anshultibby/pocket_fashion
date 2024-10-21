import React, { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Image, Button, VStack, Text } from '@chakra-ui/react';
import axios from 'axios';

interface ClosetItem {
  id: string;
  image_path: string;
  masked_images: string[];
}

const MyCloset: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);

  useEffect(() => {
    fetchClosetItems();
  }, []);

  const fetchClosetItems = async () => {
    try {
      const response = await axios.get('/api/closet-items');
      setClosetItems(response.data);
    } catch (error) {
      console.error('Failed to fetch closet items:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await axios.delete(`/api/closet-items/${itemId}`);
      setClosetItems(closetItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getImageUrl = (path: string) => `${process.env.REACT_APP_API_URL}${path}`;

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>My Closet</Heading>
      {closetItems.length > 0 ? (
        <VStack spacing={6} align="stretch">
          {closetItems.map((item) => (
            <Box key={item.id} borderWidth={1} borderRadius="lg" overflow="hidden" p={4}>
              <SimpleGrid columns={5} spacing={4} alignItems="center">
                {item.image_path && (
                  <Image
                    src={getImageUrl(item.image_path)}
                    alt="Original Image"
                    objectFit="contain"
                    maxH="200px"
                    w="100%"
                  />
                )}
                {Array.isArray(item.masked_images) && item.masked_images.map((maskedPath, index) => (
                  <Image
                    key={index}
                    src={getImageUrl(maskedPath)}
                    alt={`Masked image ${index + 1}`}
                    objectFit="contain"
                    maxH="200px"
                    w="100%"
                  />
                ))}
                <Button onClick={() => deleteItem(item.id)} size="sm" colorScheme="red">
                  Delete
                </Button>
              </SimpleGrid>
            </Box>
          ))}
        </VStack>
      ) : (
        <Text>Your closet is empty. Add some items!</Text>
      )}
    </Box>
  );
};

export default MyCloset;
