#!/usr/bin/env node

/**
 * Setup script to create initial admin user
 * Run this script after setting up the database schema
 * 
 * Usage: node scripts/setup-admin.js <email> <password>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/setup-admin.js <email> <password>');
    process.exit(1);
  }

  try {
    console.log('Setting up admin user...');

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      console.log('Admin user already exists with this email');
      return;
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      process.exit(1);
    }

    // Create admin record
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .insert({
        id: authData.user.id,
        email,
        role: 'super_admin',
        accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (adminError) {
      console.error('Error creating admin record:', adminError);
      // Clean up auth user if admin creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Role: super_admin`);
    console.log(`ID: ${adminData.id}`);

  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin(); 