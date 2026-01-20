/**
 * Example payloads for testing the ingestion module
 * These examples demonstrate the different types of ingestion supported
 */

// ============================================
// 1. EMAIL INGEST EXAMPLE
// ============================================
export const emailIngestExample = {
  source: "email",
  from: "customer@example.com",
  to: "support@yourcompany.com",
  subject: "Website is down - Urgent",
  body: `Hi Support Team,

Our company website (www.example.com) has been down for the past 30 minutes. 
This is affecting our business operations significantly.

Can you please investigate and resolve this ASAP?

Thanks,
John Doe
ABC Company`,
  headers: {
    "Message-ID": "<abc123@example.com>",
    "Date": "Mon, 20 Jan 2026 10:30:00 +0000",
    "Content-Type": "text/plain; charset=utf-8"
  },
  cc: ["manager@example.com"],
  attachments: [
    {
      filename: "screenshot.png",
      url: "https://storage.example.com/attachments/screenshot.png",
      mimeType: "image/png",
      size: 245678
    }
  ],
  receivedDate: new Date()
};

// ============================================
// 2. WEBHOOK INGEST EXAMPLE (Generic)
// ============================================
export const webhookIngestExample = {
  source: "webhook",
  webhookType: "generic",
  rawData: {
    event: "issue_created",
    priority: "high",
    title: "Database performance degradation",
    description: "Multiple users reporting slow query responses on production database",
    reporter: "monitoring-system"
  },
  rawText: "Database performance degradation - Multiple users reporting slow query responses on production database",
  sourceMeta: {
    webhookType: "monitoring",
    systemId: "datadog-prod",
    alertId: "alert-12345"
  }
};

// ============================================
// 3. SLACK WEBHOOK EXAMPLE
// ============================================
export const slackWebhookExample = {
  type: "event_callback",
  team_id: "T12345",
  event: {
    type: "message",
    user: "U12345",
    text: "Need help with deploying the new feature to production. Getting error: 'Module not found'",
    channel: "C12345",
    ts: "1234567890.123456"
  }
};

// ============================================
// 4. MANUAL INGEST EXAMPLE
// ============================================
export const manualIngestExample = {
  source: "manual",
  title: "Implement new user authentication flow",
  description: `We need to implement a new authentication flow with the following requirements:
  
1. Support for OAuth2 providers (Google, GitHub)
2. Two-factor authentication
3. Session management with JWT
4. Password reset functionality

Target completion: End of month`,
  rawText: `Implement new user authentication flow - Support for OAuth2 providers (Google, GitHub), Two-factor authentication, Session management with JWT, Password reset functionality`,
  priority: "medium",
  category: "feature",
  requestedBy: "Product Manager",
  createdBy: "user-id-here",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

// ============================================
// 5. FORM WEBHOOK EXAMPLE
// ============================================
export const formWebhookExample = {
  formId: "contact-support",
  submittedBy: "client@company.com",
  name: "Jane Smith",
  email: "jane.smith@company.com",
  subject: "Integration API Question",
  message: "How can we integrate your API with our internal CRM system? Do you have documentation for the REST endpoints?",
  category: "integration",
  priority: "normal",
  timestamp: new Date().toISOString()
};

// ============================================
// 6. CURL EXAMPLES FOR TESTING
// ============================================
export const curlExamples = `
# Test Email Ingest
curl -X POST http://localhost:3002/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "email",
    "from": "customer@example.com",
    "to": "support@yourcompany.com",
    "subject": "Website is down - Urgent",
    "body": "Hi Support Team, Our website has been down for 30 minutes. Please help!"
  }'

# Test Manual Ingest (requires auth token)
curl -X POST http://localhost:3002/api/ingest/manual \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "source": "manual",
    "title": "Fix login bug",
    "description": "Users cannot login with Google OAuth",
    "rawText": "Fix login bug - Users cannot login with Google OAuth",
    "priority": "high",
    "category": "bug"
  }'

# Test Webhook Ingest
curl -X POST http://localhost:3002/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "source": "webhook",
    "webhookType": "monitoring",
    "rawData": {
      "alert": "High CPU usage detected",
      "server": "prod-web-01",
      "cpu_usage": "95%"
    },
    "rawText": "High CPU usage detected on prod-web-01: 95%"
  }'

# Test Slack Webhook
curl -X POST http://localhost:3002/api/ingest/webhooks/slack \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "event_callback",
    "team_id": "T12345",
    "event": {
      "type": "message",
      "user": "U12345",
      "text": "Need help with deployment error",
      "channel": "C12345",
      "ts": "1234567890.123456"
    }
  }'

# Test Form Webhook
curl -X POST http://localhost:3002/api/ingest/webhooks/form \\
  -H "Content-Type: application/json" \\
  -d '{
    "formId": "contact-support",
    "email": "client@example.com",
    "message": "How can I integrate your API?",
    "category": "question"
  }'
`;

// ============================================
// 7. POSTMAN COLLECTION EXAMPLES
// ============================================
export const postmanCollection = {
  info: {
    name: "AWO Ingestion API",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [
    {
      name: "Email Ingest",
      request: {
        method: "POST",
        header: [
          {
            key: "Content-Type",
            value: "application/json"
          }
        ],
        body: {
          mode: "raw",
          raw: JSON.stringify(emailIngestExample, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/ingest",
          host: ["{{baseUrl}}"],
          path: ["api", "ingest"]
        }
      }
    },
    {
      name: "Manual Ingest",
      request: {
        method: "POST",
        header: [
          {
            key: "Content-Type",
            value: "application/json"
          },
          {
            key: "Authorization",
            value: "Bearer {{authToken}}"
          }
        ],
        body: {
          mode: "raw",
          raw: JSON.stringify(manualIngestExample, null, 2)
        },
        url: {
          raw: "{{baseUrl}}/api/ingest/manual",
          host: ["{{baseUrl}}"],
          path: ["api", "ingest", "manual"]
        }
      }
    }
  ],
  variable: [
    {
      key: "baseUrl",
      value: "http://localhost:3002"
    },
    {
      key: "authToken",
      value: "your-jwt-token-here"
    }
  ]
};

// ============================================
// 8. USAGE IN CODE
// ============================================
export const usageExample = `
// In your application code:

import axios from 'axios';

// Example 1: Send email ingest
async function sendEmailIngest(emailData) {
  try {
    const response = await axios.post('http://localhost:3002/api/ingest', {
      source: 'email',
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      attachments: emailData.attachments
    });
    
    console.log('Ingest created:', response.data.data.ingestId);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Example 2: Send manual ingest with auth
async function createManualTicket(ticketData, authToken) {
  try {
    const response = await axios.post(
      'http://localhost:3002/api/ingest/manual',
      {
        source: 'manual',
        title: ticketData.title,
        description: ticketData.description,
        rawText: ticketData.description,
        priority: ticketData.priority,
        category: ticketData.category
      },
      {
        headers: {
          'Authorization': \`Bearer \${authToken}\`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
`;
