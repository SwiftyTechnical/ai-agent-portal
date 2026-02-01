#!/usr/bin/env node

/**
 * Script to import all markdown policy files into the Supabase database.
 * Checks for duplicates using the slug field before inserting.
 *
 * Usage: node scripts/import-policies.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_API_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const POLICIES_DIR = path.join(__dirname, '..', 'content', 'policies');

/**
 * Extract the title from markdown content (first H1 heading)
 */
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Generate slug from filename (remove .md extension)
 */
function generateSlug(filename) {
  return filename.replace(/\.md$/, '');
}

/**
 * Read all markdown files from the policies directory
 */
function readPolicyFiles() {
  const files = fs.readdirSync(POLICIES_DIR);
  const policies = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(POLICIES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const title = extractTitle(content);
    const slug = generateSlug(file);

    if (!title) {
      console.warn(`Warning: No title found in ${file}, skipping...`);
      continue;
    }

    policies.push({
      title,
      slug,
      content,
      filePath: file
    });
  }

  return policies;
}

/**
 * Get existing policy slugs from the database
 */
async function getExistingSlugs() {
  const { data, error } = await supabase
    .from('policies')
    .select('slug');

  if (error) {
    console.error('Error fetching existing policies:', error.message);
    return new Set();
  }

  return new Set(data.map(p => p.slug));
}

/**
 * Get the admin user ID for created_by fields
 */
async function getAdminUserId() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching admin user:', error?.message);
    return null;
  }

  return data.id;
}

/**
 * Insert a new policy into the database
 */
async function insertPolicy(policy, adminUserId) {
  // Insert the policy
  const { data: policyData, error: policyError } = await supabase
    .from('policies')
    .insert({
      title: policy.title,
      slug: policy.slug,
      content: policy.content,
      current_version: 1,
      major_version: 1,
      minor_version: 0,
      workflow_status: 'draft'
    })
    .select()
    .single();

  if (policyError) {
    console.error(`Error inserting policy "${policy.title}":`, policyError.message);
    return null;
  }

  // Insert the initial version record (using correct schema columns)
  if (adminUserId) {
    const { error: versionError } = await supabase
      .from('policy_versions')
      .insert({
        policy_id: policyData.id,
        version_number: 1,
        version_label: '1.0',
        content: policy.content,
        change_summary: 'Initial import from markdown file',
        created_by: adminUserId
      });

    if (versionError) {
      console.error(`Error creating version for "${policy.title}":`, versionError.message);
    }

    // Insert workflow history record (using correct schema columns)
    const { error: historyError } = await supabase
      .from('workflow_history')
      .insert({
        policy_id: policyData.id,
        action: 'created',
        performed_by: adminUserId,
        from_version: null,
        to_version: '1.0',
        comments: 'Policy imported from markdown file'
      });

    if (historyError) {
      console.error(`Error creating workflow history for "${policy.title}":`, historyError.message);
    }
  }

  return policyData;
}

/**
 * Main import function
 */
async function importPolicies() {
  console.log('Starting policy import...\n');

  // Get admin user for created_by fields
  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    console.warn('Warning: No admin user found. Version and history records will not be created.\n');
  }

  // Read all policy files
  const policies = readPolicyFiles();
  console.log(`Found ${policies.length} policy files\n`);

  // Get existing slugs to check for duplicates
  const existingSlugs = await getExistingSlugs();
  console.log(`Found ${existingSlugs.size} existing policies in database\n`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const policy of policies) {
    if (existingSlugs.has(policy.slug)) {
      console.log(`⏭️  Skipping "${policy.title}" (already exists)`);
      skipped++;
      continue;
    }

    const result = await insertPolicy(policy, adminUserId);
    if (result) {
      console.log(`✅ Imported "${policy.title}"`);
      imported++;
    } else {
      console.log(`❌ Failed to import "${policy.title}"`);
      failed++;
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Total files:  ${policies.length}`);
  console.log(`Imported:     ${imported}`);
  console.log(`Skipped:      ${skipped} (duplicates)`);
  console.log(`Failed:       ${failed}`);
}

// Run the import
importPolicies().catch(console.error);
