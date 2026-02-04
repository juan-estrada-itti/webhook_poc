const http = require('http');

const PORT = process.env.PORT || 3000;

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

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log('🚀 Servidor de webhooks iniciado en http://localhost:' + PORT);
  console.log('📍 Endpoint de webhooks: http://localhost:' + PORT + '/webhook');
  console.log('💚 Health check: http://localhost:' + PORT + '/health');
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
