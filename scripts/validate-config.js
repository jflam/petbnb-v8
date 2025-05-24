#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_CHECKS = [
  {
    name: 'Database Name Consistency',
    searchTerms: ['app_db', 'aistart_db', 'starter_db'],
    expectedValue: 'petbnb',
    excludeDirs: ['node_modules', '.git', 'dist', 'build']
  },
  {
    name: 'Application Name Consistency',
    searchTerms: ['AI Starter App', 'ai-starter-app-postgis'],
    expectedValue: 'PetBnB',
    excludeDirs: ['node_modules', '.git', 'dist', 'build', '.lock']
  }
];

function searchForTerm(term, excludeDirs) {
  const excludeArgs = excludeDirs.map(dir => `--exclude-dir=${dir}`).join(' ');
  try {
    const result = execSync(`grep -r "${term}" . ${excludeArgs} 2>/dev/null || true`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    return result.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.error(`Error searching for "${term}":`, error.message);
    return [];
  }
}

async function validateConfiguration() {
  console.log('🔍 Running configuration validation checks...\n');
  let errors = [];
  
  for (const check of CONFIG_CHECKS) {
    console.log(`Running check: ${check.name}`);
    console.log(`Expected value: ${check.expectedValue}`);
    console.log(`Searching for obsolete terms: ${check.searchTerms.join(', ')}\n`);
    
    for (const term of check.searchTerms) {
      const occurrences = searchForTerm(term, check.excludeDirs);
      
      if (occurrences.length > 0) {
        console.error(`❌ Found ${occurrences.length} occurrences of "${term}":`);
        occurrences.forEach(occurrence => {
          console.error(`   ${occurrence}`);
        });
        errors.push({
          check: check.name,
          term: term,
          count: occurrences.length,
          expectedValue: check.expectedValue
        });
      } else {
        console.log(`✅ No occurrences of "${term}" found`);
      }
    }
    console.log('');
  }
  
  // Additional specific checks
  console.log('Running additional configuration checks...\n');
  
  // Check docker-compose.yml
  try {
    const dockerCompose = fs.readFileSync(path.join(__dirname, '..', 'docker-compose.yml'), 'utf8');
    if (!dockerCompose.includes('POSTGRES_DB: petbnb')) {
      errors.push({
        check: 'Docker Compose Database',
        issue: 'POSTGRES_DB is not set to "petbnb" in docker-compose.yml'
      });
      console.error('❌ Docker Compose: POSTGRES_DB is not set to "petbnb"');
    } else {
      console.log('✅ Docker Compose: POSTGRES_DB correctly set to "petbnb"');
    }
  } catch (error) {
    console.error('❌ Could not read docker-compose.yml:', error.message);
  }
  
  // Check .env file if it exists
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('petbnb')) {
        console.warn('⚠️  .env file does not reference "petbnb" database');
      } else {
        console.log('✅ .env file contains "petbnb" database reference');
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not check .env file:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (errors.length > 0) {
    console.error(`❌ Configuration validation FAILED with ${errors.length} issues:\n`);
    errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error.check || 'Check'}`);
      if (error.term) {
        console.error(`   Found "${error.term}" (should be "${error.expectedValue}")`);
        console.error(`   ${error.count} occurrences need to be updated`);
      } else if (error.issue) {
        console.error(`   ${error.issue}`);
      }
      console.error('');
    });
    process.exit(1);
  }
  
  console.log('✅ All configuration checks passed!');
  console.log('The codebase is properly configured for PetBnB.');
}

// Run validation
validateConfiguration().catch(error => {
  console.error('Validation script error:', error);
  process.exit(1);
});