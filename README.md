# 📡 Jira Webhook Receiver

Complete guide for setting up Jira webhooks to receive real-time notifications about issue changes.

🌐 **[Versión en Español](README.es.md)**

## 📋 Table of Contents

1. [Requirements](#requirements)
2. [Quick Start](#quick-start)
3. [Server Deployment](#server-deployment)
4. [Webhook Management via API](#webhook-management-via-api)
5. [Webhook Management via UI](#webhook-management-via-ui)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Requirements

- **Jira Cloud** instance with administrator permissions
- **Jira API Token** - [Create one here](https://id.atlassian.com/manage-profile/security/api-tokens)
- **Email** associated with your Jira account
- **GitHub** account (for deployment)
- **Render** account (free) - [Sign up here](https://render.com)

---

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
export JIRA_DOMAIN="your-domain.atlassian.net"
export JIRA_EMAIL="your-email@domain.com"
export JIRA_TOKEN="your-api-token-here"
export PROJECT_KEY="YOUR_PROJECT"  # Optional, for filtering
```

### 2. Deploy Server

**Option A: Deploy to Render (Recommended)**

1. Fork/Clone this repository
2. Push to your GitHub account
3. Go to [Render Dashboard](https://dashboard.render.com)
4. Click "New +" → "Web Service"
5. Connect your repository
6. Configure:
   - **Name:** `jira-webhook-receiver`
   - **Build Command:** (leave empty)
   - **Start Command:** `npm start`
   - **Instance Type:** Free
7. Click "Create Web Service"
8. Wait ~2 minutes for deployment
9. Copy your service URL: `https://your-service.onrender.com`

**Option B: Run Locally**

```bash
npm install
npm start
```

Server will start at `http://localhost:3000`

### 3. Keep Render Server Awake (Free Solution)

Render free tier sleeps after 15 minutes of inactivity. Use UptimeRobot to keep it awake:

1. Go to [UptimeRobot.com](https://uptimerobot.com) (free, no credit card)
2. Sign up
3. Click "Add New Monitor"
4. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Jira Webhook Server
   - **URL:** `https://your-service.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
5. Click "Create Monitor"

Done! Your server will stay awake and responsive.

### 4. Create Webhook

**Quick command:**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Production Webhook\",
    \"url\": \"https://your-service.onrender.com/webhook\",
    \"events\": [\"jira:issue_updated\"],
    \"filters\": {
      \"issue-related-events-section\": \"project = ${PROJECT_KEY}\"
    },
    \"excludeBody\": false,
    \"enabled\": true
  }"
```

### 5. Test It

Change any issue in your Jira project and check:

```bash
curl https://your-service.onrender.com/webhooks
```

---

## 🖥️ Server Deployment

### Endpoints

The server exposes three endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook` | POST | Receives webhooks from Jira |
| `/health` | GET | Health check (returns `{"status":"ok"}`) |
| `/webhooks` | GET | Returns last 10 webhooks received |

### Server Features

- **In-memory storage** of last 10 webhooks
- **Automatic parsing** of Jira payload
- **Console logging** with formatted output
- **JSON response** for easy debugging

### Deployment Options

#### Render (Recommended)

**Pros:**
- Free tier available
- Automatic deployments from GitHub
- HTTPS included
- No credit card required

**Cons:**
- Sleeps after 15 min (solved with UptimeRobot)

**Setup:**
1. Connect GitHub repository
2. Select Node.js environment
3. Set start command: `npm start`
4. Deploy

#### Railway

```bash
railway login
railway init
railway up
```

#### Heroku

```bash
heroku create jira-webhook-receiver
git push heroku main
```

---

## 🔧 Webhook Management via API

### List All Webhooks

```bash
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

**Example output:**
```json
[
  {
    "name": "Production Webhook",
    "url": "https://your-server.com/webhook",
    "enabled": true,
    "events": ["jira:issue_updated"],
    "self": "https://your-domain.atlassian.net/rest/webhooks/1.0/webhook/1"
  }
]
```

### Create Webhook

**Basic webhook (all projects):**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "excludeBody": false,
    "enabled": true
  }'
```

**Webhook with project filter:**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Specific Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = MYPROJECT"
    },
    "excludeBody": false,
    "enabled": true
  }'
```

**Webhook with status filter:**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Status Change Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = MYPROJECT AND status changed"
    },
    "excludeBody": false,
    "enabled": true
  }'
```

### Get Webhook Details

```bash
# Get webhook ID from list command
WEBHOOK_ID="1"

curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### Update Webhook

**Update URL:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://new-server.com/webhook",
    "events": ["jira:issue_updated"],
    "excludeBody": false,
    "enabled": true
  }'
```

**Update JQL filter:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = NEWPROJECT"
    },
    "excludeBody": false,
    "enabled": true
  }'
```

### Enable/Disable Webhook

**Disable:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "enabled": false
  }'
```

**Enable:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "enabled": true
  }'
```

### Delete Webhook

```bash
WEBHOOK_ID="1"

curl -X DELETE "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}"
```

**Verify deletion:**

```bash
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### Common Event Types

```json
{
  "events": [
    "jira:issue_created",
    "jira:issue_updated",
    "jira:issue_deleted",
    "comment_created",
    "comment_updated",
    "comment_deleted",
    "issue_property_set",
    "issue_property_deleted"
  ]
}
```

### JQL Filter Examples

```bash
# All issues in project
"project = MYPROJECT"

# Only status changes
"project = MYPROJECT AND status changed"

# Specific status transition
"project = MYPROJECT AND status changed from \"To Do\" to \"In Progress\""

# Multiple projects
"project in (PROJ1, PROJ2)"

# Specific issue types
"project = MYPROJECT AND type = Bug"

# Assigned to specific user
"project = MYPROJECT AND assignee = currentUser()"
```

---

## 🖱️ Webhook Management via UI

### Access Webhook Settings

1. Go to your Jira instance
2. Click Settings (⚙️) → System
3. Under "Advanced" section, click **Webhooks**
4. Or navigate directly to:
   ```
   https://your-domain.atlassian.net/plugins/servlet/webhooks
   ```

### Create Webhook via UI

1. Click **"Create a WebHook"**
2. Fill in the form:

| Field | Value | Required |
|-------|-------|----------|
| Name | Descriptive name | ✅ Yes |
| Status | ✅ Enabled | ✅ Yes |
| URL | `https://your-server.com/webhook` | ✅ Yes |
| Description | Optional notes | ❌ No |
| Events | Select "Issue → updated" | ✅ Yes |
| JQL | `project = MYPROJECT` | ❌ No |
| Exclude body | ❌ Leave unchecked | ✅ Yes |

3. Click **"Create"**

### Edit Webhook via UI

1. Go to webhook list
2. Click on webhook name
3. Modify fields
4. Click **"Update"**

### Delete Webhook via UI

1. Go to webhook list
2. Find your webhook
3. Click trash icon (🗑️)
4. Confirm deletion

---

## ✅ Testing

### Test 1: Verify Jira is sending webhooks (webhook.site)

**RECOMMENDED FIRST STEP** - Confirm Jira sends webhooks before debugging your server:

1. Go to https://webhook.site
2. Copy your unique URL (e.g., `https://webhook.site/01126c1c-31d3-4d87-89ce-a2c2215e5cb5`)
3. Update your Jira webhook to point to that URL:
   ```bash
   WEBHOOK_ID="1"
   curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
     -H "Content-Type: application/json" \
     -d "{
       \"name\": \"Test Webhook\",
       \"url\": \"https://webhook.site/your-unique-id\",
       \"events\": [\"jira:issue_updated\"],
       \"excludeBody\": false,
       \"enabled\": true
     }"
   ```
4. Make a change in Jira (update any issue)
5. **Refresh webhook.site** - you should see the full payload immediately
6. ✅ **If it works:** Jira is configured correctly, issue is with your server
7. ❌ **If it doesn't work:** Issue is with Jira webhook configuration (check JQL filter, events, enabled status)

**This method works 100%** and is the fastest way to debug webhook issues.

### Test 2: Server Health Check

```bash
curl https://your-server.com/health
```

**Expected response:**
```json
{"status":"ok","port":"10000"}
```

### Test 3: Manual Webhook Trigger

Update an issue via Jira UI or API:

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/api/3/issue/PROJ-123" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "summary": "Updated summary for testing webhook"
    }
  }'
```

### Test 4: Check Received Webhooks

```bash
curl https://your-server.com/webhooks | jq .
```

**Expected response:**
```json
{
  "total": 1,
  "webhooks": [
    {
      "timestamp": "2026-02-04T12:00:00.000Z",
      "issueKey": "PROJ-123",
      "summary": "Updated summary for testing webhook",
      "status": "In Progress",
      "changes": "summary: \"Old title\" → \"Updated summary for testing webhook\""
    }
  ]
}
```

### Test 5: Send Test Payload

```bash
curl -X POST https://your-server.com/webhook \
  -H "Content-Type: application/json" \
  -H "User-Agent: Atlassian HttpClient" \
  -d '{
    "webhookEvent": "jira:issue_updated",
    "issue": {
      "key": "TEST-1",
      "fields": {
        "summary": "Test Issue",
        "status": {"name": "Done"}
      }
    },
    "changelog": {
      "items": [{
        "field": "status",
        "fromString": "In Progress",
        "toString": "Done"
      }]
    }
  }'
```

---

## 🐛 Troubleshooting

### Issue: Webhook not firing

**Symptom:** Changes in Jira don't trigger webhooks

**Solutions:**

1. **Verify webhook is enabled:**
   ```bash
   curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '.[] | {name, enabled, url}'
   ```

2. **Check JQL filter:**
   - Filters are case-sensitive
   - Test your JQL in Jira's issue search first
   - Remove filter temporarily to test: update webhook without `filters` field

3. **Verify event type:**
   - Use `"jira:issue_updated"` for most changes
   - Check you're triggering the right event (e.g., editing vs creating)

4. **Test with webhook.site (100% reliable):**
   - Update webhook URL to `https://webhook.site/unique-id` (get URL from https://webhook.site)
   - Make a change in Jira
   - ✅ **If it arrives at webhook.site:** Jira is working correctly, problem is your server
   - ❌ **If it doesn't arrive:** Problem is Jira webhook configuration (JQL filter, events, or enabled status)

### Issue: Server not responding

**Symptom:** Webhooks sent by Jira but server doesn't receive them

**Solutions:**

1. **Check server is running:**
   ```bash
   curl https://your-server.com/health
   ```

   If it returns 404 or times out, server is down.

2. **For Render:** Check if server is sleeping
   - Free tier sleeps after 15 min of inactivity
   - Solution: Set up UptimeRobot (see Quick Start section)

3. **Check server logs:**
   - Render: Dashboard → Service → Logs tab
   - Local: Check terminal output

4. **Verify URL is correct:**
   - Must include `/webhook` path: `https://your-server.com/webhook`
   - Must be `https://` not `http://`

### Issue: Webhook arrives but payload is empty

**Symptom:** Server receives requests but no data

**Solution:**

Ensure `excludeBody` is set to `false`:

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/1" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "excludeBody": false,
    "enabled": true
  }'
```

### Issue: 401 Unauthorized when managing webhooks

**Symptom:** API returns 401 error

**Solutions:**

1. **Verify credentials:**
   ```bash
   curl -s "https://${JIRA_DOMAIN}/rest/api/3/myself" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
   ```

   Should return your user info. If not, regenerate API token.

2. **Check permissions:**
   - Webhooks require Jira administrator permissions
   - Contact your Jira admin if you don't have access

3. **Verify API token:**
   - Token must be from: https://id.atlassian.com/manage-profile/security/api-tokens
   - Token should start with `ATATT3x...`

### Issue: JQL filter not working

**Symptom:** Webhook fires for wrong issues or doesn't fire at all

**Solutions:**

1. **Test JQL in Jira:**
   - Go to Issues → Search for issues
   - Enter your JQL
   - Verify it returns expected results

2. **Common JQL mistakes:**
   - Case sensitivity: `Status` vs `status`
   - Quotes: Use `\"` in API calls
   - Spaces: `status changed` not `status  changed`

3. **Simplify filter:**
   - Start with: `project = MYPROJECT`
   - Add conditions incrementally
   - Test after each change

### Issue: Too many webhooks

**Symptom:** Server receiving webhooks for unwanted events

**Solutions:**

1. **Add project filter:**
   ```json
   {
     "filters": {
       "issue-related-events-section": "project = MYPROJECT"
     }
   }
   ```

2. **Filter by status changes only:**
   ```json
   {
     "filters": {
       "issue-related-events-section": "project = MYPROJECT AND status changed"
     }
   }
   ```

3. **Use specific events:**
   ```json
   {
     "events": ["jira:issue_updated"]
   }
   ```
   Instead of multiple event types.

### Example Jira Webhook Payload

When Jira sends a webhook, this is what your server receives:

```json
{
  "timestamp": 1770207360000,
  "webhookEvent": "jira:issue_updated",
  "issue_event_type_name": "issue_generic",
  "user": {
    "displayName": "John Doe",
    "accountId": "557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
    "emailAddress": "john@example.com"
  },
  "issue": {
    "id": "10001",
    "key": "PROJ-123",
    "fields": {
      "summary": "Fix login bug",
      "status": {
        "name": "In Progress",
        "id": "3"
      },
      "assignee": {
        "displayName": "Jane Smith",
        "emailAddress": "jane@example.com"
      },
      "created": "2026-01-15T10:00:00.000-0300",
      "updated": "2026-02-04T14:30:00.000-0300"
    }
  },
  "changelog": {
    "items": [
      {
        "field": "status",
        "fieldtype": "jira",
        "from": "10000",
        "fromString": "To Do",
        "to": "10001",
        "toString": "In Progress"
      }
    ]
  }
}
```

---

## 📚 Additional Resources

- [Jira Webhooks API Documentation](https://developer.atlassian.com/cloud/jira/platform/webhooks/)
- [Jira REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [JQL (Jira Query Language) Guide](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-searching-in-jira-cloud/)
- [Render Documentation](https://render.com/docs)
- [UptimeRobot Documentation](https://uptimerobot.com/help)

---

## 📝 Automated Setup Script

The `setup-jira-webhook.sh` script automates webhook creation:

```bash
#!/bin/bash
# Configure variables
export JIRA_DOMAIN="your-domain.atlassian.net"
export JIRA_EMAIL="your-email@domain.com"
export JIRA_TOKEN="your-token"
export WEBHOOK_URL="https://your-server.com/webhook"
export PROJECT_KEY="MYPROJECT"

# Run script
chmod +x setup-jira-webhook.sh
./setup-jira-webhook.sh
```

---

**Author:** Juan Estrada (juan.estrada@itti.digital)
**Project:** Jira Webhook POC
**Repository:** https://github.com/juan-estrada-itti/webhook_poc
**Date:** February 2026
