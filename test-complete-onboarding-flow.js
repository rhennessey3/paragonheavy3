// Test script to verify the complete onboarding flow
// This script simulates a user going through the entire onboarding process

const fetch = require('node-fetch');

async function testOnboardingFlow() {
  console.log('🧪 Starting complete onboarding flow test...\n');
  
  try {
    // Step 1: Sign up a new user (you'll need to do this manually in the browser)
    console.log('📝 Step 1: User should sign up manually in the browser first');
    console.log('   Go to http://localhost:3000/sign-up and create a new account\n');
    
    // Step 2: Create organization name
    console.log('📝 Step 2: Creating organization name...');
    const orgNameResponse = await fetch('http://localhost:3000/api/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Organization ' + Date.now(),
      }),
    });
    
    if (orgNameResponse.ok) {
      console.log('✅ Organization name created successfully');
    } else {
      console.log('❌ Failed to create organization name');
      console.log('Status:', orgNameResponse.status, orgNameResponse.statusText);
      return;
    }
    
    // Step 3: Complete onboarding with org type
    console.log('\n📝 Step 3: Completing onboarding with organization type...');
    const onboardingResponse = await fetch('http://localhost:3000/api/onboarding-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgName: 'Test Organization ' + Date.now(),
        orgType: 'shipper',
      }),
    });
    
    if (onboardingResponse.ok) {
      console.log('✅ Onboarding completed successfully');
      console.log('🍪 Cookie should be set: ph_onboarding_completed=true');
      console.log('🔄 Should redirect to: /dashboard');
    } else {
      console.log('❌ Failed to complete onboarding');
      console.log('Status:', onboardingResponse.status, onboardingResponse.statusText);
      const errorText = await onboardingResponse.text();
      console.log('Error:', errorText);
    }
    
    console.log('\n🧪 Test completed!');
    console.log('\n📋 Manual verification steps:');
    console.log('1. Check Convex dashboard for new organization');
    console.log('2. Check userProfiles.onboardingCompleted = true');
    console.log('3. Verify cookie ph_onboarding_completed=true in browser');
    console.log('4. Test middleware allows /dashboard access');
    console.log('5. Test middleware blocks /sign-up/tasks/*');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testOnboardingFlow();