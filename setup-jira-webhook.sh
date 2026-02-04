#!/bin/bash
# setup-jira-webhook.sh
# Uso: ./setup-jira-webhook.sh

set -euo pipefail

JIRA_DOMAIN="${JIRA_DOMAIN:?'Set JIRA_DOMAIN env var'}"
JIRA_EMAIL="${JIRA_EMAIL:?'Set JIRA_EMAIL env var'}"
JIRA_TOKEN="${JIRA_TOKEN:?'Set JIRA_TOKEN env var'}"
WEBHOOK_URL="${WEBHOOK_URL:?'Set WEBHOOK_URL env var'}"
PROJECT_KEY="${PROJECT_KEY:-}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-}"

# Construir filtro JQL
JQL_FILTER="status CHANGED"
if [ -n "$PROJECT_KEY" ]; then
  JQL_FILTER="project = ${PROJECT_KEY} AND status CHANGED"
fi

# Construir JSON del webhook
WEBHOOK_JSON=$(cat <<EOF
{
  "name": "Auto Status Webhook - $(date +%Y%m%d%H%M%S)",
  "url": "${WEBHOOK_URL}",
  "events": ["jira:issue_updated"],
  "filters": {
    "issue-related-events-section": "${JQL_FILTER}"
  },
  "excludeBody": false,
  "enabled": true
}
EOF
)

# Agregar secret si está configurado
if [ -n "$WEBHOOK_SECRET" ]; then
  WEBHOOK_JSON=$(echo "$WEBHOOK_JSON" | jq --arg s "$WEBHOOK_SECRET" '. + {secret: $s}')
fi

echo "📡 Creando webhook en ${JIRA_DOMAIN}..."
echo "   Filtro JQL: ${JQL_FILTER}"
echo "   URL destino: ${WEBHOOK_URL}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${WEBHOOK_JSON}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
  WEBHOOK_ID=$(echo "$BODY" | jq -r '.self // .id // "unknown"')
  echo "✅ Webhook creado exitosamente!"
  echo "$BODY" | jq .
else
  echo "❌ Error creando webhook (HTTP ${HTTP_CODE}):"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
  exit 1
fi
