console.log('Simple test starting...');

try {
  console.log('Testing basic functionality...');
  
  // Test environment
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform);
  
  // Test basic objects
  console.log('Has console:', typeof console);
  console.log('Has process:', typeof process);
  console.log('Has Promise:', typeof Promise);
  console.log('Has fetch:', typeof fetch);
  
  console.log('Simple test completed successfully!');
  
} catch (error) {
  console.error('Simple test failed:', error);
}
