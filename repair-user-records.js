#!/usr/bin/env node

// This script manually repairs a user by creating missing profile and subscription records
// Usage: node repair-user-records.js <user_id>

// Import required libraries
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get user ID from command line args
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as an argument');
  console.error('Usage: node repair-user-records.js <user_id>');
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

async function repairUserRecords() {
  console.log(`Repairing database records for user ID: ${userId}`);
  
  try {
    // Check for authentication record first
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
    
    // Get user metadata
    const userData = authData.user;
    const userName = userData.user_metadata?.name || userData.email || 'User';
    
    // Step 1: Check for free plan
    let freePlanId;
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'Free')
      .single();
    
    if (planError || !planData) {
      console.log('Creating Free subscription plan...');
      const { data: newPlanData, error: newPlanError } = await supabase
        .from('subscription_plans')
        .insert({
          name: 'Free',
          price: 0,
          interval: 'month',
          message_limit: 50,
          agent_limit: 1,
          is_active: true,
          description: 'Free plan with limited features',
          features: { basic_ai: true, single_agent: true }
        })
        .select('id')
        .single();
      
      if (newPlanError) {
        console.error('Failed to create Free plan:', newPlanError);
        return;
      }
      
      freePlanId = newPlanData.id;
      console.log(`✅ Created new Free plan with ID: ${freePlanId}`);
    } else {
      freePlanId = planData.id;
      console.log(`✅ Found existing Free plan with ID: ${freePlanId}`);
    }
    
    // Step 2: Check for profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError || !profileData) {
      console.log('Creating profile record...');
      const { data: newProfileData, error: newProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userName,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();
      
      if (newProfileError) {
        console.error('Failed to create profile:', newProfileError);
      } else {
        console.log('✅ Created new profile record');
      }
    } else {
      console.log('✅ Profile record already exists');
    }
    
    // Step 3: Check for subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (subscriptionError || !subscriptionData) {
      console.log('Creating subscription record...');
      const now = new Date().toISOString();
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 100);
      
      const { data: newSubscriptionData, error: newSubscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: freePlanId,
          status: 'active',
          created_at: now,
          updated_at: now,
          current_period_start: now,
          current_period_end: farFuture.toISOString()
        })
        .select('*')
        .single();
      
      if (newSubscriptionError) {
        console.error('Failed to create subscription:', newSubscriptionError);
      } else {
        console.log('✅ Created new subscription record');
      }
    } else {
      console.log('✅ Subscription record already exists');
    }
    
    console.log('\nUser repair completed! Run verify-user-records.js to check the results.');
    
  } catch (error) {
    console.error('Unexpected error during repair:', error);
  }
}

repairUserRecords();
