// Test script for verifying the webhook configuration
import fetch from 'node-fetch';

const testCustomEmailWebhook = async () => {
  const projectRef = 'hpovwcaskorzzrpphgkc';
  const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/custom-email`;
  
  // Sample payload that mimics what Supabase sends to the webhook
  const payload = {
    type: 'signup',
    email: 'test@example.com',
    data: {
      user_id: '00000000-0000-0000-0000-000000000000',
      email: 'test@example.com',
      name: 'Test User',
      confirmation_url: 'https://app.conversaai.com.br/confirm-email?token=mocktokenhere'
    }
  };

  console.log('Sending test request to webhook:', webhookUrl);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook test successful! Check your SMTP logs to verify email delivery.');
    } else {
      console.error('❌ Webhook test failed.');
    }
  } catch (error) {
    console.error('❌ Error calling webhook:', error);
  }
};

testCustomEmailWebhook();

// To run this script:
// node --experimental-modules test-custom-email-webhook.js
