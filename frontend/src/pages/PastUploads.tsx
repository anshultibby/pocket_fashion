import React, { useEffect, useState } from 'react';
import { Box, Heading, VStack, Text, Image, useToast } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

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

  return (
    <Box>
      <Heading mb={4}>Past Uploads</Heading>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
        {uploads.map((upload) => (
          <Image
            key={upload.id}
            src={getFullImageUrl(upload.image_path)}
            alt={`Upload ${upload.id}`}
            objectFit="cover"
            w="100%"
            h="200px"
            borderRadius="md"
          />
        ))}
      </Box>
    </Box>
  );
};

export default PastUploads;
