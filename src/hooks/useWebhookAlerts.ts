import { useState, useEffect, useCallback } from 'react';
import { getWebhookStats } from '@/lib/webhook-monitor';

export interface WebhookAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  url?: string;
  errorCode?: string;
  instanceName?: string;
  phoneNumber?: string;
  actionRequired?: boolean;
}

export interface UseWebhookAlertsReturn {
  alerts: WebhookAlert[];
  unacknowledgedCount: number;
  acknowledgeAlert: (alertId: string) => void;
  acknowledgeAll: () => void;
  addAlert: (alert: Omit<WebhookAlert, 'id' | 'timestamp' | 'acknowledged'>) => void;
  clearAlerts: () => void;
  getAlertsCount: () => number;
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  HIGH_ERROR_RATE: 0.1, // 10% error rate
  HIGH_RESPONSE_TIME: 5000, // 5 seconds
  CONSECUTIVE_FAILURES: 3,
  LOW_SUCCESS_RATE: 0.95 // Below 95% success rate
};

export function useWebhookAlerts(): UseWebhookAlertsReturn {
  const [alerts, setAlerts] = useState<WebhookAlert[]>([]);

  // Generate alerts based on webhook statistics
  const generateAlertsFromStats = useCallback(() => {
    const stats = getWebhookStats();
    const newAlerts: WebhookAlert[] = [];

    // High error rate alert
    if (stats.successRate < ALERT_THRESHOLDS.LOW_SUCCESS_RATE && stats.totalRequests > 0) {
      newAlerts.push({
        id: `error-rate-${Date.now()}`,
        type: 'error',
        severity: stats.successRate < 0.8 ? 'critical' : 'high',
        title: 'High Error Rate Detected',
        message: `Webhook success rate has dropped to ${(stats.successRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        acknowledged: false,
        actionRequired: true
      });
    }

    // High response time alert
    if (stats.averageResponseTime > ALERT_THRESHOLDS.HIGH_RESPONSE_TIME) {
      newAlerts.push({
        id: `response-time-${Date.now()}`,
        type: 'warning',
        severity: stats.averageResponseTime > 10000 ? 'high' : 'medium',
        title: 'Slow Response Times',
        message: `Average response time is ${stats.averageResponseTime.toFixed(0)}ms`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }

    // Server errors alert
    if (stats.errorsByType?.server_error > 0) {
      newAlerts.push({
        id: `server-error-${Date.now()}`,
        type: 'error',
        severity: 'high',
        title: 'Server Errors Detected',
        message: `${stats.errorsByType.server_error} server errors in recent requests`,
        timestamp: Date.now(),
        acknowledged: false,
        actionRequired: true
      });
    }

    // Client errors alert (might indicate configuration issues)
    if (stats.errorsByType?.client_error > 5) {
      newAlerts.push({
        id: `client-error-${Date.now()}`,
        type: 'warning',
        severity: 'medium',
        title: 'Multiple Client Errors',
        message: `${stats.errorsByType.client_error} client errors detected`,
        timestamp: Date.now(),
        acknowledged: false
      });
    }

    return newAlerts;
  }, []);

  // Monitor webhook stats and generate alerts
  useEffect(() => {
    const checkForAlerts = () => {
      const newAlerts = generateAlertsFromStats();
      
      if (newAlerts.length > 0) {
        setAlerts(prev => {
          // Filter out existing alerts of the same type to avoid duplicates
          const existingTypes = new Set(prev.map(alert => alert.title));
          const uniqueNewAlerts = newAlerts.filter(alert => !existingTypes.has(alert.title));
          
          return [...prev, ...uniqueNewAlerts];
        });
      }
    };

    // EMERGENCY FIX: Disable auto-refresh to prevent infinite loops
    // Check for alerts initially only, no auto-refresh
    checkForAlerts();
    // const interval = setInterval(checkForAlerts, 30000); // DISABLED
    
    // return () => clearInterval(interval); // DISABLED
    return () => {}; // No cleanup needed
  }, [generateAlertsFromStats]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  const acknowledgeAll = useCallback(() => {
    setAlerts(prev => 
      prev.map(alert => ({ ...alert, acknowledged: true }))
    );
  }, []);

  const addAlert = useCallback((alertData: Omit<WebhookAlert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: WebhookAlert = {
      ...alertData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false
    };

    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getAlertsCount = useCallback(() => {
    return alerts.length;
  }, [alerts]);

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return {
    alerts,
    unacknowledgedCount,
    acknowledgeAlert,
    acknowledgeAll,
    addAlert,
    clearAlerts,
    getAlertsCount
  };
}
