# Webhook System Testing Documentation

## Overview
This document outlines the comprehensive testing strategy implemented for the optimized WhatsApp webhook system.

## Test Categories

### 1. Unit Tests
**Files:** `src/lib/webhook-utils.test.ts`, `src/lib/webhook-monitor.test.ts`

#### webhook-utils.test.ts
- **sendWithRetries function**
  - ✅ Successful requests on first attempt
  - ✅ Retry logic with exponential backoff
  - ✅ Timeout handling
  - ✅ Error classification (recoverable vs non-recoverable)
  - ✅ Idempotency key support
  - ✅ Rate limiting scenarios
  - ✅ Non-JSON response handling

- **validateWebhookSignature function**
  - ✅ Valid HMAC-SHA256 signature verification
  - ✅ Invalid signature format rejection
  - ✅ Signature mismatch detection

- **validateWebhookData function**
  - ✅ WhatsApp webhook format validation
  - ✅ Required field validation
  - ✅ Object type verification

- **extractMessageFromWebhook function**
  - ✅ Text message extraction
  - ✅ Image message extraction
  - ✅ Status update handling
  - ✅ Invalid data handling

#### webhook-monitor.test.ts
- **WebhookMonitor class**
  - ✅ Singleton pattern implementation
  - ✅ Metric recording and storage
  - ✅ Statistics calculation
  - ✅ Error categorization
  - ✅ Time-based grouping
  - ✅ Memory management (metric limits)
  - ✅ Data export (JSON/CSV)
  - ✅ Old data cleanup
  - ✅ Problem detection algorithms

### 2. Component Tests
**Files:** `src/hooks/use-webhook.test.tsx`

#### useWebhook hook
- ✅ State management (loading, error, retry count)
- ✅ Request cancellation
- ✅ Success/error callbacks
- ✅ Toast notifications
- ✅ Request history tracking
- ✅ History size limits

#### Specialized webhook hooks
- ✅ useAgentWebhook data structure
- ✅ usePromptWebhook data structure
- ✅ useCampaignWebhook data structure

### 3. Integration Tests
**Files:** `src/api/whatsapp-webhook.integration.test.ts`

#### processWebhook function
- ✅ End-to-end webhook processing
- ✅ Database integration (Supabase)
- ✅ Cache utilization
- ✅ Instance validation
- ✅ User plan verification
- ✅ Agent and campaign data loading
- ✅ Error handling scenarios
- ✅ Signature validation integration
- ✅ Message filtering logic

#### handleWhatsAppWebhook function (Legacy support)
- ✅ Old format compatibility
- ✅ Message type extraction
- ✅ Phone number formatting

### 4. Performance Tests
**Files:** `src/test/performance.test.ts`

#### Performance Benchmarks
- ✅ Single webhook processing under 100ms
- ✅ Concurrent load handling (100+ requests)
- ✅ Cache performance optimization
- ✅ Memory usage monitoring
- ✅ Rate limiting scenarios
- ✅ Sustained load testing
- ✅ Different message type consistency
- ✅ Monitoring overhead measurement

#### Stress Tests
- ✅ 5-second sustained load testing
- ✅ High-frequency request handling
- ✅ Memory leak prevention

### 5. End-to-End Tests
**Files:** `src/test/e2e-webhook-monitor.test.tsx`

#### WebhookMonitor Component
- ✅ Statistics display
- ✅ Real-time updates
- ✅ Chart rendering
- ✅ Data export functionality
- ✅ Tab navigation
- ✅ Loading and error states
- ✅ Alert detection and display

#### Accessibility Tests
- ✅ Screen reader compatibility
- ✅ Keyboard navigation
- ✅ User feedback mechanisms

## Test Utilities

### Mock System
**File:** `src/test/mocks.ts`
- ✅ WhatsApp webhook data samples
- ✅ Database record mocks
- ✅ Supabase client mock
- ✅ Crypto functions mock
- ✅ Response helpers

### Test Setup
**File:** `src/test/setup.ts`
- ✅ Global test configuration
- ✅ Mock implementations
- ✅ Cleanup procedures
- ✅ Environment variable mocks

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Unit tests only
npm run test:webhooks

# Integration tests
npm run test:integration

# Performance tests
npm run test:performance

# E2E tests
npm run test:e2e

# Hook tests
npm run test:hooks
```

### Test Options
```bash
# Run tests once
npm run test:run

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui
```

## Coverage Goals

### Current Coverage Targets
- **Unit Tests:** 95%+ line coverage
- **Integration Tests:** 90%+ branch coverage
- **Component Tests:** 85%+ statement coverage

### Key Areas Covered
- ✅ Webhook validation and processing
- ✅ Retry mechanisms and error handling
- ✅ Performance monitoring
- ✅ Database integration
- ✅ User interface components
- ✅ Real-time metrics
- ✅ Data export functionality

## Test Data

### Webhook Samples
- Valid text messages
- Image/video messages with captions
- Document messages
- Status updates
- Invalid/malformed data

### Database Mocks
- Active/inactive instances
- Different user plans
- Agent configurations
- Campaign settings

## Performance Benchmarks

### Response Time Targets
- Single webhook: < 100ms
- Batch processing: < 5s for 100 requests
- Cache hits: < 10ms
- Database queries: < 50ms

### Load Testing Results
- Concurrent requests: 100+ supported
- Sustained load: 5+ seconds at high frequency
- Memory usage: < 50MB increase for 200 webhooks
- Success rate: > 95% under normal conditions

## Monitoring Test Results

### Metrics Tracked
- Request success/failure rates
- Response time distributions
- Error categorization
- Retry attempt frequencies
- Cache hit/miss ratios

### Alert Conditions Tested
- Error rate > 50%
- Average response time > 3s
- High retry counts (> 3 attempts)
- Cache miss rate > 30%

## Continuous Integration

### Test Pipeline
1. Unit tests (fast feedback)
2. Integration tests (database connectivity)
3. Performance tests (benchmark validation)
4. E2E tests (user workflow validation)

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- Performance benchmarks must pass
- No console errors in E2E tests

## Future Test Enhancements

### Planned Additions
- [ ] Load testing with real WhatsApp webhook data
- [ ] Cross-browser compatibility tests
- [ ] Mobile responsive testing
- [ ] Security penetration testing
- [ ] Database migration testing
- [ ] Multi-instance testing
- [ ] Webhook replay testing
- [ ] Backup/recovery testing

### Test Environment Improvements
- [ ] Automated test data generation
- [ ] Test environment provisioning
- [ ] Performance regression detection
- [ ] Visual regression testing
- [ ] API contract testing

## Troubleshooting

### Common Test Failures
1. **Timeout errors:** Increase timeout values in slow environments
2. **Mock failures:** Ensure mocks are properly reset between tests
3. **Race conditions:** Use proper async/await patterns
4. **Memory leaks:** Check for unreleased resources

### Debug Techniques
- Use `vi.only()` to run specific tests
- Enable verbose logging in test environment
- Use debugger statements for step-through debugging
- Check test coverage reports for missed scenarios

## Conclusion

The webhook system testing suite provides comprehensive coverage across all system components, from low-level utility functions to complete user workflows. The tests ensure reliability, performance, and maintainability of the optimized webhook system while providing early detection of regressions and performance issues.
