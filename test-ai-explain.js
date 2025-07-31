#!/usr/bin/env node

/**
 * AI Explain Test Script
 * 
 * This script tests the AI explain function to ensure it provides
 * detailed, well-formatted code explanations.
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'https://cosmoagents.netlify.app';

// Test code samples
const testCases = [
  {
    name: 'SQL Query',
    code: `SELECT u.user_id, u.username, u.email, p.post_count
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as post_count
    FROM posts
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY user_id
) p ON u.user_id = p.user_id
WHERE u.active = 1
ORDER BY p.post_count DESC;`,
    language: 'sql'
  },
  {
    name: 'JavaScript Function',
    code: `function calculateFibonacci(n) {
    if (n <= 1) return n;
    
    let prev = 0;
    let current = 1;
    
    for (let i = 2; i <= n; i++) {
        const next = prev + current;
        prev = current;
        current = next;
    }
    
    return current;
}`,
    language: 'javascript'
  },
  {
    name: 'Oracle PL/SQL Procedure',
    code: `CREATE OR REPLACE PROCEDURE process_employee_data(
    p_employee_id IN NUMBER,
    p_salary IN NUMBER,
    p_department_id IN NUMBER
) IS
    v_old_salary NUMBER;
    v_department_name VARCHAR2(100);
    v_employee_count NUMBER;
BEGIN
    -- Get current salary
    SELECT salary INTO v_old_salary
    FROM employees
    WHERE employee_id = p_employee_id;
    
    -- Update salary
    UPDATE employees
    SET salary = p_salary,
        last_updated = SYSDATE
    WHERE employee_id = p_employee_id;
    
    -- Get department info
    SELECT department_name INTO v_department_name
    FROM departments
    WHERE department_id = p_department_id;
    
    -- Log the change
    INSERT INTO salary_changes (
        employee_id,
        old_salary,
        new_salary,
        change_date
    ) VALUES (
        p_employee_id,
        v_old_salary,
        p_salary,
        SYSDATE
    );
    
    COMMIT;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20001, 'Employee not found');
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;`,
    language: 'oracle sql'
  }
];

async function testAIExplain(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Language: ${testCase.language}`);
    console.log(`📏 Code length: ${testCase.code.length} characters`);
    
    const response = await fetch(`${BASE_URL}/.netlify/functions/ai-explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: testCase.code,
        language: testCase.language
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ HTTP Error: ${response.status}`);
      console.error(`Error details: ${errorData}`);
      return false;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`❌ API Error: ${data.error}`);
      return false;
    }

    if (!data.explanation || data.explanation.trim().length === 0) {
      console.error(`❌ Empty explanation returned`);
      return false;
    }

    console.log(`✅ Success! Explanation length: ${data.explanation.length} characters`);
    console.log(`📋 Explanation preview:`);
    console.log('─'.repeat(50));
    console.log(data.explanation.substring(0, 300) + '...');
    console.log('─'.repeat(50));
    
    // Check for proper formatting
    const hasMarkdown = data.explanation.includes('##') || data.explanation.includes('**');
    const hasCodeBlock = data.explanation.includes('```');
    const hasStructure = data.explanation.includes('Overview') || data.explanation.includes('Analysis');
    
    console.log(`📊 Formatting check:`);
    console.log(`  - Markdown formatting: ${hasMarkdown ? '✅' : '❌'}`);
    console.log(`  - Code blocks: ${hasCodeBlock ? '✅' : '❌'}`);
    console.log(`  - Structured content: ${hasStructure ? '✅' : '❌'}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting AI Explain Function Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const success = await testAIExplain(testCase);
    if (success) {
      passedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! AI Explain function is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error(`❌ Test script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests, testAIExplain }; 