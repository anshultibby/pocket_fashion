import React, { useEffect, useState } from 'react';
import { Box, Heading, VStack, Text, Image, useToast, IconButton } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { DeleteIcon } from '@chakra-ui/icons';

// Add this line to define your static endpoint
const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:8000/static/';

interface UploadedImage {
  id: string;
  image_path: string;
}

const PastUploads: React.FC = () => {
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchUploads = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const response = await api.get('/api/user/closet/uploads');
        setUploads(response.data.uploads);
      } catch (error) {
        console.error('Error fetching past uploads:', error);
        toast({
          title: "Error",
          description: "Failed to fetch past uploads. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchUploads();
  }, [isAuthenticated, toast]);

  const getFullImageUrl = (path: string) => {
    if (path.startsWith('http')) {
      return path; // Return as is if it's already a full URL
    }
    return `${STATIC_BASE_URL}${path}`;
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await api.delete(`/api/user/closet/item/${id}`);
      setUploads(uploads.filter(upload => upload.id !== id));
      toast({
        title: "Success",
        description: "Item deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
      {uploads.map((upload) => (
        <Box key={upload.id} height="200px" bg="gray.100" borderRadius="md" position="relative">
          <Image
            src={getFullImageUrl(upload.image_path)}
            alt={`Upload ${upload.id}`}
            objectFit="contain"
            w="100%"
            h="100%"
          />
          <IconButton
            aria-label="Delete item"
            icon={<DeleteIcon />}
            size="sm"
            position="absolute"
            top={2}
            right={2}
            onClick={() => handleDelete(upload.id)}
          />
        </Box>
      ))}
    </Box>
  );
};

export default PastUploads;
