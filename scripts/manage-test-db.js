#!/usr/bin/env node

const { Client } = require('pg');

// Parse command line arguments
const command = process.argv[2];

// Connect to postgres database (not the test database)
const adminClient = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres' // Connect to default postgres DB for admin operations
});

async function createTestDatabase() {
  try {
    await adminClient.connect();
    await adminClient.query('CREATE DATABASE petbnb_test');
    console.log('✅ Test database "petbnb_test" created successfully');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️  Test database "petbnb_test" already exists');
    } else {
      console.error('❌ Error creating test database:', error.message);
      process.exit(1);
    }
  } finally {
    await adminClient.end();
  }
}

async function dropTestDatabase() {
  try {
    await adminClient.connect();
    // Terminate any existing connections to the test database
    await adminClient.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = 'petbnb_test'
        AND pid <> pg_backend_pid()
    `);
    
    await adminClient.query('DROP DATABASE IF EXISTS petbnb_test');
    console.log('✅ Test database "petbnb_test" dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping test database:', error.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }
}

async function resetTestDatabase() {
  console.log('🔄 Resetting test database...');
  await dropTestDatabase();
  await createTestDatabase();
}

// Main execution
async function main() {
  switch (command) {
    case 'create':
      await createTestDatabase();
      break;
    case 'drop':
      await dropTestDatabase();
      break;
    case 'reset':
      await resetTestDatabase();
      break;
    default:
      console.error('Usage: node manage-test-db.js [create|drop|reset]');
      process.exit(1);
  }
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});