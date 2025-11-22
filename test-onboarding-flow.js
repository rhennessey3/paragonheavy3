// Test script to validate onboarding completion flow
const testOnboardingFlow = async () => {
  console.log("🧪 Testing onboarding completion flow...");
  
  try {
    // Test 1: Check if API route exists and is protected
    console.log("\n1️⃣ Testing API route protection...");
    const unauthResponse = await fetch('http://localhost:3000/api/onboarding-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (unauthResponse.status === 401 || unauthResponse.status === 307) {
      console.log("✅ API route correctly protects against unauthenticated requests");
    } else {
      console.log("❌ API route should protect against unauthenticated requests");
      console.log("Status:", unauthResponse.status);
    }
    
    // Test 2: Check middleware is checking for cookie
    console.log("\n2️⃣ Testing middleware cookie checking...");
    const testResponse = await fetch('http://localhost:3000/test-onboarding');
    const responseText = await testResponse.text();
    
    if (responseText.includes('Onboarding cookie: not completed')) {
      console.log("✅ Middleware is correctly checking for onboarding cookie");
    } else {
      console.log("❌ Middleware may not be checking cookie properly");
    }
    
    console.log("\n🎯 Onboarding flow test completed!");
    console.log("\n📋 Manual testing steps:");
    console.log("1. Sign in as a user");
    console.log("2. Complete organization creation (Step 1)");
    console.log("3. Complete organization type selection (Step 2)");
    console.log("4. Check that ph_onboarding_completed cookie is set");
    console.log("5. Verify middleware allows access to dashboard");
    console.log("6. Test that user without orgId is redirected to create-org-name");
    console.log("7. Test that user with orgId but no onboarding cookie is redirected to select-org-type");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
testOnboardingFlow();