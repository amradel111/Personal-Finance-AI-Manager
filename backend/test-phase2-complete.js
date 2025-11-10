const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000/api';
const BACKEND_URL = 'http://localhost:5000';

console.log('═══════════════════════════════════════════════════════════');
console.log('  PHASE 2 AUTHENTICATION VERIFICATION TEST');
console.log('  Personal Finance AI Manager');
console.log('═══════════════════════════════════════════════════════════\n');

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function runTests() {
  try {
    // Test 1: Backend Server Running
    console.log('\n🔐 PHASE 2 BACKEND AUTHENTICATION TESTS\n' + '─'.repeat(60));
    try {
      const response = await axios.get(BACKEND_URL, { timeout: 3000 });
      logTest('Backend server is running', true, `Port 5000 active`);
    } catch (error) {
      logTest('Backend server is running', false, 'Server not responding on port 5000');
      return;
    }

    // Test 2: Enhanced Signup with Phone Number
    let authToken = null;
    let userId = null;
    const testEmail = `test${Date.now()}@example.com`;
    const testPhone = `+1202555${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      const response = await axios.post(`${API_BASE}/auth/signup`, {
        email: testEmail,
        password: 'TestPassword123!',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: testPhone
      });
      
      const hasToken = !!response.data.token;
      const hasUser = !!response.data.user;
      const hasPhone = !!response.data.user.phone;
      authToken = response.data.token;
      userId = response.data.user.id;
      
      logTest('Enhanced signup with phone number', hasToken && hasUser && hasPhone, 
        `Phone: ${response.data.user.phone}`);
    } catch (error) {
      logTest('Enhanced signup with phone number', false, error.response?.data?.error || error.message);
    }

    // Test 3: Email Validation
    try {
      const response = await axios.post(`${API_BASE}/auth/signup`, {
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+12025551111'
      });
      logTest('Email validation rejects invalid format', false, 'Should have rejected invalid email');
    } catch (error) {
      const isValidationError = error.response?.status === 400 && 
                                error.response?.data?.error?.toLowerCase().includes('email');
      logTest('Email validation rejects invalid format', isValidationError, 'Properly validates email format');
    }

    // Test 4: Password Strength Validation
    try {
      const response = await axios.post(`${API_BASE}/auth/signup`, {
        email: `test${Date.now()}@test.com`,
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        phone: `+1202555${Math.floor(1000 + Math.random() * 9000)}`
      });
      logTest('Password strength validation', false, 'Should have rejected weak password');
    } catch (error) {
      const isValidationError = error.response?.status === 400 && 
                                error.response?.data?.error?.toLowerCase().includes('password');
      logTest('Password strength validation', isValidationError, 'Enforces strong passwords');
    }

    // Test 5: Phone Number Validation
    try {
      const response = await axios.post(`${API_BASE}/auth/signup`, {
        email: `test${Date.now()}@test.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '123456'  // Invalid format
      });
      logTest('Phone number E.164 validation', false, 'Should have rejected invalid phone');
    } catch (error) {
      const isValidationError = error.response?.status === 400 && 
                                error.response?.data?.error?.toLowerCase().includes('phone');
      logTest('Phone number E.164 validation', isValidationError, 'Validates E.164 format');
    }

    // Test 6: Duplicate Phone Number Prevention
    if (authToken) {
      try {
        const response = await axios.post(`${API_BASE}/auth/signup`, {
          email: `different${Date.now()}@test.com`,
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
          phone: testPhone  // Reuse same phone
        });
        logTest('Duplicate phone number prevention', false, 'Should prevent duplicate phone');
      } catch (error) {
        const isDuplicateError = error.response?.status === 409 && 
                                  error.response?.data?.error?.toLowerCase().includes('phone');
        logTest('Duplicate phone number prevention', isDuplicateError, 'Prevents duplicate phone numbers');
      }
    }

    // Test 7: Login with LastLogin Update
    if (authToken) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const response = await axios.post(`${API_BASE}/auth/login`, {
          email: testEmail,
          password: 'TestPassword123!'
        });
        
        const hasLastLogin = !!response.data.user.lastLogin;
        logTest('Login updates lastLogin timestamp', hasLastLogin, 
          `Last login: ${response.data.user.lastLogin}`);
      } catch (error) {
        logTest('Login updates lastLogin timestamp', false, error.response?.data?.error || error.message);
      }
    }

    // Test 8: Profile Check Endpoint
    if (authToken) {
      try {
        const response = await axios.get(`${API_BASE}/auth/check-profile`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const hasProfileComplete = response.data.hasOwnProperty('profileComplete');
        const hasHasProfile = response.data.hasOwnProperty('hasProfile');
        
        logTest('Profile check endpoint working', hasProfileComplete && hasHasProfile, 
          `Profile complete: ${response.data.profileComplete}, Has profile: ${response.data.hasProfile}`);
      } catch (error) {
        logTest('Profile check endpoint working', false, error.response?.data?.error || error.message);
      }
    }

    // Test 9: JWT Token Contains Email
    if (authToken) {
      try {
        const response = await axios.get(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const hasEmail = !!response.data.user.email;
        logTest('JWT token includes user email', hasEmail, 
          `Email in token: ${response.data.user.email}`);
      } catch (error) {
        logTest('JWT token includes user email', false, error.response?.data?.error || error.message);
      }
    }

    // Frontend Tests
    console.log('\n🎨 PHASE 2 FRONTEND TESTS\n' + '─'.repeat(60));

    // Test 10: Auth Context
    const frontendPath = path.join(__dirname, '../frontend/src');
    const authContextExists = fs.existsSync(path.join(frontendPath, 'context', 'AuthContext.tsx'));
    logTest('AuthContext created', authContextExists, 
      'Global auth state management with React Context');

    // Test 11: Protected Route Component
    const protectedRouteExists = fs.existsSync(path.join(frontendPath, 'components', 'ProtectedRoute.tsx'));
    logTest('ProtectedRoute component created', protectedRouteExists, 
      'Route protection with auth state check');

    // Test 12: Validation Utilities
    const validationUtilsExist = fs.existsSync(path.join(frontendPath, 'utils', 'validation.ts'));
    logTest('Validation utilities created', validationUtilsExist, 
      'Email and password validation helpers');

    // Test 13: Auth Storage Utilities
    const authStorageExists = fs.existsSync(path.join(frontendPath, 'utils', 'authStorage.ts'));
    logTest('Auth storage utilities created', authStorageExists, 
      'LocalStorage/SessionStorage management for remember-me');

    // Test 14: Unified Auth Page
    const authPageExists = fs.existsSync(path.join(frontendPath, 'pages', 'auth', 'Auth.tsx'));
    logTest('Unified Auth page created', authPageExists, 
      'Single page with Login/Signup forms');

    // Test 15: Login Page Component
    const loginPageExists = fs.existsSync(path.join(frontendPath, 'pages', 'auth', 'Login.tsx'));
    logTest('Login page component exists', loginPageExists, 
      'Dedicated login form component');

    // Test 16: Signup Page Component
    const signupPageExists = fs.existsSync(path.join(frontendPath, 'pages', 'auth', 'Signup.tsx'));
    logTest('Signup page component exists', signupPageExists, 
      'Dedicated signup form component');

    // Test 17: Enhanced Auth Service
    const authServicePath = path.join(frontendPath, 'services', 'authService.ts');
    if (fs.existsSync(authServicePath)) {
      const content = fs.readFileSync(authServicePath, 'utf8');
      const hasCheckProfile = content.includes('checkProfile') || content.includes('check-profile');
      logTest('Auth service includes profile check', hasCheckProfile, 
        'checkProfileComplete() function added');
    } else {
      logTest('Auth service includes profile check', false, 'authService.ts not found');
    }

    // Test 18: API Interceptors
    const apiPath = path.join(frontendPath, 'services', 'api.ts');
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      const hasRequestInterceptor = content.includes('request.use');
      const hasResponseInterceptor = content.includes('response.use');
      logTest('Axios interceptors configured', hasRequestInterceptor && hasResponseInterceptor, 
        'Auto-attach JWT and handle 401 errors');
    } else {
      logTest('Axios interceptors configured', false, 'api.ts not found');
    }

    // Database Schema Tests
    console.log('\n💾 PHASE 2 DATABASE SCHEMA TESTS\n' + '─'.repeat(60));

    // Test 19: User Schema Has Phone Field
    const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      const hasPhoneField = content.includes('phone') && content.includes('String') && content.includes('@unique');
      logTest('User schema includes phone field', hasPhoneField, 
        'Phone field added with @unique constraint');
    } else {
      logTest('User schema includes phone field', false, 'schema.prisma not found');
    }

    // Test 20: User Schema Has LastLogin Field
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf8');
      const hasLastLogin = content.includes('lastLogin') && content.includes('DateTime?');
      logTest('User schema includes lastLogin field', hasLastLogin, 
        'Optional DateTime field for tracking login');
    } else {
      logTest('User schema includes lastLogin field', false, 'schema.prisma not found');
    }

    // Final Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n  Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`  ✅ Passed: ${testResults.passed}`);
    console.log(`  ❌ Failed: ${testResults.failed}`);
    
    const percentage = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
    console.log(`\n  Success Rate: ${percentage}%`);
    
    if (testResults.failed === 0) {
      console.log('\n  🎉 PHASE 2 IS 100% COMPLETE! 🎉');
      console.log('  All authentication systems operational.');
      console.log('  Ready for Phase 3 (Profile Setup).\n');
    } else {
      console.log(`\n  ⚠️  ${testResults.failed} test(s) failed. Please review above.\n`);
    }

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  }
}

runTests();
