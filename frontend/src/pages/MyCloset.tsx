import React, { useState, useEffect } from 'react';
import { Box, Image, Spinner, useToast } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// Make sure this is correctly set in your .env file
const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:8000/static/';

interface ClosetItem {
  id: string;
  masked_images: string[];
}

const MyCloset: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchClosetItems = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/user/closet');
        setClosetItems(response.data.items);
      } catch (error) {
        console.error('Error fetching closet items:', error);
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

    fetchClosetItems();
  }, [isAuthenticated, toast]);

  const getFullImageUrl = (path: string) => {
    if (path.startsWith('http')) {
      return path;
    }
    return `${STATIC_BASE_URL}${path}`;
  };

  if (loading) return <Spinner />;

  return (
    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
      {closetItems.flatMap((item) =>
        item.masked_images.map((imagePath, index) => (
          <Box key={`${item.id}-${index}`} height="200px" bg="gray.100" borderRadius="md">
            <Image
              src={getFullImageUrl(imagePath)}
              alt={`Item ${item.id} - Image ${index + 1}`}
              objectFit="contain"
              w="100%"
              h="100%"
            />
          </Box>
        ))
      )}
    </Box>
  );
};

export default MyCloset;
