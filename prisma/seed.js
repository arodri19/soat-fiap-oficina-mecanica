const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Verificar se o usuário padrão já existe
  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@oficina.com' }
  });

  if (existingUser) {
    console.log('Usuário padrão já existe.');
    return;
  }

  // Criar usuário padrão
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@oficina.com',
      password: hashedPassword,
      role: 'ATTENDANT'
    }
  });

  console.log('Usuário padrão criado com sucesso:', user);
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
