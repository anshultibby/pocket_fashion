import React, { useEffect, useState } from 'react';
import { Box, Text, Image, useToast, IconButton, Spinner, useDisclosure, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button, Flex } from '@chakra-ui/react';
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
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchUploads();
  }, [isAuthenticated]);

  const fetchUploads = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const getFullImageUrl = (path: string) => {
    if (path.startsWith('http')) {
      return path;
    }
    return `${STATIC_BASE_URL}${path}`;
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/api/user/closet/item/${deleteId}`);
      setUploads(uploads.filter(upload => upload.id !== deleteId));
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
    } finally {
      onClose();
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (uploads.length === 0) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Text fontSize="xl">No uploads found. Add some items to your closet!</Text>
      </Flex>
    );
  }

  return (
    <>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={4}>
        {uploads.map((upload) => (
          <Box key={upload.id} bg="gray.100" borderRadius="md" position="relative" overflow="hidden" transition="transform 0.2s" _hover={{ transform: 'scale(1.05)' }}>
            <Image
              src={getFullImageUrl(upload.image_path)}
              alt={`Upload ${upload.id}`}
              objectFit="contain"
              w="100%"
              h="auto"
              maxH="300px"
            />
            <IconButton
              aria-label="Delete item"
              icon={<DeleteIcon />}
              size="sm"
              position="absolute"
              top={2}
              right={2}
              onClick={() => handleDelete(upload.id)}
              colorScheme="red"
              opacity={0.7}
              _hover={{ opacity: 1 }}
            />
          </Box>
        ))}
      </Box>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Item
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default PastUploads;
