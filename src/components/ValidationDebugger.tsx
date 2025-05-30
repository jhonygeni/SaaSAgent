// Debug hook for Name Validator
import React, { useState, useEffect } from 'react';
import whatsappService from '@/services/whatsappService';

// Helper to truncate long objects for display
const truncateObject = (obj, maxLength = 100) => {
  const str = JSON.stringify(obj);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

export default function ValidationDebugger() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const addLog = (message, data = null) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    setLogs(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        timestamp, 
        message, 
        data: data ? truncateObject(data) : null 
      }
    ]);
  };
  
  const testValidation = async () => {
    setIsLoading(true);
    addLog('Starting API test...');
    
    try {
      // Test fetchInstances directly
      addLog('Fetching instances...');
      const instances = await whatsappService.fetchInstances();
      addLog('Fetch successful!', instances);
      
      // Display instance names
      if (Array.isArray(instances)) {
        addLog(`Found ${instances.length} instances:`);
        instances.forEach(instance => {
          addLog(`- ${instance.name || '[name missing]'}`);
        });
      } else {
        addLog('Response is not an array!', instances);
      }
      
    } catch (error) {
      addLog(`❌ ERROR: ${error.message}`);
      console.error('Validation test error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h3 className="text-md font-medium mb-2">API Validation Debugger</h3>
      
      <button
        onClick={testValidation}
        disabled={isLoading}
        className="px-3 py-1 bg-blue-500 text-white rounded mb-4 hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-48 overflow-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">Click the button to test validation...</div>
        ) : (
          logs.map(log => (
            <div key={log.id}>
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              {log.data && (
                <div className="pl-5 text-yellow-300 break-all">{log.data}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
