# 📡 Jira Webhook Receiver - Documentación

Guía completa para configurar webhooks de Jira y recibir notificaciones de cambios en issues.

## 📋 Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Configuración del Servidor](#configuración-del-servidor)
3. [Crear Webhook en Jira (por API)](#crear-webhook-en-jira-por-api)
4. [Crear Webhook en Jira (por UI)](#crear-webhook-en-jira-por-ui)
5. [Probar el Webhook](#probar-el-webhook)
6. [Gestionar Webhooks](#gestionar-webhooks)
7. [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos

- **Jira Cloud** con permisos de administrador
- **API Token** de Jira ([Crear token](https://id.atlassian.com/manage-profile/security/api-tokens))
- **Email** de tu cuenta de Jira
- **Servidor** para recibir webhooks (puede ser local con ngrok o en la nube)

### Variables de Entorno Necesarias

```bash
export JIRA_DOMAIN="sandbox-itti-digital.atlassian.net"
export JIRA_EMAIL="juan.estrada@itti.digital"
export JIRA_TOKEN="tu-token-aqui"
export WEBHOOK_URL="https://tu-servidor.com/webhook"
export PROJECT_KEY="ITTIAC"  # Opcional
```

---

## 🚀 Configuración del Servidor

### Opción 1: Servidor Local (Node.js)

El archivo `webhook-server.js` incluido en este repositorio es un servidor simple de Node.js.

**Iniciar el servidor localmente:**

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000` con los siguientes endpoints:

- `POST /webhook` - Recibe webhooks de Jira
- `GET /health` - Health check
- `GET /webhooks` - Consulta los últimos 10 webhooks recibidos

### Opción 2: Desplegar en Render (Gratis)

1. Sube el código a GitHub
2. Ve a [Render.com](https://render.com) y crea una cuenta
3. Crea un nuevo "Web Service"
4. Conecta tu repositorio de GitHub
5. Configura:
   - **Build Command:** (vacío o `npm install`)
   - **Start Command:** `npm start`
   - **Instance Type:** Free

Render te dará una URL como: `https://tu-servicio.onrender.com`

**⚠️ Importante sobre Render Free:**
- El servidor se duerme después de 15 minutos sin actividad
- La primera petición puede tardar ~30 segundos (cold start)

### Opción 3: Exponer servidor local con ngrok

```bash
# Instalar ngrok
brew install ngrok

# Configurar authtoken (obtenerlo en https://dashboard.ngrok.com)
ngrok config add-authtoken TU_TOKEN

# Iniciar túnel
ngrok http 3000
```

Ngrok te dará una URL pública que puedes usar en Jira.

---

## 🔧 Crear Webhook en Jira (por API)

### 1. Listar Webhooks Existentes

```bash
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### 2. Crear un Nuevo Webhook

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Webhook ITTIAC",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = ITTIAC"
    },
    "excludeBody": false,
    "enabled": true
  }' | jq .
```

**Parámetros importantes:**

- `name`: Nombre descriptivo del webhook
- `url`: URL de tu servidor que recibirá los webhooks
- `events`: Array de eventos a escuchar (ver [eventos disponibles](#eventos-disponibles))
- `filters.issue-related-events-section`: Filtro JQL para limitar qué issues disparan el webhook
- `excludeBody`: `false` para recibir el payload completo
- `enabled`: `true` para activar el webhook

### 3. Eventos Disponibles

Eventos más comunes:

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

### 4. Filtros JQL Comunes

```bash
# Solo un proyecto específico
"project = ITTIAC"

# Solo cambios de estado
"project = ITTIAC AND status changed"

# Solo cambios a un estado específico
"project = ITTIAC AND status changed to Done"

# Solo cambios de estado específicos
"project = ITTIAC AND status changed from \"To Do\" to \"In Progress\""

# Sin filtro (todos los issues)
""
```

---

## 🖱️ Crear Webhook en Jira (por UI)

Recomendado si tienes problemas con la API o necesitas características avanzadas.

### Paso 1: Ir a Configuración de Webhooks

```
https://{tu-dominio}.atlassian.net/plugins/servlet/webhooks
```

O navega:
1. Configuración (⚙️) → Sistema
2. En la barra lateral, busca "Webhooks" (sección Advanced)

### Paso 2: Crear Webhook

1. Click en **"Create a WebHook"**
2. Llena el formulario:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `Webhook ITTIAC Production` |
   | **Status** | ✅ Enabled |
   | **URL** | `https://tu-servidor.com/webhook` |
   | **Description** | (opcional) |
   | **Events** | Marca: Issue → updated |
   | **JQL** | `project = ITTIAC` |
   | **Exclude body** | ❌ NO marcar |

3. Click en **"Create"**

### Paso 3: Verificar

El webhook debería aparecer en la lista con:
- Estado: Enabled
- URL: Tu servidor
- Events: jira:issue_updated

---

## ✅ Probar el Webhook

### Método 1: Cambiar un Issue Manualmente

1. Ve a tu proyecto en Jira
2. Abre cualquier issue
3. Haz un cambio (cambia estado, edita summary, agrega comentario)
4. Guarda

### Método 2: Usar la API de Jira

**Cambiar el summary de un issue:**

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "summary": "Nuevo título del issue"
    }
  }'
```

**Cambiar el estado de un issue:**

```bash
# Primero, obtén las transiciones disponibles
curl -s "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459/transitions" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '.transitions[] | {id, name}'

# Luego, ejecuta la transición (ejemplo: id "21" = In Progress)
curl -X POST "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459/transitions" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "transition": {
      "id": "21"
    }
  }'
```

### Método 3: Verificar Webhooks Recibidos

**En el servidor:**

```bash
# Consultar últimos webhooks recibidos
curl -s https://tu-servidor.com/webhooks | jq .
```

**Ejemplo de respuesta:**

```json
{
  "total": 2,
  "webhooks": [
    {
      "timestamp": "2026-02-04T12:30:00.000Z",
      "issueKey": "ITTIAC-459",
      "summary": "Mi tarea importante",
      "status": "In Progress",
      "changes": "status: \"To Do\" → \"In Progress\""
    },
    {
      "timestamp": "2026-02-04T12:25:00.000Z",
      "issueKey": "ITTIAC-458",
      "summary": "Otra tarea",
      "status": "Done",
      "changes": "summary: \"Título viejo\" → \"Título nuevo\""
    }
  ]
}
```

### Método 4: Enviar Webhook de Prueba

```bash
curl -X POST https://tu-servidor.com/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "webhookEvent": "jira:issue_updated",
    "issue": {
      "key": "ITTIAC-TEST",
      "fields": {
        "summary": "Issue de prueba",
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

## 🔄 Gestionar Webhooks

### Ver Detalles de un Webhook

```bash
# Primero obtén el ID del webhook
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '.[] | {id: .self | split("/") | last, name, url}'

# Luego consulta los detalles (reemplaza {id} con el ID obtenido)
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### Actualizar un Webhook

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Actualizado",
    "url": "https://nueva-url.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = ITTIAC"
    },
    "excludeBody": false,
    "enabled": true
  }' | jq .
```

### Deshabilitar un Webhook

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Webhook",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "enabled": false
  }' | jq .
```

### Eliminar un Webhook

```bash
curl -X DELETE "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}"
```

---

## 🐛 Troubleshooting

### El webhook no se dispara

**Problema:** Haces cambios en issues pero no llegan webhooks al servidor.

**Soluciones:**

1. **Verifica que el webhook esté habilitado:**
   ```bash
   curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '{name, enabled, url}'
   ```

2. **Verifica el filtro JQL:**
   - Si el filtro es muy restrictivo, puede que no se dispare
   - Prueba sin filtro o con: `project = TU_PROYECTO`

3. **Verifica que el evento coincida:**
   - Si solo escuchas `jira:issue_created` pero estás editando, no se disparará
   - Usa `jira:issue_updated` para cambios

4. **Prueba con webhook.site:**
   - Ve a https://webhook.site y copia la URL única
   - Actualiza tu webhook en Jira con esa URL
   - Haz un cambio en un issue
   - Si llega a webhook.site, el problema está en tu servidor

### El servidor no responde

**Problema:** Jira envía webhooks pero tu servidor no los recibe.

**Soluciones:**

1. **Verifica que el servidor esté corriendo:**
   ```bash
   curl https://tu-servidor.com/health
   ```

2. **Si usas Render Free, despierta el servidor primero:**
   ```bash
   # Haz una petición de health para despertar el servidor
   curl https://tu-servidor.com/health

   # Espera 10 segundos
   sleep 10

   # Luego haz el cambio en Jira
   ```

3. **Si usas ngrok, verifica que el túnel esté activo:**
   ```bash
   # Revisa el dashboard de ngrok
   open http://localhost:4040
   ```

### No puedo crear webhooks por API

**Problema:** Recibes errores 401, 403 o 404 al crear webhooks.

**Soluciones:**

1. **Verifica tus credenciales:**
   ```bash
   # Prueba obtener información de tu perfil
   curl -s "https://${JIRA_DOMAIN}/rest/api/3/myself" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
   ```

2. **Verifica que tengas permisos de administrador:**
   - Los webhooks requieren permisos de administrador de Jira
   - Contacta a tu administrador si no tienes acceso

3. **Usa la UI en su lugar:**
   - Si la API no funciona, crea el webhook manualmente desde:
   - `https://{tu-dominio}.atlassian.net/plugins/servlet/webhooks`

### Los webhooks llegan pero el payload está vacío

**Problema:** Recibes notificaciones pero sin datos del issue.

**Solución:**

Asegúrate de que `excludeBody` esté en `false`:

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/{id}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Webhook",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "excludeBody": false,
    "enabled": true
  }'
```

### Ejemplo de Payload Completo de Jira

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
      "summary": "Mi tarea importante",
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

## 📚 Recursos Adicionales

- [Jira Webhooks API Documentation](https://developer.atlassian.com/cloud/jira/platform/webhooks/)
- [Jira REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Crear API Token en Jira](https://id.atlassian.com/manage-profile/security/api-tokens)
- [JQL (Jira Query Language)](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-searching-in-jira-cloud/)

---

## 📝 Script de Configuración Automática

El archivo `setup-jira-webhook.sh` incluido automatiza la creación de webhooks:

```bash
# Configurar variables de entorno
export JIRA_DOMAIN="sandbox-itti-digital.atlassian.net"
export JIRA_EMAIL="juan.estrada@itti.digital"
export JIRA_TOKEN="tu-token"
export WEBHOOK_URL="https://tu-servidor.com/webhook"
export PROJECT_KEY="ITTIAC"

# Ejecutar script
chmod +x setup-jira-webhook.sh
./setup-jira-webhook.sh
```

---

## 🎯 Ejemplo Completo: De Zero a Hero

```bash
# 1. Configurar variables
export JIRA_DOMAIN="sandbox-itti-digital.atlassian.net"
export JIRA_EMAIL="juan.estrada@itti.digital"
export JIRA_TOKEN="ATATT3xFf..."
export PROJECT_KEY="ITTIAC"

# 2. Iniciar servidor local
npm start &

# 3. Exponer con ngrok
ngrok http 3000 &
sleep 3

# 4. Obtener URL de ngrok
WEBHOOK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')/webhook
echo "URL del webhook: $WEBHOOK_URL"

# 5. Crear webhook en Jira
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Webhook Auto $(date +%Y%m%d%H%M%S)\",
    \"url\": \"${WEBHOOK_URL}\",
    \"events\": [\"jira:issue_updated\"],
    \"filters\": {
      \"issue-related-events-section\": \"project = ${PROJECT_KEY}\"
    },
    \"excludeBody\": false,
    \"enabled\": true
  }" | jq .

# 6. Probar cambiando un issue
curl -X PUT "https://${JIRA_DOMAIN}/rest/api/3/issue/ITTIAC-459" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "summary": "Test Webhook '$(date +%s)'"
    }
  }'

# 7. Ver webhooks recibidos (espera 5 segundos)
sleep 5
curl -s http://localhost:3000/webhooks | jq .
```

---

**Autor:** Juan Estrada (juan.estrada@itti.digital)
**Proyecto:** Jira Webhook POC
**Fecha:** Febrero 2026

---

🤖 Generado con ayuda de [Claude Code](https://claude.com/claude-code)
