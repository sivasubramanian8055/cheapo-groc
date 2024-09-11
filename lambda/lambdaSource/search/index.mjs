import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });

export const handler = async (event) => {
  console.log("demo",event)
  const searchTerm = event.queryStringParameters?.productName;

  if (!searchTerm) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
      },
      body: JSON.stringify({ error: 'Missing productName query parameter' }),
    };
  }

  try {
    const flyerData = await fetchLatestFlyerItems(searchTerm);
    const receiptData = await fetchReceiptData(searchTerm);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
      },
      body: JSON.stringify({ flyerData, receiptData }),
    };
  } catch (error) {
    console.error('Error searching products:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
      },
      body: JSON.stringify({ error: 'Error searching products' }),
    };
  }
};

const fetchLatestFlyerItems = async (searchTerm) => {
  const flyerParams = {
    TableName: 'FlyersData',
    Limit: 1,
    ScanIndexForward: false,
  };

  const flyerResult = await dynamoDbClient.send(new ScanCommand(flyerParams));
  if (flyerResult.Items.length === 0) {
    return [];
  }

  const latestFlyer = flyerResult.Items[0];
  const flyerItems = latestFlyer.Items.L.filter(item =>
    item.M.productName.S.toLowerCase().includes(searchTerm.toLowerCase())
  ).map(item => ({
    productName: item.M.productName.S,
    offer: item.M.offer.S,
  }));

  return flyerItems;
};

const fetchReceiptData = async (searchTerm) => {
  const receiptParams = {
    TableName: 'ReceiptsData',
  };

  const receiptResult = await dynamoDbClient.send(new ScanCommand(receiptParams));
  let foundItems = [];

  for (const receipt of receiptResult.Items) {
    const matchingProducts = receipt.Products.L.filter(product =>
      product.M.productName.S.toLowerCase().includes(searchTerm.toLowerCase())
    ).map(product => ({
      productName: product.M.productName.S,
      price: product.M.price.N,
    }));

    if (matchingProducts.length > 0) {
      foundItems.push({
        receiptID: receipt.ReceiptID.S,
        placeBought: receipt.PlaceBought.S,
        timestamp: receipt.Timestamp.S,
        products: matchingProducts,
      });

      if (foundItems.length >= 5) {
        break;
      }
    }
  }

  return foundItems;
};
