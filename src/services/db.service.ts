import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FcmRecipient {
  token: string;
  type: 'Android' | 'IOS';
}

export async function updateTokenInDB(usuarioID: string, token: string, type: 'Android' | 'IOS'): Promise<void> {
    try {
        await prisma.fcmToken.upsert({
            where: { usuarioID: usuarioID },
            update: { token: token, type: type },
            create: { usuarioID: usuarioID, token: token, type: type },
        });
        console.log(`[PRISMA SUCESSO] Token para ${usuarioID} upserted.`);
    } catch (error) {
        console.error(`[PRISMA ERRO] Falha ao upsert token para ${usuarioID}:`, error);
        throw new Error("Falha ao persistir o token no DB.");
    }
}

export async function getTokenFromDB(usuarioID: string): Promise<FcmRecipient | undefined> {
    try {
        const record = await prisma.fcmToken.findUnique({
            where: { usuarioID: usuarioID },
            select: { token: true, type: true }
        });
        
        if (record && record.token && record.type) {
             return {
                 token: record.token,
                 type: record.type as 'Android' | 'IOS'
             };
        }
        return undefined;
    } catch (error) {
        console.error(`[PRISMA ERRO] Falha ao buscar token para ${usuarioID}:`, error);
        throw new Error("Falha ao buscar o token no DB.");
    }
}


export async function deleteTokenFromDB(usuarioID: string): Promise<void> {
    try {
        await prisma.fcmToken.delete({
            where: { usuarioID: usuarioID },
        });
        console.warn(`[PRISMA SUCESSO] Token inválido para ${usuarioID} removido do DB.`);
    } catch (error) {
        console.error(`[PRISMA ERRO] Falha ao remover token para ${usuarioID}:`, error);
        throw new Error("Falha ao remover o token do DB.");
    }
}