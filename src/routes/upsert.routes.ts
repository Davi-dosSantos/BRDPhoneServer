import { Router, Request, Response } from 'express';
import { upsertTokenInDB } from '../services/db.service';
import { Platform } from '@prisma/client';
import { getCurrentTimestamp } from '../utils/date';

interface RegisterTokenRequest extends Request {
  body: {
    userID_Domain: string;
    token: string;
    platform: Platform;
    updatedAt: Date;
    isActive: boolean;
  };
}

const router = Router();

router.post('/', async (req: RegisterTokenRequest, res: Response) => {
    const timeStamp = getCurrentTimestamp();
    const { userID_Domain, token, platform } = req.body; 
  
    if (!userID_Domain || !token || !platform) {
        return res.status(400).send({ error: "userID_Domain, Token FCM e platform (Android/IOS) são obrigatórios." });
    }else if (!Object.values(Platform).includes(platform)) {
        return res.status(400).send({ error: "Platform inválida. Valores aceitos: Android, IOS, Extension." });
    }
  
    try {
        await upsertTokenInDB(userID_Domain, token, platform); 
        res.status(200).send({ success: true, message: `${timeStamp} Token atualizado para ${userID_Domain} (DB).` });
    } catch (dbError) {
        console.error(`${timeStamp} [ERRO DB] Falha ao atualizar o token para ${userID_Domain}:`, dbError);
        res.status(500).send({ error: "Falha interna ao atualizar o token no DB." });
    }
});

export default router;