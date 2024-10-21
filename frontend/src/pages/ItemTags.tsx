import React, { useState, useEffect } from 'react';
import { Box, Text, SimpleGrid, Spinner, useToast, Image, Flex, Tag, Button, Collapse, VStack, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
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
    [key: string]: string;
  };
}

interface ClosetItemsResponse {
  items: ClosetItem[];
}

interface CategoriesResponse {
  categories: Category[];
}

const ItemTags: React.FC = () => {
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
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
          api.get<ClosetItemsResponse>('/api/user/closet-items'),
          api.get<CategoriesResponse>('/api/user/closet-categories')
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
    <SimpleGrid columns={[2, 3, 4, 5]} spacing={4}>
      {categoryItems.map((item) => {
        const isExpanded = expandedItems.has(item.id);
        return (
          <Box 
            key={item.id} 
            borderWidth={1} 
            borderRadius="lg" 
            overflow="hidden" 
            boxShadow="sm"
            bg="white"
          >
            <Box position="relative" paddingBottom="100%"> {/* Creates a square aspect ratio */}
              <Image
                src={getFullImageUrl(item.path)}
                alt={`${item.classification_results.category} item`}
                objectFit="cover"
                objectPosition="center 30%" // Shifts the focus slightly upwards
                position="absolute"
                top="2%"
                left="2%"
                width="96%"
                height="105%" // Extends beyond the bottom to crop more
              />
            </Box>
            <Box p={3}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="md" fontWeight="semibold" color="gray.700">
                  {item.classification_results.category}
                </Text>
                <Tag size="sm" variant="solid" colorScheme="teal">
                  {item.classification_results.colour}
                </Tag>
              </Flex>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleExpand(item.id)}
                rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                width="100%"
                mt={1}
              >
                {isExpanded ? "Hide Details" : "Show Details"}
              </Button>
              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={2} align="stretch" mt={3}>
                  {Object.entries(item.classification_results).map(([resultKey, value]) => (
                    resultKey !== 'category' && resultKey !== 'colour' && (
                      <Flex key={resultKey} justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="medium" color="gray.600" textTransform="capitalize">
                          {resultKey}:
                        </Text>
                        <Text fontSize="sm" color="gray.800">
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
      })}
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
    <Box maxW="100%" py={8}>
      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList mb={4} overflowX="auto" whiteSpace="nowrap" pb={2}>
          {categories.map((category) => (
            <Tab key={category.name} mx={1} _selected={{ color: "white", bg: "blue.500" }}>
              {category.name} ({category.count})
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {categories.map((category) => (
            <TabPanel key={category.name} px={0}>
              {renderItemGrid(closetItems.filter(item => 
                item.classification_results.category === category.name
              ))}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ItemTags;
