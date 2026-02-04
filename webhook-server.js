const http = require('http');

const PORT = process.env.PORT || 3000;

// Almacenar últimos 10 webhooks en memoria
const recentWebhooks = [];
const MAX_WEBHOOKS = 10;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      console.log('\n' + '='.repeat(80));
      console.log('📨 WEBHOOK RECIBIDO - ' + new Date().toISOString());
      console.log('='.repeat(80));

      try {
        const payload = JSON.parse(body);

        // Guardar webhook en memoria
        const webhookData = {
          timestamp: new Date().toISOString(),
          issueKey: payload.issue?.key || 'N/A',
          summary: payload.issue?.fields?.summary || 'N/A',
          status: payload.issue?.fields?.status?.name || 'N/A',
          changes: payload.changelog?.items || [],
          payload: payload
        };

        recentWebhooks.unshift(webhookData);
        if (recentWebhooks.length > MAX_WEBHOOKS) {
          recentWebhooks.pop();
        }

        // Extraer información relevante del webhook de Jira
        if (payload.issue) {
          console.log('\n🎫 ISSUE:', payload.issue.key);
          console.log('📝 Summary:', payload.issue.fields?.summary || 'N/A');
          console.log('📊 Status:', payload.issue.fields?.status?.name || 'N/A');

          if (payload.changelog?.items) {
            console.log('\n🔄 CAMBIOS:');
            payload.changelog.items.forEach(change => {
              console.log(`   ${change.field}: "${change.fromString}" → "${change.toString}"`);
            });
          }
        }

        console.log('\n📦 PAYLOAD COMPLETO:');
        console.log(JSON.stringify(payload, null, 2));

      } catch (e) {
        console.log('📦 RAW BODY:', body);
      }

      console.log('='.repeat(80) + '\n');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'received', timestamp: new Date().toISOString() }));
    });

  } else if (req.method === 'GET' && req.url === '/health') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT }));

  } else if (req.method === 'GET' && req.url === '/webhooks') {
    // Endpoint para consultar webhooks recibidos
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      total: recentWebhooks.length,
      webhooks: recentWebhooks.map(w => ({
        timestamp: w.timestamp,
        issueKey: w.issueKey,
        summary: w.summary,
        status: w.status,
        changes: w.changes.map(c => `${c.field}: "${c.fromString}" → "${c.toString}"`).join(', ')
      }))
    }, null, 2));

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log('🚀 Servidor de webhooks iniciado en http://localhost:' + PORT);
  console.log('📍 Endpoint de webhooks: http://localhost:' + PORT + '/webhook');
  console.log('💚 Health check: http://localhost:' + PORT + '/health');
  console.log('📋 Ver webhooks recibidos: http://localhost:' + PORT + '/webhooks');
  console.log('\n⏳ Esperando webhooks de Jira...\n');
});

// Manejo de errores
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${PORT} ya está en uso.`);
    console.error('   Intenta detener el proceso que lo está usando o cambia el puerto.');
  } else {
    console.error('❌ Error del servidor:', err);
  }
  process.exit(1);
});
