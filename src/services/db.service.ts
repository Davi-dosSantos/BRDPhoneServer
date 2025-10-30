import { PrismaClient, Platform } from '@prisma/client';
import { getCurrentTimestamp } from '../utils/date';

const prisma = new PrismaClient();

export interface FCMToken {
    userID_Domain: string;
    token: string;
    platform: Platform;
    isActive: boolean;
    updatedAt: Date;
}

const timeStamp = getCurrentTimestamp();

export async function upsertTokenInDB(userID_Domain: string, token: string, platform: Platform): Promise<void> {
    try {
        await prisma.fcmToken.upsert({
            where: {
                userID_Domain_platform: {
                    userID_Domain: userID_Domain,
                    platform: platform,
                },
            },
            update: {
                token: token,
                isActive: true,
            },
            create: {
                userID_Domain: userID_Domain,
                token: token,
                platform: platform,
                isActive: true, 
            },
        });
        console.log(`${timeStamp} [PRISMA SUCESSO] Token para ${userID_Domain}/${platform} upserted.`);
    } catch (error) {
        console.error(`${timeStamp} [PRISMA ERRO] Falha ao upsert token para ${userID_Domain}:`, error);
        throw new Error("Falha ao persistir o token no DB.");
    }
}

export async function getActiveTokensFromDB(userID_Domain: string): Promise<FCMToken[]> {
    
    try {
        const records = await prisma.fcmToken.findMany({
            where: {
                userID_Domain: userID_Domain,
                isActive: true, 
            },
        });
        return records as unknown as FCMToken[];
    } catch (error) {
        console.error(`${timeStamp} [PRISMA ERRO] Falha ao buscar tokens ativos para ${userID_Domain}:`, error);
        throw new Error("Falha ao buscar tokens ativos no DB.");
    }
}



export async function checkUserTokensExist(userID_Domain: string): Promise<boolean> {
    try {
        const count = await prisma.fcmToken.count({
            where: { userID_Domain: userID_Domain },
        });
        return count > 0;
    } catch (error) {
        console.error(`${timeStamp} [PRISMA ERRO] Falha ao verificar existência para ${userID_Domain}:`, error);
        throw new Error("Falha ao verificar a existência do usuário no DB.");
    }
}

//export async function deactivateTokenInDB(token: string): Promise<void> {
//    try {
//       await prisma.fcmToken.update({
//            where: {
//                    token: token,
//            },
//            data: {
//                isActive: false, 
//            },
//        });
//        console.warn(`[PRISMA SUCESSO] Tokens desativado com sucesso.`);
//    } catch (error) {
//       console.error(`[PRISMA ERRO] Falha ao desativar token ${token}:`, error);
//        throw new Error("Falha ao desativar o token no DB.");
//    }
//}

export async function deleteTokensForUser(userID_Domain: string): Promise<void> {
    try {
        await prisma.fcmToken.deleteMany({
            where: { userID_Domain: userID_Domain },
        });
        console.warn(`${timeStamp} [PRISMA SUCESSO] Todos os tokens para ${userID_Domain} removidos.`);
    } catch (error) {
        console.error(`${timeStamp} [PRISMA ERRO] Falha ao remover tokens para ${userID_Domain}:`, error);
        throw new Error("Falha ao remover tokens do user do DB.");
    }
}
export async function deleteEspecificToken(userID_Domain: string, platform: Platform): Promise<void> {
    try {
        await prisma.fcmToken.deleteMany({
            where: { userID_Domain: userID_Domain,
                     platform: platform },
        });
        console.warn(`${timeStamp} [PRISMA SUCESSO] O token para ${userID_Domain} na plataforma ${platform} foi removido.`);
    } catch (error) {
        console.error(`${timeStamp} [PRISMA ERRO] Falha ao remover token para ${userID_Domain} na plataforma ${platform}:`, error);
        throw new Error("Falha ao remover token especifico do user do DB.");
    }
}

