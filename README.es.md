# 📡 Receptor de Webhooks de Jira

Guía completa para configurar webhooks de Jira y recibir notificaciones en tiempo real sobre cambios en issues.

## 📋 Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Inicio Rápido](#inicio-rápido)
3. [Despliegue del Servidor](#despliegue-del-servidor)
4. [Gestión de Webhooks vía API](#gestión-de-webhooks-vía-api)
5. [Gestión de Webhooks vía UI](#gestión-de-webhooks-vía-ui)
6. [Pruebas](#pruebas)
7. [Resolución de Problemas](#resolución-de-problemas)

---

## 📦 Requisitos

- **Jira Cloud** con permisos de administrador
- **Token API de Jira** - [Créalo aquí](https://id.atlassian.com/manage-profile/security/api-tokens)
- **Email** asociado a tu cuenta de Jira
- Cuenta de **GitHub** (para despliegue)
- Cuenta de **Render** (gratis) - [Regístrate aquí](https://render.com)

---

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
export JIRA_DOMAIN="tu-dominio.atlassian.net"
export JIRA_EMAIL="tu-email@dominio.com"
export JIRA_TOKEN="tu-token-api-aqui"
export PROJECT_KEY="TU_PROYECTO"  # Opcional, para filtrar
```

### 2. Desplegar Servidor

**Opción A: Desplegar en Render (Recomendado)**

1. Haz fork/clona este repositorio
2. Sube a tu cuenta de GitHub
3. Ve al [Dashboard de Render](https://dashboard.render.com)
4. Click "New +" → "Web Service"
5. Conecta tu repositorio
6. Configura:
   - **Name:** `jira-webhook-receiver`
   - **Build Command:** (dejar vacío)
   - **Start Command:** `npm start`
   - **Instance Type:** Free
7. Click "Create Web Service"
8. Espera ~2 minutos para el despliegue
9. Copia la URL de tu servicio: `https://tu-servicio.onrender.com`

**Opción B: Ejecutar Localmente**

```bash
npm install
npm start
```

El servidor iniciará en `http://localhost:3000`

### 3. Mantener el Servidor de Render Activo (Solución Gratuita)

El tier gratuito de Render se duerme después de 15 minutos de inactividad. Usa UptimeRobot para mantenerlo activo:

1. Ve a [UptimeRobot.com](https://uptimerobot.com) (gratis, sin tarjeta de crédito)
2. Regístrate
3. Click "Add New Monitor"
4. Configura:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Jira Webhook Server
   - **URL:** `https://tu-servicio.onrender.com/health`
   - **Monitoring Interval:** 5 minutos
5. Click "Create Monitor"

¡Listo! Tu servidor se mantendrá activo y receptivo.

### 4. Crear Webhook

**Comando rápido:**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Webhook Producción\",
    \"url\": \"https://tu-servicio.onrender.com/webhook\",
    \"events\": [\"jira:issue_updated\"],
    \"filters\": {
      \"issue-related-events-section\": \"project = ${PROJECT_KEY}\"
    },
    \"excludeBody\": false,
    \"enabled\": true
  }"
```

### 5. Probar

Cambia cualquier issue en tu proyecto de Jira y verifica:

```bash
curl https://tu-servicio.onrender.com/webhooks
```

---

## 🖥️ Despliegue del Servidor

### Endpoints

El servidor expone tres endpoints:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/webhook` | POST | Recibe webhooks de Jira |
| `/health` | GET | Health check (retorna `{"status":"ok"}`) |
| `/webhooks` | GET | Retorna los últimos 10 webhooks recibidos |

### Características del Servidor

- **Almacenamiento en memoria** de los últimos 10 webhooks
- **Parseo automático** del payload de Jira
- **Logging en consola** con salida formateada
- **Respuesta JSON** para fácil debugging

### Opciones de Despliegue

#### Render (Recomendado)

**Pros:**
- Tier gratuito disponible
- Despliegues automáticos desde GitHub
- HTTPS incluido
- No requiere tarjeta de crédito

**Contras:**
- Se duerme después de 15 min (se soluciona con UptimeRobot)

**Configuración:**
1. Conecta el repositorio de GitHub
2. Selecciona entorno Node.js
3. Establece comando de inicio: `npm start`
4. Despliega

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

## 🔧 Gestión de Webhooks vía API

### Listar Todos los Webhooks

```bash
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

**Ejemplo de salida:**
```json
[
  {
    "name": "Webhook Producción",
    "url": "https://tu-servidor.com/webhook",
    "enabled": true,
    "events": ["jira:issue_updated"],
    "self": "https://tu-dominio.atlassian.net/rest/webhooks/1.0/webhook/1"
  }
]
```

### Crear Webhook

**Webhook básico (todos los proyectos):**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
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

**Webhook con filtro de proyecto:**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Específico de Proyecto",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = MIPROYECTO"
    },
    "excludeBody": false,
    "enabled": true
  }'
```

**Webhook con filtro de estado:**

```bash
curl -X POST "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Cambio de Estado",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = MIPROYECTO AND status changed"
    },
    "excludeBody": false,
    "enabled": true
  }'
```

### Obtener Detalles del Webhook

```bash
# Obtén el ID del webhook del comando list
WEBHOOK_ID="1"

curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### Actualizar Webhook

**Actualizar URL:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Webhook",
    "url": "https://nuevo-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "excludeBody": false,
    "enabled": true
  }'
```

**Actualizar filtro JQL:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Webhook",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "filters": {
      "issue-related-events-section": "project = NUEVOPROYECTO"
    },
    "excludeBody": false,
    "enabled": true
  }'
```

### Habilitar/Deshabilitar Webhook

**Deshabilitar:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Webhook",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "enabled": false
  }'
```

**Habilitar:**

```bash
WEBHOOK_ID="1"

curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Webhook",
    "url": "https://tu-servidor.com/webhook",
    "events": ["jira:issue_updated"],
    "enabled": true
  }'
```

### Eliminar Webhook

```bash
WEBHOOK_ID="1"

curl -X DELETE "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}"
```

**Verificar eliminación:**

```bash
curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
```

### Tipos de Eventos Comunes

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

### Ejemplos de Filtros JQL

```bash
# Todos los issues del proyecto
"project = MIPROYECTO"

# Solo cambios de estado
"project = MIPROYECTO AND status changed"

# Transición específica de estado
"project = MIPROYECTO AND status changed from \"To Do\" to \"In Progress\""

# Múltiples proyectos
"project in (PROJ1, PROJ2)"

# Tipos de issue específicos
"project = MIPROYECTO AND type = Bug"

# Asignado a usuario específico
"project = MIPROYECTO AND assignee = currentUser()"
```

---

## 🖱️ Gestión de Webhooks vía UI

### Acceder a Configuración de Webhooks

1. Ve a tu instancia de Jira
2. Click en Configuración (⚙️) → Sistema
3. En la sección "Avanzado", click **Webhooks**
4. O navega directamente a:
   ```
   https://tu-dominio.atlassian.net/plugins/servlet/webhooks
   ```

### Crear Webhook vía UI

1. Click **"Create a WebHook"**
2. Llena el formulario:

| Campo | Valor | Requerido |
|-------|-------|-----------|
| Name | Nombre descriptivo | ✅ Sí |
| Status | ✅ Enabled | ✅ Sí |
| URL | `https://tu-servidor.com/webhook` | ✅ Sí |
| Description | Notas opcionales | ❌ No |
| Events | Selecciona "Issue → updated" | ✅ Sí |
| JQL | `project = MIPROYECTO` | ❌ No |
| Exclude body | ❌ Dejar sin marcar | ✅ Sí |

3. Click **"Create"**

### Editar Webhook vía UI

1. Ve a la lista de webhooks
2. Click en el nombre del webhook
3. Modifica los campos
4. Click **"Update"**

### Eliminar Webhook vía UI

1. Ve a la lista de webhooks
2. Encuentra tu webhook
3. Click en el ícono de basura (🗑️)
4. Confirma la eliminación

---

## ✅ Pruebas

### Prueba 1: Verificar que Jira está enviando webhooks (webhook.site)

**PRIMER PASO RECOMENDADO** - Confirma que Jira envía webhooks antes de debuggear tu servidor:

1. Ve a https://webhook.site
2. Copia tu URL única (ej., `https://webhook.site/01126c1c-31d3-4d87-89ce-a2c2215e5cb5`)
3. Actualiza tu webhook de Jira para apuntar a esa URL:
   ```bash
   WEBHOOK_ID="1"
   curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/${WEBHOOK_ID}" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
     -H "Content-Type: application/json" \
     -d "{
       \"name\": \"Test Webhook\",
       \"url\": \"https://webhook.site/tu-id-unico\",
       \"events\": [\"jira:issue_updated\"],
       \"excludeBody\": false,
       \"enabled\": true
     }"
   ```
4. Haz un cambio en Jira (actualiza cualquier issue)
5. **Refresca webhook.site** - deberías ver el payload completo inmediatamente
6. ✅ **Si funciona:** Jira está configurado correctamente, el problema es tu servidor
7. ❌ **Si no funciona:** El problema está en la configuración del webhook de Jira (verifica filtro JQL, eventos, estado habilitado)

**Este método funciona 100%** y es la forma más rápida de debuggear problemas de webhooks.

### Prueba 2: Health Check del Servidor

```bash
curl https://tu-servidor.com/health
```

**Respuesta esperada:**
```json
{"status":"ok","port":"10000"}
```

### Prueba 3: Disparador Manual de Webhook

Actualiza un issue vía UI de Jira o API:

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/api/3/issue/PROJ-123" \
  -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "summary": "Resumen actualizado para probar webhook"
    }
  }'
```

### Prueba 4: Verificar Webhooks Recibidos

```bash
curl https://tu-servidor.com/webhooks | jq .
```

**Respuesta esperada:**
```json
{
  "total": 1,
  "webhooks": [
    {
      "timestamp": "2026-02-04T12:00:00.000Z",
      "issueKey": "PROJ-123",
      "summary": "Resumen actualizado para probar webhook",
      "status": "In Progress",
      "changes": "summary: \"Título anterior\" → \"Resumen actualizado para probar webhook\""
    }
  ]
}
```

### Prueba 5: Enviar Payload de Prueba

```bash
curl -X POST https://tu-servidor.com/webhook \
  -H "Content-Type: application/json" \
  -H "User-Agent: Atlassian HttpClient" \
  -d '{
    "webhookEvent": "jira:issue_updated",
    "issue": {
      "key": "TEST-1",
      "fields": {
        "summary": "Issue de Prueba",
        "status": {"name": "Hecho"}
      }
    },
    "changelog": {
      "items": [{
        "field": "status",
        "fromString": "En Progreso",
        "toString": "Hecho"
      }]
    }
  }'
```

---

## 🐛 Resolución de Problemas

### Problema: El webhook no se dispara

**Síntoma:** Los cambios en Jira no disparan webhooks

**Soluciones:**

1. **Verificar que el webhook está habilitado:**
   ```bash
   curl -s "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq '.[] | {name, enabled, url}'
   ```

2. **Verificar filtro JQL:**
   - Los filtros son sensibles a mayúsculas/minúsculas
   - Prueba tu JQL en la búsqueda de issues de Jira primero
   - Elimina el filtro temporalmente para probar: actualiza el webhook sin el campo `filters`

3. **Verificar tipo de evento:**
   - Usa `"jira:issue_updated"` para la mayoría de cambios
   - Verifica que estás disparando el evento correcto (ej., editar vs crear)

4. **Probar con webhook.site (100% confiable):**
   - Actualiza la URL del webhook a `https://webhook.site/id-unico` (obtén la URL de https://webhook.site)
   - Haz un cambio en Jira
   - ✅ **Si llega a webhook.site:** Jira funciona correctamente, el problema es tu servidor
   - ❌ **Si no llega:** El problema está en la configuración del webhook de Jira (filtro JQL, eventos, o estado habilitado)

### Problema: El servidor no responde

**Síntoma:** Webhooks enviados por Jira pero el servidor no los recibe

**Soluciones:**

1. **Verificar que el servidor está corriendo:**
   ```bash
   curl https://tu-servidor.com/health
   ```

   Si retorna 404 o timeout, el servidor está caído.

2. **Para Render:** Verificar si el servidor está dormido
   - El tier gratuito se duerme después de 15 min de inactividad
   - Solución: Configura UptimeRobot (ver sección de Inicio Rápido)

3. **Verificar logs del servidor:**
   - Render: Dashboard → Servicio → pestaña Logs
   - Local: Verifica la salida del terminal

4. **Verificar que la URL es correcta:**
   - Debe incluir la ruta `/webhook`: `https://tu-servidor.com/webhook`
   - Debe ser `https://` no `http://`

### Problema: El webhook llega pero el payload está vacío

**Síntoma:** El servidor recibe peticiones pero sin datos

**Solución:**

Asegúrate de que `excludeBody` está en `false`:

```bash
curl -X PUT "https://${JIRA_DOMAIN}/rest/webhooks/1.0/webhook/1" \
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

### Problema: 401 Unauthorized al gestionar webhooks

**Síntoma:** La API retorna error 401

**Soluciones:**

1. **Verificar credenciales:**
   ```bash
   curl -s "https://${JIRA_DOMAIN}/rest/api/3/myself" \
     -u "${JIRA_EMAIL}:${JIRA_TOKEN}" | jq .
   ```

   Debería retornar tu información de usuario. Si no, regenera el token API.

2. **Verificar permisos:**
   - Los webhooks requieren permisos de administrador de Jira
   - Contacta a tu administrador de Jira si no tienes acceso

3. **Verificar token API:**
   - El token debe ser de: https://id.atlassian.com/manage-profile/security/api-tokens
   - El token debería empezar con `ATATT3x...`

### Problema: El filtro JQL no funciona

**Síntoma:** El webhook se dispara para issues incorrectos o no se dispara

**Soluciones:**

1. **Probar JQL en Jira:**
   - Ve a Issues → Buscar issues
   - Ingresa tu JQL
   - Verifica que retorna los resultados esperados

2. **Errores comunes en JQL:**
   - Sensibilidad a mayúsculas: `Status` vs `status`
   - Comillas: Usa `\"` en llamadas API
   - Espacios: `status changed` no `status  changed`

3. **Simplificar filtro:**
   - Comienza con: `project = MIPROYECTO`
   - Agrega condiciones incrementalmente
   - Prueba después de cada cambio

### Problema: Demasiados webhooks

**Síntoma:** El servidor recibe webhooks para eventos no deseados

**Soluciones:**

1. **Agregar filtro de proyecto:**
   ```json
   {
     "filters": {
       "issue-related-events-section": "project = MIPROYECTO"
     }
   }
   ```

2. **Filtrar solo cambios de estado:**
   ```json
   {
     "filters": {
       "issue-related-events-section": "project = MIPROYECTO AND status changed"
     }
   }
   ```

3. **Usar eventos específicos:**
   ```json
   {
     "events": ["jira:issue_updated"]
   }
   ```
   En lugar de múltiples tipos de eventos.

### Ejemplo de Payload de Webhook de Jira

Cuando Jira envía un webhook, esto es lo que tu servidor recibe:

```json
{
  "timestamp": 1770207360000,
  "webhookEvent": "jira:issue_updated",
  "issue_event_type_name": "issue_generic",
  "user": {
    "displayName": "Juan Perez",
    "accountId": "557058:f58131cb-b67d-43c7-b30d-6b58d40bd077",
    "emailAddress": "juan@example.com"
  },
  "issue": {
    "id": "10001",
    "key": "PROJ-123",
    "fields": {
      "summary": "Arreglar bug de login",
      "status": {
        "name": "En Progreso",
        "id": "3"
      },
      "assignee": {
        "displayName": "Maria Garcia",
        "emailAddress": "maria@example.com"
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
        "toString": "En Progreso"
      }
    ]
  }
}
```

---

## 📚 Recursos Adicionales

- [Documentación de API de Webhooks de Jira](https://developer.atlassian.com/cloud/jira/platform/webhooks/)
- [Documentación de API REST de Jira](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Guía de JQL (Jira Query Language)](https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-searching-in-jira-cloud/)
- [Documentación de Render](https://render.com/docs)
- [Documentación de UptimeRobot](https://uptimerobot.com/help)

---

## 📝 Script de Configuración Automatizado

El script `setup-jira-webhook.sh` automatiza la creación de webhooks:

```bash
#!/bin/bash
# Configurar variables
export JIRA_DOMAIN="tu-dominio.atlassian.net"
export JIRA_EMAIL="tu-email@dominio.com"
export JIRA_TOKEN="tu-token"
export WEBHOOK_URL="https://tu-servidor.com/webhook"
export PROJECT_KEY="MIPROYECTO"

# Ejecutar script
chmod +x setup-jira-webhook.sh
./setup-jira-webhook.sh
```

---

**Autor:** Juan Estrada (juan.estrada@itti.digital)
**Proyecto:** Jira Webhook POC
**Repositorio:** https://github.com/juan-estrada-itti/webhook_poc
**Fecha:** Febrero 2026
