import React, { useState, useEffect } from 'react';
import {
  Box, Text, SimpleGrid, Spinner, useToast, Image,
  Flex, Tag, Button, Collapse, VStack, Tabs,
  TabList, TabPanels, Tab, TabPanel, Skeleton
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>({});

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

  const handleImageLoad = (id: string) => {
    setImageLoaded(prev => ({ ...prev, [id]: true }));
  };

  const renderItemGrid = (categoryItems: ClosetItem[]) => (
    <SimpleGrid columns={[2, 3, 4, 5]} spacing={4} p={4}>
      {categoryItems.map((item) => {
        const isExpanded = expandedItems.has(item.id);
        return (
          <Box 
            key={item.id} 
            borderWidth={1} 
            borderRadius="lg" 
            overflow="hidden" 
            boxShadow="md"
            bg="white"
            _hover={{ boxShadow: "xl", transform: "scale(1.02)" }}
            transition="all 0.2s"
          >
            <Box position="relative" paddingBottom="100%">
              {!imageLoaded[item.id] && (
                <Skeleton height="100%" width="100%" position="absolute" top="0" left="0" />
              )}
              <Image
                src={getFullImageUrl(item.path)}
                alt={`${item.classification_results.category} item`}
                objectFit="cover"
                objectPosition="center"
                position="absolute"
                top="0"
                left="0"
                width="100%"
                height="100%"
                onLoad={() => handleImageLoad(item.id)}
                display={imageLoaded[item.id] ? 'block' : 'none'}
              />
            </Box>
            <Box p={2}>
              <Flex justify="space-between" align="center" mb={1}>
                <Tag size="sm" variant="solid" colorScheme="teal">
                  {item.classification_results.colour}
                </Tag>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => toggleExpand(item.id)}
                  rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                >
                  {isExpanded ? "Less" : "More"}
                </Button>
              </Flex>
              <Collapse in={isExpanded} animateOpacity>
                <VStack spacing={1} align="stretch" mt={2}>
                  {Object.entries(item.classification_results).map(([resultKey, value]) => (
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
      })}
    </SimpleGrid>
  );

  if (loading) return (
    <Flex justify="center" align="center" height="50vh">
      <Spinner size="xl" />
    </Flex>
  );

  if (closetItems.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Image src="/images/empty-closet.svg" alt="Empty Closet" mx="auto" mb={4} boxSize="150px" />
        <Text fontSize="xl" fontWeight="medium">Your closet is empty</Text>
        <Text mt={2} color="gray.600">Start by adding some items to your closet</Text>
        <Button mt={4} colorScheme="blue" onClick={() => navigate('/closet/add')}>
          Upload Items
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="100%" py={2}>
      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList mb={2} overflowX="auto" whiteSpace="nowrap" pb={1} css={{
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          '-ms-overflow-style': 'none',
        }}>
          {categories.map((category) => (
            <Tab 
              key={category.name} 
              mx={1} 
              _selected={{ color: "white", bg: "blue.500" }} 
              fontSize="sm"
              py={1}
              px={3}
            >
              {category.name} ({category.count})
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {categories.map((category) => (
            <TabPanel key={category.name} px={0} py={2}>
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
