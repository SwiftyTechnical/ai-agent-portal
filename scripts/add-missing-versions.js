#!/usr/bin/env node

/**
 * Script to add missing version and workflow history records for existing policies.
 * Run this after import-policies.js if version records are missing.
 *
 * Usage: node scripts/add-missing-versions.js
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

async function getPoliciesWithoutVersions() {
  // Get all policies
  const { data: policies, error: policiesError } = await supabase
    .from('policies')
    .select('id, title, content');

  if (policiesError) {
    console.error('Error fetching policies:', policiesError.message);
    return [];
  }

  // Get all policy_versions
  const { data: versions, error: versionsError } = await supabase
    .from('policy_versions')
    .select('policy_id');

  if (versionsError) {
    console.error('Error fetching versions:', versionsError.message);
    return [];
  }

  const policyIdsWithVersions = new Set(versions.map(v => v.policy_id));

  return policies.filter(p => !policyIdsWithVersions.has(p.id));
}

async function addMissingRecords() {
  console.log('Adding missing version and workflow history records...\n');

  const adminUserId = await getAdminUserId();
  if (!adminUserId) {
    console.error('Error: No admin user found. Cannot create records.');
    process.exit(1);
  }

  const policiesWithoutVersions = await getPoliciesWithoutVersions();
  console.log(`Found ${policiesWithoutVersions.length} policies without version records\n`);

  let added = 0;
  let failed = 0;

  for (const policy of policiesWithoutVersions) {
    // Add version record
    const { error: versionError } = await supabase
      .from('policy_versions')
      .insert({
        policy_id: policy.id,
        version_number: 1,
        version_label: '1.0',
        content: policy.content,
        change_summary: 'Initial import from markdown file',
        created_by: adminUserId
      });

    if (versionError) {
      console.error(`❌ Error creating version for "${policy.title}":`, versionError.message);
      failed++;
      continue;
    }

    // Add workflow history record
    const { error: historyError } = await supabase
      .from('workflow_history')
      .insert({
        policy_id: policy.id,
        action: 'created',
        performed_by: adminUserId,
        from_version: null,
        to_version: '1.0',
        comments: 'Policy imported from markdown file'
      });

    if (historyError) {
      console.error(`⚠️  Version added but workflow history failed for "${policy.title}":`, historyError.message);
    }

    console.log(`✅ Added version record for "${policy.title}"`);
    added++;
  }

  console.log('\n--- Summary ---');
  console.log(`Added:  ${added}`);
  console.log(`Failed: ${failed}`);
}

addMissingRecords().catch(console.error);
