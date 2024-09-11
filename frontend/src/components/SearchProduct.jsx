import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, Input, VStack, Text, HStack, useToast } from '@chakra-ui/react';

const SearchProducts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({ receiptData: [], flyerData: [] });
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_GATEWAY_URL}/searchProducts`, {
        params: { productName: searchQuery }
      });
      const uniqueProducts = new Set();
      const filteredResults = response.data.receiptData.map(result => ({
        ...result,
        products: result.products.filter(product => {
          if (uniqueProducts.has(product.productName)) {
            return false;
          } else {
            uniqueProducts.add(product.productName);
            return true;
          }
        })
      }));

      setResults({
        receiptData: filteredResults,
        flyerData: response.data.flyerData
      });
      setError('');
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Error fetching search results');
      toast({
        title: 'Error fetching search results.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={4} mt={10}>
      <Text fontSize="2xl" fontWeight="bold">Search Products</Text>
      <Input
        placeholder="Enter product name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Button colorScheme="blue" onClick={handleSearch}>Search</Button>
      {error && <Text color="red.500">{error}</Text>}
      <Box mt={4} width="100%">
        {results.receiptData.length > 0 && (
          <Box>
            <Text fontSize="lg" fontWeight="bold">Receipt Data</Text>
            {results.receiptData.map(result => (
              <Box key={result.receiptID} p={4} bg="white" borderRadius="md" shadow="sm" mb={4}>
                <Text fontSize="lg" fontWeight="bold">Place Bought: {result.placeBought}</Text>
                <Text>Timestamp: {result.timestamp}</Text>
                <VStack align="start" spacing={2} mt={2}>
                  {result.products.map(product => (
                    <HStack key={product.productName}>
                      <Text>{product.productName}:</Text>
                      <Text>${product.price}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            ))}
          </Box>
        )}
        {results.flyerData.length > 0 && (
          <Box mt={4}>
            <Text fontSize="lg" fontWeight="bold">Flyer Data</Text>
            {results.flyerData.map((flyer, index) => (
              <Box key={index} p={4} bg="white" borderRadius="md" shadow="sm" mb={4}>
                <Text>{flyer.productName}:</Text>
                <Text>{flyer.offer}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default SearchProducts;
