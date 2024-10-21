import React, { useState, useEffect, useRef } from 'react';
import { Box, Image, Spinner, useToast, Grid, VStack, HStack, IconButton, useDisclosure, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// Make sure this is correctly set in your .env file
const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:8000/static/';

interface ClosetItem {
  id: string;
  image_path: string;
  clothes_mask: string;
  masked_images: string[];
}

const MyCloset: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

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

  const handleDelete = (id: string) => {
    setDeleteId(id);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/api/user/closet/item/${deleteId}`);
      setClosetItems(closetItems.filter(item => item.id !== deleteId));
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

  if (loading) return <Spinner />;

  return (
    <>
      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
        {closetItems.map((item) => (
          <Box key={item.id} borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} boxShadow="md" position="relative">
            <IconButton
              aria-label="Delete item"
              icon={<DeleteIcon />}
              size="sm"
              position="absolute"
              top={2}
              right={2}
              onClick={() => handleDelete(item.id)}
              colorScheme="red"
              opacity={0.7}
              _hover={{ opacity: 1 }}
            />
            <VStack spacing={4}>
              <Grid templateColumns="repeat(3, 1fr)" gap={3} width="100%">
                {item.masked_images.map((maskedImage, index) => (
                  <Box key={`masked-${index}`} bg="gray.50" borderRadius="md">
                    <Image
                      src={getFullImageUrl(maskedImage)}
                      alt={`Masked Image ${index + 1}`}
                      objectFit="contain"
                      w="100%"
                      h="180px"
                    />
                  </Box>
                ))}
              </Grid>
              <HStack spacing={3} width="100%">
                <Box width="50%" bg="gray.50" borderRadius="md">
                  <Image
                    src={getFullImageUrl(item.image_path)}
                    alt="Original Image"
                    objectFit="contain"
                    w="100%"
                    h="100px"
                  />
                </Box>
                <Box width="50%" bg="gray.50" borderRadius="md">
                  <Image
                    src={getFullImageUrl(item.clothes_mask)}
                    alt="Clothes Mask"
                    objectFit="contain"
                    w="100%"
                    h="100px"
                  />
                </Box>
              </HStack>
            </VStack>
          </Box>
        ))}
      </Grid>

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

export default MyCloset;
