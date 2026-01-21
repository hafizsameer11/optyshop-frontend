/**
 * Test file for errorUtils to verify error message formatting
 */

import { formatErrorMessage } from './errorUtils';

// Test cases for different error formats
const testCases: Array<{
  name: string;
  error: any;
  expected: string;
}> = [
  {
    name: 'String error',
    error: 'Simple error message',
    expected: 'Simple error message'
  },
  {
    name: 'Error object with message',
    error: { message: 'Error with message property' },
    expected: 'Error with message property'
  },
  {
    name: 'Error object with error property',
    error: { error: 'Error with error property' },
    expected: 'Error with error property'
  },
  {
    name: 'Complex error object',
    error: { 
      message: 'Validation failed',
      status: 400,
      code: 'VALIDATION_ERROR'
    },
    expected: 'Message: Validation failed - Status: 400 - Code: VALIDATION_ERROR'
  },
  {
    name: 'Empty object',
    error: {},
    expected: 'An error occurred during registration. Please check your information and try again.'
  },
  {
    name: 'Null error',
    error: null,
    expected: 'An unknown error occurred'
  },
  {
    name: 'Undefined error',
    error: undefined,
    expected: 'An unknown error occurred'
  },
  {
    name: 'Object with toString method',
    error: {
      toString: () => 'Custom toString message'
    },
    expected: 'Custom toString message'
  }
];

// Run tests
console.log('Running errorUtils tests...\n');

testCases.forEach((testCase, index) => {
  try {
    const result = formatErrorMessage(testCase.error);
    const passed = result === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: ${JSON.stringify(testCase.error)}`);
    console.log(`Expected: "${testCase.expected}"`);
    console.log(`Actual: "${result}"`);
    console.log(`Status: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('---');
  } catch (error) {
    console.log(`Test ${index + 1}: ${testCase.name} - ❌ ERROR: ${error}`);
    console.log('---');
  }
});

console.log('\nAll tests completed!');
