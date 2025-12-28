import { analyzerService } from './services/analyzerService.js';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   WASSILA ULTIMATE TEST - ALL CODE TYPES & LANGUAGES      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const testCases = [
  // ========== JAVASCRIPT TESTS ==========
  {
    name: 'JavaScript - Simple Code',
    lang: 'javascript',
    bad: `var x = 5;
console.log(x);`,
    fixed: `const x = 5;
const logger = { info: (msg) => {} };
logger.info(x);`
  },
  {
    name: 'JavaScript - Complex Code',
    lang: 'javascript',
    bad: `var user_data = { name: "John" };
function processUser(id) {
  console.log("Processing: " + id);
  if (id == "admin") {
    eval("doSomething()");
    document.getElementById("output").innerHTML = user_data.name;
  }
}`,
    fixed: `const userData = { name: "John" };
const logger = { info: (msg) => {} };

function processUser(id) {
  logger.info("Processing: " + id);
  if (id === "admin") {
    // Removed eval - use function map instead
    const actions = { doSomething: () => {} };
    actions.doSomething();
    
    const outputElement = document.getElementById("output");
    if (outputElement) {
      outputElement.textContent = userData.name;
    }
  }
}`
  },
  {
    name: 'JavaScript - Very Bad Code',
    lang: 'javascript',
    bad: `var api_key = "AIzaSyNotRealButLongEnoughToDetect1234567890";
var user_name = "test";
function check(val) {
  console.log("Checking");
  if (val == 0) {
    eval(val);
    debugger;
  } else if (val == 0) {
    console.log("duplicate");
  }
}`,
    fixed: `const apiKey = process.env.API_KEY;
const userName = "test";
const logger = { info: (msg) => {} };

function check(val) {
  logger.info("Checking");
  if (val === 0) {
    // Removed eval and debugger
    const result = val;
    return result;
  }
}`
  },

  // ========== PYTHON TESTS ==========
  {
    name: 'Python - Simple Code',
    lang: 'python',
    bad: `def MyFunction():
    print("Hello")`,
    fixed: `import logging

logger = logging.getLogger(__name__)

def my_function():
    logger.info("Hello")`
  },
  {
    name: 'Python - Complex Code',
    lang: 'python',
    bad: `def ProcessData(InputValue):
    print("Processing: " + InputValue)
    SECRET_KEY = "sk-proj-notarealkeybutlongenough1234567890"
    try:
        result = risky_operation()
    except:
        pass
    return result`,
    fixed: `import logging
import os

logger = logging.getLogger(__name__)

def process_data(input_value):
    logger.info("Processing: " + input_value)
    secret_key = os.getenv("SECRET_KEY")
    try:
        result = risky_operation()
    except Exception as e:
        logger.error(f"Error: {e}")
        result = None
    return result`
  },
  {
    name: 'Python - Very Bad Code',
    lang: 'python',
    bad: `def BadFunc(userName):
    print("Start")
    PASSWORD = "password123456"
    if userName == "admin":
        try:
            do_something()
        except:
            pass`,
    fixed: `import logging
import os

logger = logging.getLogger(__name__)

def bad_func(user_name):
    logger.info("Start")
    password = os.getenv("PASSWORD")
    if user_name == "admin":
        try:
            do_something()
        except Exception as e:
            logger.error(f"Error: {e}")`
  },

  // ========== PHP TESTS ==========
  {
    name: 'PHP - Simple Code',
    lang: 'php',
    bad: `<?
echo "Hello";`,
    fixed: `<?php
function greet() {
    return "Hello";
}`
  },
  {
    name: 'PHP - Complex Code',
    lang: 'php',
    bad: `<?php
echo "User Data";
$password = "PASSWORD=secret123456";
$query = mysqli_query($conn, "SELECT * FROM users WHERE id=" . $_GET['id']);
if (!$query) {
    die("Failed");
}`,
    fixed: `<?php
function getUserData($userId, PDO $pdo) {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
    $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("User not found");
    }
    
    return $user;
}`
  },
  {
    name: 'PHP - Very Bad Code',
    lang: 'php',
    bad: `<?
echo "Output";
$secret = "TOKEN=abc123456789";
$result = mysqli_query($db, "SELECT * FROM data WHERE id=" . $id);
if (!$result) {
    die("Error");
    exit(1);
}`,
    fixed: `<?php
function getData($id, PDO $pdo) {
    $stmt = $pdo->prepare("SELECT * FROM data WHERE id = :id");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$result) {
        throw new Exception("Data not found");
    }
    
    return $result;
}`
  }
];

let totalTests = 0;
let passedTests = 0;

testCases.forEach((test, idx) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${idx + 1}: ${test.name}`);
  console.log('='.repeat(60));
  
  // Analyze bad code
  const badIssues = analyzerService.analyze(test.bad, test.lang);
  const badScore = Math.max(0, 100 - (badIssues.length * 5));
  console.log(`\n📊 BEFORE FIX:`);
  console.log(`   Issues: ${badIssues.length}`);
  console.log(`   Score: ${badScore}/100`);
  
  if (badIssues.length > 0) {
    console.log(`   Problems Found:`);
    badIssues.forEach(i => console.log(`     - ${i.ruleId} (Line ${i.line})`));
  }
  
  // Analyze fixed code
  const fixedIssues = analyzerService.analyze(test.fixed, test.lang);
  const fixedScore = Math.max(0, 100 - (fixedIssues.length * 5));
  console.log(`\n✨ AFTER FIX:`);
  console.log(`   Issues: ${fixedIssues.length}`);
  console.log(`   Score: ${fixedScore}/100`);
  
  totalTests++;
  if (fixedScore === 100) {
    console.log(`   ✅ SUCCESS - Perfect 100/100!`);
    passedTests++;
  } else {
    console.log(`   ❌ FAILED - Still has issues:`);
    fixedIssues.forEach(i => console.log(`     - ${i.ruleId} (Line ${i.line}): ${i.message}`));
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('FINAL RESULTS');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log(`\n🎉 ALL TESTS PASSED! Wassila is ready for production! 🚀`);
} else {
  console.log(`\n⚠️  Some tests failed. Review the issues above.`);
}
