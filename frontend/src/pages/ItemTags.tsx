import React, { useState, useEffect } from 'react';
import { Box, Text, SimpleGrid, Spinner, useToast, Image, Flex, Tag, IconButton, Collapse, VStack, Button, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, EditIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATIC_BASE_URL = process.env.REACT_APP_STATIC_BASE_URL || 'http://localhost:8000/static/';

interface Category {
  name: string;
  count: number;
}

interface ClosetItem {
  id: string;
  path: string;
  classification_results: {
    [key: string]: any;
  };
}

const ItemTags: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const [itemsResponse, categoriesResponse] = await Promise.all([
          api.get<ClosetItemsData>('/api/user/closet-items'),
          api.get<CategoriesData>('/api/user/closet-categories')
        ]);

        setClosetItems(itemsResponse.data.items);
        setCategories(categoriesResponse.data.categories);
      } catch (error) {
        console.error('Error fetching closet data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch closet data. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, toast]);

  const getFullImageUrl = (path: string) => {
    if (path.startsWith('http')) {
      return path;
    }
    return `${STATIC_BASE_URL}${path}`;
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderItemGrid = (categoryItems: ClosetItem[]) => (
    <SimpleGrid columns={[2, 3, 4, 5]} spacing={3} px={4}>
      {categoryItems.flatMap((item) => 
        Object.entries(item.classification_results).map(([key, value]) => {
          const itemId = `${item.id}-${key}`;
          const isExpanded = expandedItems.has(itemId);
          return (
            <Box 
              key={itemId} 
              borderWidth={1} 
              borderRadius="md" 
              overflow="hidden" 
              boxShadow="sm" 
              transition="all 0.3s"
              _hover={{ boxShadow: "md" }}
              bg="white"
            >
              <Box position="relative">
                <Image
                  src={getFullImageUrl(item.path)}
                  alt={`Masked item`}
                  objectFit="cover"
                  w="100%"
                  h="200px"
                />
                <IconButton
                  aria-label="Edit item"
                  icon={<EditIcon />}
                  size="sm"
                  position="absolute"
                  top={2}
                  right={2}
                  colorScheme="blue"
                  opacity={0}
                  _groupHover={{ opacity: 0.8 }}
                  transition="opacity 0.2s"
                />
              </Box>
              <Box p={2}>
                <Flex justify="space-between" align="center" mb={1}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">
                    {value.category}
                  </Text>
                  <Tag size="sm" variant="solid" colorScheme="teal">
                    {value.colour}
                  </Tag>
                </Flex>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => toggleExpand(itemId)}
                  rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  width="100%"
                >
                  {isExpanded ? "Hide Details" : "Show Details"}
                </Button>
                <Collapse in={isExpanded} animateOpacity>
                  <VStack spacing={1} align="stretch" mt={2}>
                    {Object.entries(value).map(([resultKey, value]) => (
                      resultKey !== 'category' && resultKey !== 'colour' && (
                        <Flex key={resultKey} justify="space-between" align="center">
                          <Text fontSize="xs" fontWeight="medium" color="gray.600" textTransform="capitalize">
                            {resultKey}:
                          </Text>
                          <Text fontSize="xs" color="gray.800">
                            {value}
                          </Text>
                        </Flex>
                      )
                    ))}
                  </VStack>
                </Collapse>
              </Box>
            </Box>
          );
        })
      )}
    </SimpleGrid>
  );

  if (loading) return <Spinner size="xl" />;

  if (closetItems.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="xl" fontWeight="medium">Your closet is empty</Text>
        <Text mt={2} color="gray.600">Start by adding some items to your closet</Text>
      </Box>
    );
  }

  return (
    <Box maxW="100%" py={4}>
      <Tabs>
        <TabList>
          {categories.map((category) => (
            <Tab key={category.name}>{category.name}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {categories.map((category) => (
            <TabPanel key={category.name}>
              {renderItemGrid(closetItems.filter(item => 
                Object.values(item.classification_results).some(value => value.category === category.name)
              ))}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ItemTags;
