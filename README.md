# 📡 Jira Webhook Receiver - Documentation

Complete guide for setting up Jira webhooks and receiving notifications about issue changes.

## 📋 Table of Contents

1. [Requirements](#requirements)
2. [Server Setup](#server-setup)
3. [Create Webhook in Jira (via API)](#create-webhook-in-jira-via-api)
4. [Create Webhook in Jira (via UI)](#create-webhook-in-jira-via-ui)
5. [Testing the Webhook](#testing-the-webhook)
6. [Managing Webhooks](#managing-webhooks)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Requirements

- **Jira Cloud** with administrator permissions
- **Jira API Token** ([Create token](https://id.atlassian.com/manage-profile/security/api-tokens))
- **Email** associated with your Jira account
- **Server** to receive webhooks (can be local with ngrok or cloud-based)

### Required Environment Variables

```bash
export JIRA_DOMAIN="sandbox-itti-digital.atlassian.net"
export JIRA_EMAIL="juan.estrada@itti.digital"
export JIRA_TOKEN="your-token-here"
export WEBHOOK_URL="https://your-server.com/webhook"
export PROJECT_KEY="ITTIAC"  # Optional
```

---

## 🚀 Server Setup

### Option 1: Local Server (Node.js)

The `webhook-server.js` file included in this repository is a simple Node.js server.

**Start the server locally:**

```bash
npm start
```

The server will be available at `http://localhost:3000` with the following endpoints:

- `POST /webhook` - Receives webhooks from Jira
- `GET /health` - Health check endpoint
- `GET /webhooks` - Query the last 10 received webhooks

### Option 2: Deploy to Render (Free)

1. Push code to GitHub
2. Go to [Render.com](https://render.com) and create an account
3. Create a new "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Build Command:** (empty or `npm install`)
   - **Start Command:** `npm start`
   - **Instance Type:** Free

Render will give you a URL like: `https://your-service.onrender.com`

**⚠️ Important about Render Free:**
- Server goes to sleep after 15 minutes of inactivity
- First request may take ~30 seconds (cold start)

### Option 3: Expose Local Server with ngrok

```bash
# Install ngrok
brew install ngrok

# Configure authtoken (get it from https://dashboard.ngrok.com)
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel
ngrok http 3000
```

ngrok will give you a public URL that you can use in Jira.

---

## 🔧 Create Webhook in Jira (via API)

### 1. List Existing Webhooks

```bash
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### 2. Create a New Webhook

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My ITTIAC Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = ITTIAC"
    },
    "excludeBody": false,
    "enabled": true
  }' | jq .
```

**Important Parameters:**

- `name`: Descriptive name for the webhook
- `url`: Your server URL that will receive the webhooks
- `events`: Array of events to listen for (see [available events](#available-events))
- `filters.issue-related-events-section`: JQL filter to limit which issues trigger the webhook
- `excludeBody`: `false` to receive the complete payload
- `enabled`: `true` to activate the webhook

### 3. Available Events

Most common events:

```json
{
  "events": [
    "jira:issue_created",
    "jira:issue_updated",
    "jira:issue_deleted",
    "comment_created",
    "comment_updated",
    "comment_deleted"
  ]
}
```

### 4. Common JQL Filters

```bash
# Only a specific project
"project = ITTIAC"

# Only status changes
"project = ITTIAC AND status changed"

# Only changes to a specific status
"project = ITTIAC AND status changed to Done"

# Specific status transitions
"project = ITTIAC AND status changed from \"To Do\" to \"In Progress\""

# No filter (all issues)
""
```

---

## 🖱️ Create Webhook in Jira (via UI)

Recommended if you're having issues with the API or need advanced features.

### Step 1: Go to Webhook Configuration

```
https://{your-domain}.atlassian.net/plugins/servlet/webhooks
```

Or navigate:
1. Settings (⚙️) → System
2. In the sidebar, look for "Webhooks" (Advanced section)

### Step 2: Create Webhook

1. Click on **"Create a WebHook"**
2. Fill out the form:

   | Field | Value |
   |-------|-------|
   | **Name** | `Webhook ITTIAC Production` |
   | **Status** | ✅ Enabled |
   | **URL** | `https://your-server.com/webhook` |
   | **Description** | (optional) |
   | **Events** | Check: Issue → updated |
   | **JQL** | `project = ITTIAC` |
   | **Exclude body** | ❌ DO NOT check |

3. Click **"Create"**

### Step 3: Verify

The webhook should appear in the list with:
- Status: Enabled
- URL: Your server
- Events: jira:issue_updated

---

## ✅ Testing the Webhook

### Method 1: Manually Change an Issue

1. Go to your project in Jira
2. Open any issue
3. Make a change (change status, edit summary, add comment)
4. Save

### Method 2: Use Jira API

**Change issue summary:**

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "summary": "New issue title"
    }
  }'
```

**Change issue status:**

```bash
# First, get available transitions
curl -s "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459/transitions" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '.transitions[] | {id, name}'

# Then, execute the transition (example: id "21" = In Progress)
curl -X POST "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459/transitions" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "transition": {
      "id": "21"
    }
  }'
```

### Method 3: Check Received Webhooks

**On the server:**

```bash
# Query last received webhooks
curl -s https://your-server.com/webhooks | jq .
```

**Example response:**

```json
{
  "total": 2,
  "webhooks": [
    {
      "timestamp": "2026-02-04T12:30:00.000Z",
      "issueKey": "ITTIAC-459",
      "summary": "My important task",
      "status": "In Progress",
      "changes": "status: \"To Do\" → \"In Progress\""
    },
    {
      "timestamp": "2026-02-04T12:25:00.000Z",
      "issueKey": "ITTIAC-458",
      "summary": "Another task",
      "status": "Done",
      "changes": "summary: \"Old title\" → \"New title\""
    }
  ]
}
```

### Method 4: Send Test Webhook

```bash
curl -X POST https://your-server.com/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookEvent": "jira:issue_updated",
    "issue": {
      "key": "ITTIAC-TEST",
      "fields": {
        "summary": "Test issue",
        "status": {"name": "In Progress"}
      }
    },
    "changelog": {
      "items": [{
        "field": "status",
        "fromString": "To Do",
        "toString": "In Progress"
      }]
    }
  }'
```

---

## 🔄 Managing Webhooks

### View Webhook Details

```bash
# First get the webhook ID
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '.[] | {id: .self | split("/") | last, name, url}'

# Then query details (replace {id} with the obtained ID)
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### Update a Webhook

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Webhook",
    "url": "https://new-url.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = ITTIAC"
    },
    "excludeBody": false,
    "enabled": true
  }' | jq .
```

### Disable a Webhook

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Webhook",
    "url": "https://your-server.com/webhook",
    "events": ["jira:issue_updated"],
    "enabled": false
  }' | jq .
```

### Delete a Webhook

```bash
curl -X DELETE "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}"
```

---

## 🐛 Troubleshooting

### Webhook is not firing

**Problem:** You make changes to issues but no webhooks arrive at the server.

**Solutions:**

1. **Verify the webhook is enabled:**
   ```bash
   curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '{name, enabled, url}'
   ```

2. **Check the JQL filter:**
   - If the filter is too restrictive, it might not trigger
   - Try without a filter or with: `project = YOUR_PROJECT`

3. **Verify the event matches:**
   - If you're only listening to `jira:issue_created` but editing, it won't fire
   - Use `jira:issue_updated` for changes

4. **Test with webhook.site:**
   - Go to https://webhook.site and copy the unique URL
   - Update your webhook in Jira with that URL
   - Make a change to an issue
   - If it arrives at webhook.site, the problem is with your server

### Server is not responding

**Problem:** Jira sends webhooks but your server doesn't receive them.

**Solutions:**

1. **Verify the server is running:**
   ```bash
   curl https://your-server.com/health
   ```

2. **If using Render Free, wake up the server first:**
   ```bash
   # Make a health request to wake up the server
   curl https://your-server.com/health

   # Wait 10 seconds
   sleep 10

   # Then make the change in Jira
   ```

3. **If using ngrok, verify the tunnel is active:**
   ```bash
   # Check the ngrok dashboard
   open http://localhost:4040
   ```

### Cannot create webhooks via API

**Problem:** You receive 401, 403, or 404 errors when creating webhooks.

**Solutions:**

1. **Verify your credentials:**
   ```bash
   # Test by getting your profile information
   curl -s "https://${JIRA_DOMAIN}/rest/api/3/myself" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
   ```

2. **Verify you have administrator permissions:**
   - Webhooks require Jira administrator permissions
   - Contact your administrator if you don't have access

3. **Use the UI instead:**
   - If the API doesn't work, create the webhook manually from:
   - `https://{your-domain}.atlassian.net/plugins/servlet/webhooks`

### Webhooks arrive but payload is empty

**Problem:** You receive notifications but without issue data.

**Solution:**

Make sure `excludeBody` is set to `false`:

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
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

### Example of Complete Jira Payload

```json
{
  "timestamp": 1770207360000,
  "webhookEvent": "jira:issue_updated",
  "issue_event_type_name": "issue_generic",
  "user": {
    "self": "https://sandbox-itti-digital.atlassian.net/rest/api/3/user?accountId=...",
    "accountId": "...",
    "displayName": "Juan Estrada",
    "emailAddress": "juan.estrada@itti.digital"
  },
  "issue": {
    "id": "10459",
    "self": "https://sandbox-itti-digital.atlassian.net/rest/api/3/issue/10459",
    "key": "ITTIAC-459",
    "fields": {
      "summary": "My important task",
      "status": {
        "self": "https://sandbox-itti-digital.atlassian.net/rest/api/3/status/10001",
        "id": "10001",
        "name": "In Progress",
        "statusCategory": {
          "id": 4,
          "key": "indeterminate",
          "name": "In Progress"
        }
      },
      "assignee": {
        "displayName": "Juan Estrada",
        "emailAddress": "juan.estrada@itti.digital"
      },
      "created": "2026-01-15T10:00:00.000-0300",
      "updated": "2026-02-04T17:36:00.000-0300"
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
- [Create API Token in Jira](https://id.atlassian.com/manage-profile/security/api-tokens)
- [JQL (Jira Query Language)](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-searching-in-jira-cloud/)

---

## 📝 Automated Setup Script

The included `setup-jira-webhook.sh` file automates webhook creation:

```bash
# Configure environment variables
export JIRA_DOMAIN="sandbox-itti-digital.atlassian.net"
export JIRA_EMAIL="juan.estrada@itti.digital"
export JIRA_TOKEN="your-token"
export WEBHOOK_URL="https://your-server.com/webhook"
export PROJECT_KEY="ITTIAC"

# Execute script
chmod +x setup-jira-webhook.sh
./setup-jira-webhook.sh
```

---

## 🎯 Complete Example: Zero to Hero

```bash
# 1. Configure variables
export JIRA_DOMAIN="sandbox-itti-digital.atlassian.net"
export JIRA_EMAIL="juan.estrada@itti.digital"
export JIRA_TOKEN="ATATT3xFf..."
export PROJECT_KEY="ITTIAC"

# 2. Start local server
npm start &

# 3. Expose with ngrok
ngrok http 3000 &
sleep 3

# 4. Get ngrok URL
WEBHOOK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')/webhook
echo "Webhook URL: $WEBHOOK_URL"

# 5. Create webhook in Jira
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Auto Webhook $(date +%Y%m%d%H%M%S)\",
    \"url\": \"${WEBHOOK_URL}\",
    \"events\": [\"jira:issue_updated\"],
    \"filters\": {
      \"issue-related-events-section\": \"project = ${PROJECT_KEY}\"
    },
    \"excludeBody\": false,
    \"enabled\": true
  }" | jq .

# 6. Test by changing an issue
curl -X PUT "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "summary": "Webhook Test '$(date +%s)'"
    }
  }'

# 7. View received webhooks (wait 5 seconds)
sleep 5
curl -s http://localhost:3000/webhooks | jq .
```

---

**Author:** Juan Estrada (juan.estrada@itti.digital)
**Project:** Jira Webhook POC
**Date:** February 2026

---

🤖 Generated with help from [Claude Code](https://claude.com/claude-code)
