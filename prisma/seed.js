const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function clearDatabase() {
  // Limpar tabelas para evitar duplicidade (ordem importa por causa das foreign keys)
  await prisma.orderServiceServicePart.deleteMany();
  await prisma.orderServiceService.deleteMany();
  await prisma.orderService.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.clientPF.deleteMany();
  await prisma.part.deleteMany();
  await prisma.service.deleteMany();
}

async function seedAdminUser() {
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@oficina.com' }
  });

  if (existingUser === null) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@oficina.com',
        password: hashedPassword,
        role: 'ATTENDANT'
      }
    });
    console.log('Usuário padrão criado com sucesso:', user.email);
  } else {
    console.log('Usuário padrão já existe.');
  }
}

async function seedServices() {
  const servico1 = await prisma.service.create({
    data: { name: 'Troca de Óleo', slaMinutes: 60 }
  });
  const servico2 = await prisma.service.create({
    data: { name: 'Alinhamento e Balanceamento', slaMinutes: 120 }
  });
  const servico3 = await prisma.service.create({
    data: { name: 'Revisão Completa', slaMinutes: 240 }
  });
  console.log('3 Serviços criados.');
  return { servico1, servico2, servico3 };
}

async function seedParts() {
  const peca1 = await prisma.part.create({
    data: { name: 'Óleo de Motor 5W40', type: 'Óleo', model: 'Sintético', color: 'N/A', quantity: 50 }
  });
  const peca2 = await prisma.part.create({
    data: { name: 'Filtro de Óleo', type: 'Filtro', model: 'Padrão', color: 'N/A', quantity: 30 }
  });
  const peca3 = await prisma.part.create({
    data: { name: 'Pastilha de Freio', type: 'Freio', model: 'Cerâmica', color: 'N/A', quantity: 20 }
  });
  console.log('3 Peças criadas.');
  return { peca1, peca2, peca3 };
}

async function seedClients() {
  const cliente1 = await prisma.clientPF.create({
    data: { name: 'João Silva', cpf: '111.222.333-44', email: 'joao@example.com', address: 'Rua A', number: '123', state: 'SP', cep: '01000-000' }
  });
  const cliente2 = await prisma.clientPF.create({
    data: { name: 'Maria Oliveira', cpf: '555.666.777-88', email: 'maria@example.com', address: 'Rua B', number: '456', state: 'RJ', cep: '20000-000' }
  });
  const cliente3 = await prisma.clientPF.create({
    data: { name: 'Carlos Souza', cpf: '999.888.777-66', email: 'carlos@example.com', address: 'Rua C', number: '789', state: 'MG', cep: '30000-000' }
  });
  console.log('3 Clientes PF criados.');
  return { cliente1, cliente2, cliente3 };
}

async function seedVehicles(clientes) {
  const veiculo1 = await prisma.vehicle.create({
    data: { plate: 'ABC-1234', model: 'Honda Civic', year: 2020, color: 'Prata', clientPFId: clientes.cliente1.id }
  });
  const veiculo2 = await prisma.vehicle.create({
    data: { plate: 'DEF-5678', model: 'Toyota Corolla', year: 2021, color: 'Preto', clientPFId: clientes.cliente2.id }
  });
  const veiculo3 = await prisma.vehicle.create({
    data: { plate: 'GHI-9012', model: 'VW Nivus', year: 2022, color: 'Branco', clientPFId: clientes.cliente3.id }
  });
  console.log('3 Veículos criados.');
  return { veiculo1, veiculo2, veiculo3 };
}

async function seedBudgetsAndOrders(clientes, veiculos, servicos, pecas) {
  for (let i = 1; i <= 3; i++) {
    const budget = await prisma.budget.create({
      data: {
        totalBudget: 1000 * i,
        createdAt: new Date(`2023-10-0${i}T09:00:00Z`)
      }
    });

    let currentClientPFId;
    let currentVehicleId;

    if (i === 1) {
      currentClientPFId = clientes.cliente1.id;
      currentVehicleId = veiculos.veiculo1.id;
    } else if (i === 2) {
      currentClientPFId = clientes.cliente2.id;
      currentVehicleId = veiculos.veiculo2.id;
    } else {
      currentClientPFId = clientes.cliente3.id;
      currentVehicleId = veiculos.veiculo3.id;
    }

    for (let j = 1; j <= 5; j++) {
      // Dia aleatório entre 4 e 28 (para garantir que seja após a criação do orçamento)
      const randomDay = crypto.randomInt(4, 29);
      // Hora aleatória entre 8 e 17
      const randomHour = crypto.randomInt(8, 18);
      // Minuto aleatório entre 0 e 59
      const randomMinute = crypto.randomInt(0, 60);

      const startAt = new Date(`2023-10-${randomDay.toString().padStart(2, '0')}T${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:00Z`);

      // Duração aleatória (entre 1 hora e 24 horas)
      const durationHours = crypto.randomInt(1, 25);
      const endAt = new Date(startAt.getTime() + (durationHours * 60 * 60 * 1000));

      await prisma.orderService.create({
        data: {
          status: 'FINALIZADA',
          description: `Serviço de manutenção ${i}.${j}`,
          mechanicName: j % 2 === 0 ? 'Roberto Mecânico' : 'Marcos Silva',
          budgetValue: 200 * j,
          startAt: startAt,
          endAt: endAt,
          clientPFId: currentClientPFId,
          vehicleId: currentVehicleId,
          budgetId: budget.id,
          services: {
            create: [
              {
                serviceId: j % 2 === 0 ? servicos.servico1.id : servicos.servico2.id,
                parts: {
                  create: [
                    { partId: pecas.peca1.id, quantity: 1 }
                  ]
                }
              }
            ]
          }
        }
      });
    }
  }
  console.log('3 Orçamentos e 15 Ordens de Serviço (5 para cada orçamento) criados e finalizados.');
}

async function main() {
  console.log('Iniciando seed do banco de dados...');

  await clearDatabase();
  await seedAdminUser();
  const servicos = await seedServices();
  const pecas = await seedParts();
  const clientes = await seedClients();
  const veiculos = await seedVehicles(clientes);
  await seedBudgetsAndOrders(clientes, veiculos, servicos, pecas);

  console.log('Seed do banco de dados concluído com sucesso!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
