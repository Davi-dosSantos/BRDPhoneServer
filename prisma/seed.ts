// prisma/seed.ts

import { PrismaClient, Platform } from '@prisma/client';

const prisma = new PrismaClient();

// Dados de exemplo para popular a tabela FCMToken
const fcmTokens = [
  {
    userId: 'user-001@seu-dominio.com',
    token: 'token_android_do_user_001_12345abc',
    platform: Platform.Android,
    isActive: true,
    lastUsed: new Date(),
  },
  {
    userId: 'user-001@seu-dominio.com',
    token: 'token_chrome_extension_do_user_001_xyz987',
    platform: Platform.Extension,
    isActive: true,
    lastUsed: new Date(),
  },
  {
    userId: 'user-002@seu-dominio.com',
    token: 'token_ios_do_user_002_a1b2c3d4e5f6',
    platform: Platform.IOS,
    isActive: true,
    lastUsed: new Date(),
  },
  {
    userId: 'user-003@seu-dominio.com',
    token: 'token_inativo_do_user_003_DEADBEEF',
    platform: Platform.Android,
    // Token de exemplo que está inativo para testes
    isActive: false, 
    lastUsed: new Date(Date.now() - 3600000 * 24 * 7), // Ex: Usado há 7 dias
  },
];

async function main() {
  console.log(`Iniciando o seeding...`);

  // Opcional: Limpar dados existentes antes de popular (útil para desenvolvimento)
  // await prisma.fCMToken.deleteMany();
  // console.log('Tabela FCMToken limpa.');


  for (const data of fcmTokens) {
    // Usar upsert é uma boa prática para evitar duplicatas se você rodar o seed múltiplas vezes
    const token = await prisma.fcmToken.upsert({
      where: { 
          // Supondo que você tem um @unique nos campos token ou [userId, token]
          token: data.token 
      },
      update: {
          isActive: data.isActive,
          lastUsed: data.lastUsed,
      },
      create: data,
    });
    console.log(`Token FCM criado/atualizado com ID: ${token.id} para User: ${token.userId} (${token.platform})`);
  }

  console.log(`Seeding finalizado com sucesso. ${fcmTokens.length} registros processados.`);
}

// Chamar a função main
main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });