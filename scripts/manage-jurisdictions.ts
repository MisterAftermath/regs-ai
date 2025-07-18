#!/usr/bin/env tsx

/**
 * Jurisdiction Management Utility
 *
 * This script helps manage jurisdictions in the Regs AI system.
 *
 * Usage:
 *   npm run manage-jurisdictions list              # List all jurisdictions
 *   npm run manage-jurisdictions test <id>         # Test a jurisdiction's ChromaDB connection
 *   npm run manage-jurisdictions validate          # Validate all jurisdiction configurations
 */

import { ChromaClient } from 'chromadb';
import { jurisdictions, getJurisdictionById } from '../lib/ai/jurisdictions';

const client = new ChromaClient({
  path: process.env.CHROMA_SERVER_URL || 'http://18.219.197.229:8000',
});

async function listJurisdictions() {
  console.log('\n📋 Configured Jurisdictions:\n');

  const jurisdictionsByState = jurisdictions.reduce(
    (acc, j) => {
      const state = j.state || 'Other';
      if (!acc[state]) acc[state] = [];
      acc[state].push(j);
      return acc;
    },
    {} as Record<string, typeof jurisdictions>,
  );

  for (const [state, stateJurisdictions] of Object.entries(
    jurisdictionsByState,
  )) {
    console.log(`\n${state}:`);
    for (const j of stateJurisdictions) {
      const defaultLabel = j.isDefault ? ' (DEFAULT)' : '';
      console.log(`  - ${j.name} [${j.id}]${defaultLabel}`);
      console.log(`    Collection: ${j.collection}`);
      if (j.description) {
        console.log(`    ${j.description}`);
      }
    }
  }

  console.log(`\nTotal jurisdictions: ${jurisdictions.length}`);
}

async function testJurisdiction(id: string) {
  const jurisdiction = getJurisdictionById(id);

  if (!jurisdiction) {
    console.error(`❌ Jurisdiction with ID "${id}" not found`);
    process.exit(1);
  }

  console.log(
    `\n🔍 Testing jurisdiction: ${jurisdiction.name} [${jurisdiction.id}]`,
  );
  console.log(`   Collection: ${jurisdiction.collection}`);

  try {
    console.log('\n1. Connecting to ChromaDB...');
    const collections = await client.listCollections();
    console.log(`   ✅ Connected. Found ${collections.length} collections.`);

    console.log('\n2. Checking if collection exists...');
    const collectionExists = collections.some(
      (c) => c.name === jurisdiction.collection,
    );

    if (!collectionExists) {
      console.log(`   ❌ Collection "${jurisdiction.collection}" not found!`);
      console.log(
        `   Available collections: ${collections.map((c) => c.name).join(', ')}`,
      );
      process.exit(1);
    }

    console.log(`   ✅ Collection found!`);

    console.log('\n3. Getting collection details...');
    const collection = await client.getCollection({
      name: jurisdiction.collection,
    });
    const count = await collection.count();
    console.log(`   ✅ Collection contains ${count} documents`);

    if (count === 0) {
      console.log(`   ⚠️  Warning: Collection is empty!`);
    }

    console.log('\n✅ Jurisdiction test passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

async function validateAllJurisdictions() {
  console.log('\n🔍 Validating all jurisdictions...\n');

  let hasErrors = false;
  const results: Array<{
    jurisdiction: (typeof jurisdictions)[0];
    status: string;
    error?: string;
  }> = [];

  // Check for duplicate IDs
  const ids = jurisdictions.map((j) => j.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    console.error(
      `❌ Duplicate jurisdiction IDs found: ${duplicateIds.join(', ')}`,
    );
    hasErrors = true;
  }

  // Check for duplicate collections
  const collections = jurisdictions.map((j) => j.collection);
  const duplicateCollections = collections.filter(
    (c, index) => collections.indexOf(c) !== index,
  );
  if (duplicateCollections.length > 0) {
    console.error(
      `❌ Duplicate collection names found: ${duplicateCollections.join(', ')}`,
    );
    hasErrors = true;
  }

  // Check each jurisdiction
  for (const jurisdiction of jurisdictions) {
    try {
      const collectionList = await client.listCollections();
      const exists = collectionList.some(
        (c) => c.name === jurisdiction.collection,
      );

      if (exists) {
        const collection = await client.getCollection({
          name: jurisdiction.collection,
        });
        const count = await collection.count();
        results.push({
          jurisdiction,
          status: count > 0 ? `✅ OK (${count} docs)` : '⚠️  Empty collection',
        });
      } else {
        results.push({
          jurisdiction,
          status: '❌ Collection not found',
          error: `Collection "${jurisdiction.collection}" does not exist in ChromaDB`,
        });
        hasErrors = true;
      }
    } catch (error) {
      results.push({
        jurisdiction,
        status: '❌ Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      hasErrors = true;
    }
  }

  // Display results
  console.log('Validation Results:\n');
  for (const result of results) {
    console.log(
      `${result.jurisdiction.name} [${result.jurisdiction.id}]: ${result.status}`,
    );
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  if (hasErrors) {
    console.log('\n❌ Validation failed with errors');
    process.exit(1);
  } else {
    console.log('\n✅ All jurisdictions validated successfully!');
  }
}

// Main CLI handler
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'list':
      await listJurisdictions();
      break;

    case 'test':
      if (!args[0]) {
        console.error('Usage: manage-jurisdictions test <jurisdiction-id>');
        process.exit(1);
      }
      await testJurisdiction(args[0]);
      break;

    case 'validate':
      await validateAllJurisdictions();
      break;

    default:
      console.log('Jurisdiction Management Utility\n');
      console.log('Commands:');
      console.log('  list              List all configured jurisdictions');
      console.log('  test <id>         Test a specific jurisdiction');
      console.log('  validate          Validate all jurisdictions');
      console.log('\nExamples:');
      console.log('  npm run manage-jurisdictions list');
      console.log('  npm run manage-jurisdictions test houston');
      console.log('  npm run manage-jurisdictions validate');
      break;
  }
}

main().catch(console.error);
