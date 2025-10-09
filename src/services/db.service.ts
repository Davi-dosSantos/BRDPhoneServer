import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FcmRecipient {
    userID_Domain: string;
    token: string;
    platform: 'Android' | 'IOS';
}
export async function createTokenInDB(userID_Domain: string, token: string, platform: 'Android' | 'IOS'): Promise<void> {

    try {
        await prisma.fcmToken.create({
            data: {
                userID_Domain: userID_Domain,
                token: token,
                platform: platform
            }
        });
        console.log(`[PRISMA SUCESSO] Token para ${userID_Domain} criado.`);
    } catch (error) {
        console.error(`[PRISMA ERRO] Falha ao criar token para ${userID_Domain}:`, error);
        throw new Error("Falha ao persistir o token no DB.");
    }
}


export async function upsertTokenInDB(userID_Domain: string, token: string, platform: 'Android' | 'IOS'): Promise<void> {
    try {
        await prisma.fcmToken.upsert({
            where: { userID_Domain: userID_Domain },
            update: { token: token, platform: platform },
            create: { userID_Domain: userID_Domain, token: token, platform: platform },
        });
        console.log(`[PRISMA SUCESSO] Token para ${userID_Domain} upserted.`);
    } catch (error) {
        console.error(`[PRISMA ERRO] Falha ao upsert token para ${userID_Domain}:`, error);
        throw new Error("Falha ao persistir o token no DB.");
    }
}

export async function getTokenFromDB(userID_Domain: string): Promise<FcmRecipient | undefined> {
    try {
        const record = await prisma.fcmToken.findUnique({
            where: { userID_Domain: userID_Domain },
            select: { token: true, platform: true }
        });
        
        if (record && record.token && record.platform) {
             return {
                userID_Domain: userID_Domain,
                token: record.token,
                platform: record.platform as 'Android' | 'IOS'
             };
        }
        return undefined;
    } catch (error) {
        console.error(`[PRISMA ERRO] Falha ao buscar token para ${userID_Domain}:`, error);
        throw new Error("Falha ao buscar o token no DB.");
    }
}

export async function checkUserExistsInDB(userID_Domain: string): Promise<boolean> {
    try {
        const record = await prisma.fcmToken.findUnique({
            where: { userID_Domain: userID_Domain },
            select: { userID_Domain: true }
        });
        
        return record !== null;
    } catch (error) {
        console.error(`[PRISMA ERRO] Falha ao verificar existência para ${userID_Domain}:`, error);
        throw new Error("Falha ao verificar a existência do usuário no DB.");
    }
}


// export async function deleteTokenFromDB(userID_Domain: string): Promise<void> {
//     try {
//         await prisma.fcmToken.delete({
//             where: { userID_Domain: userID_Domain },
//         });
//         console.warn(`[PRISMA SUCESSO] Token inválido para ${userID_Domain} removido do DB.`);
//     } catch (error) {
//         console.error(`[PRISMA ERRO] Falha ao remover token para ${userID_Domain}:`, error);
//         throw new Error("Falha ao remover o token do DB.");
//     }
// }