import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNavigationAPI() {
  try {
    console.log('🧪 Testing Navigation API...');

    // Test 1: Get current config
    console.log('\n1. Testing GET /api/v1/navigation');
    const getResponse = await fetch('http://localhost:3001/api/v1/navigation');
    const getData = await getResponse.json();
    console.log('GET Response:', getData);

    // Test 2: Update config (this will fail without auth, but we can see the error)
    console.log('\n2. Testing PUT /api/v1/navigation (without auth)');
    const testConfig = {
      showInNav: true,
      maxVisibleCategories: 8,
      showSubcategories: true,
      showMoreButton: true,
      customOrder: []
    };

    const putResponse = await fetch('http://localhost:3001/api/v1/navigation', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testConfig)
    });
    
    const putData = await putResponse.json();
    console.log('PUT Response Status:', putResponse.status);
    console.log('PUT Response:', putData);

    // Test 3: Check database directly
    console.log('\n3. Checking database directly');
    const dbConfig = await prisma.navigationConfig.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('Database config:', dbConfig);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNavigationAPI();
