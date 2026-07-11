/**
 * Simulação de carga — Oficina Mecânica
 *
 * Uso: node scripts/load-simulation.js [--orders N] [--concurrency C] [--base-url URL]
 *
 * Padrões: 50 ordens, concorrência 10, http://localhost:4000
 */

const BASE_URL  = process.argv.find(a => a.startsWith('--base-url='))?.split('=')[1] || 'http://localhost:4000';
const N_ORDERS  = parseInt(process.argv.find(a => a.startsWith('--orders='))?.split('=')[1]  || '50');
const CONCUR    = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '10');

const COLORS = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', cyan:'\x1b[36m', bold:'\x1b[1m', dim:'\x1b[2m' };
const c = (color, text) => `${COLORS[color]}${text}${COLORS.reset}`;

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

function progressBar(done, total, width = 30) {
  const pct   = done / total;
  const filled = Math.round(pct * width);
  const bar   = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `[${bar}] ${done}/${total}`;
}

async function runBatch(tasks, concurrency) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  console.log(c('bold', '\n╔══════════════════════════════════════════════════╗'));
  console.log(c('bold', '║   SIMULAÇÃO DE CARGA — OFICINA MECÂNICA           ║'));
  console.log(c('bold', '╚══════════════════════════════════════════════════╝'));
  console.log(`${c('dim','  Alvo:')}     ${BASE_URL}`);
  console.log(`${c('dim','  Ordens:')}   ${N_ORDERS}`);
  console.log(`${c('dim','  Concurrent:')} ${CONCUR} workers\n`);

  // ── 1. Autenticação ───────────────────────────────────────────────────────
  process.stdout.write('  Autenticando...');
  const { status: loginStatus, data: loginData } = await api('POST', '/api/auth/login', {
    email: 'admin@oficina.com', password: 'Admin123!',
  });
  if (loginStatus !== 200 || !loginData.token) {
    console.log(c('red', ' FALHOU'));
    console.error('  Erro:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  console.log(c('green', ' OK'));

  // ── 2. Buscar dados base ──────────────────────────────────────────────────
  process.stdout.write('  Carregando dados base...');
  const [clientsRes, vehiclesRes, servicesRes, partsRes] = await Promise.all([
    api('GET', '/api/clients/pf', null, token),
    api('GET', '/api/vehicles',   null, token),
    api('GET', '/api/services',   null, token),
    api('GET', '/api/parts',      null, token),
  ]);

  const clients  = clientsRes.data.data  || clientsRes.data  || [];
  const vehicles = vehiclesRes.data.data || vehiclesRes.data || [];
  const services = servicesRes.data.data || servicesRes.data || [];
  const parts    = partsRes.data.data    || partsRes.data    || [];

  if (!clients.length || !vehicles.length || !services.length) {
    console.log(c('red', ' FALHOU — execute o seed primeiro'));
    process.exit(1);
  }
  console.log(c('green', ` OK`) + c('dim', ` (${clients.length} clientes, ${vehicles.length} veículos, ${services.length} serviços, ${parts.length} peças)`));

  // ── 3. Criar ordens concorrentemente ────────────────────────────────────
  console.log(`\n  ${c('cyan','Criando')} ${N_ORDERS} ordens com concorrência ${CONCUR}...\n`);

  const mechanics = ['Roberto Silva', 'Marcos Oliveira', 'Ana Técnica', 'Pedro Costa', 'Julia Mecânica'];
  const descriptions = [
    'Troca de óleo e filtro',
    'Revisão completa',
    'Alinhamento e balanceamento',
    'Troca de pastilhas de freio',
    'Diagnóstico eletrônico',
    'Troca de correia dentada',
    'Revisão pré-viagem',
    'Barulho na suspensão',
  ];

  const timings = [];
  let ok = 0, fail = 0, done = 0;

  const tasks = Array.from({ length: N_ORDERS }, (_, i) => async () => {
    const client  = clients[i  % clients.length];
    const vehicle = vehicles[i % vehicles.length];
    const service = services[i % services.length];
    const part    = parts[i    % parts.length];

    const t0 = Date.now();

    // Criar OS
    const createRes = await api('POST', '/api/orders', {
      clientPFId:   client.id,
      vehicleId:    vehicle.id,
      description:  descriptions[i % descriptions.length],
      mechanicName: mechanics[i % mechanics.length],
    }, token);

    if (createRes.status !== 201) {
      done++;
      process.stdout.write(`\r  ${progressBar(done, N_ORDERS)}  ${c('green', ok+'✓')} ${c('red', (fail+1)+'✗')}`);
      fail++;
      timings.push({ ok: false, ms: Date.now() - t0 });
      return;
    }

    const orderId = createRes.data.id;

    // Adicionar serviço à OS
    await api('POST', `/api/orders/${orderId}/services`, { serviceId: service.id }, token);

    // Adicionar peça ao serviço (se houver)
    if (createRes.data.services?.[0]) {
      const osServiceId = createRes.data.services[0].id;
      await api('POST', `/api/orders/${orderId}/services/${osServiceId}/parts`, {
        partId: part.id, quantity: 1,
      }, token);
    }

    const ms = Date.now() - t0;
    timings.push({ ok: true, ms });
    ok++;
    done++;
    process.stdout.write(`\r  ${progressBar(done, N_ORDERS)}  ${c('green', ok+'✓')} ${c('red', fail+'✗')}`);
  });

  const start = Date.now();
  await runBatch(tasks, CONCUR);
  const totalMs = Date.now() - start;

  // ── 4. Relatório ──────────────────────────────────────────────────────────
  const okTimings  = timings.filter(t => t.ok).map(t => t.ms).sort((a,b) => a-b);
  const avg        = okTimings.length ? Math.round(okTimings.reduce((a,b)=>a+b,0) / okTimings.length) : 0;
  const p50        = okTimings[Math.floor(okTimings.length * 0.50)] || 0;
  const p95        = okTimings[Math.floor(okTimings.length * 0.95)] || 0;
  const p99        = okTimings[Math.floor(okTimings.length * 0.99)] || 0;
  const throughput = (ok / (totalMs / 1000)).toFixed(1);

  console.log('\n\n' + c('bold', '  ┌─────────────────────────────────────────────┐'));
  console.log(         c('bold', '  │           RESULTADOS DA SIMULAÇÃO           │'));
  console.log(         c('bold', '  └─────────────────────────────────────────────┘'));
  console.log(`\n  ${c('bold','Ordens processadas')}`);
  console.log(`    Criadas com sucesso : ${c('green', ok.toString().padStart(4))}`);
  console.log(`    Falhas              : ${fail > 0 ? c('red', fail.toString().padStart(4)) : c('dim', '   0')}`);
  console.log(`    Taxa de sucesso     : ${c(ok/N_ORDERS >= 0.95 ? 'green':'red', ((ok/N_ORDERS)*100).toFixed(1)+'%')}`);

  console.log(`\n  ${c('bold','Latência por requisição (criar OS + serviço + peça)')}`);
  console.log(`    Média : ${c('cyan', avg+'ms')}`);
  console.log(`    p50   : ${p50}ms`);
  console.log(`    p95   : ${p95}ms`);
  console.log(`    p99   : ${p99}ms`);

  console.log(`\n  ${c('bold','Throughput')}`);
  console.log(`    Tempo total         : ${(totalMs/1000).toFixed(2)}s`);
  console.log(`    Ordens por segundo  : ${c('cyan', throughput+' OS/s')}`);
  console.log(`    Workers simultâneos : ${CONCUR}`);

  // ── 5. Buscar métricas da API ─────────────────────────────────────────────
  const metricsRes = await api('GET', '/api/metrics', null, token);
  if (metricsRes.status === 200) {
    const m = metricsRes.data;
    console.log(`\n  ${c('bold','Métricas da API após simulação')}`);
    if (m.totalOrders      != null) console.log(`    Total de ordens    : ${c('cyan', m.totalOrders)}`);
    if (m.averageTime      != null) console.log(`    Tempo médio (min)  : ${m.averageTime}`);
    if (m.totalRevenue     != null) console.log(`    Receita total      : R$ ${Number(m.totalRevenue||0).toFixed(2)}`);
  }

  console.log('\n' + c('dim', '  Dica: rode com --orders=100 --concurrency=20 para estressar mais.\n'));
}

main().catch(e => { console.error(c('red', '\nErro fatal: ' + e.message)); process.exit(1); });
