#!/usr/bin/env node

// This script verifies if a specific user has the proper database records
// Usage: node verify-user-records.js <user_id>

// Import required libraries
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get user ID from command line args
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as an argument');
  console.error('Usage: node verify-user-records.js <user_id>');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error('You can set it temporarily with:');
  console.error('export SUPABASE_SERVICE_ROLE_KEY=your_service_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUserRecords() {
  console.log(`Verifying database records for user ID: ${userId}`);
  
  try {
    // Check for authentication record
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('Error fetching auth data:', authError);
      return;
    }
    
    if (!authData || !authData.user) {
      console.log('❌ No authentication record found for this user ID');
      return;
    }
    
    console.log('✅ Authentication record found');
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Created at: ${new Date(authData.user.created_at).toLocaleString()}`);
    
    // Check for profile record
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile data:', profileError);
      console.log('❌ Profile record check failed');
    } else if (!profileData) {
      console.log('❌ No profile record found for this user ID');
    } else {
      console.log('✅ Profile record found');
      console.log(`   Full name: ${profileData.full_name}`);
      console.log(`   Is active: ${profileData.is_active ? 'Yes' : 'No'}`);
    }
    
    // Check for subscription record
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError) {
      console.error('Error fetching subscription data:', subscriptionError);
      console.log('❌ Subscription record check failed');
    } else if (!subscriptionData) {
      console.log('❌ No subscription record found for this user ID');
    } else {
      console.log('✅ Subscription record found');
      console.log(`   Status: ${subscriptionData.status}`);
      console.log(`   Plan: ${subscriptionData.subscription_plans?.name || 'Unknown'}`);
      console.log(`   Created at: ${subscriptionData.created_at ? new Date(subscriptionData.created_at).toLocaleString() : 'Unknown'}`);
      
      if (!subscriptionData.subscription_plans) {
        console.log('⚠️  Warning: Subscription record exists but no plan is associated');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error during verification:', error);
  }
}

verifyUserRecords();
