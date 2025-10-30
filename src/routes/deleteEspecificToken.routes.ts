import { Router, Request, Response } from 'express';
import { deleteEspecificToken } from '../services/db.service';
import { Platform } from '@prisma/client';
import { getCurrentTimestamp } from '../utils/date';

const router = Router();

export interface DeleteEspecificTokenRequest extends Request {
  body: {
    userID_Domain: string;
    platform: Platform;
  };
}

router.delete('/', async (req: DeleteEspecificTokenRequest, res: Response) => {
    const timeStamp = getCurrentTimestamp();
    const { userID_Domain } = req.body; 
    const { platform } = req.body;
  
     if (!platform) {
        return res.status(400).send({ error: "Platform é obrigatório." });
    }
  
     if (!['Android', 'IOS', 'Extension'].includes(platform)) {
        return res.status(400).send({ error: "Platform inválida. Valores aceitos: Android, IOS, Extension." });
    }
  
    if (!userID_Domain) {
        return res.status(400).send({ error: "userID_Domain obrigatórios." });
    }
  
    try {
        await deleteEspecificToken(userID_Domain, platform); 
        res.status(200).send({ success: true, message: `${timeStamp} Dispositivo ${platform} de ${userID_Domain} deletado com sucesso (DB).` });
    } catch (dbError) {
        console.error(`${timeStamp} [ERRO DB] Falha ao deletar dispositivo ${platform} de ${userID_Domain}:`, dbError);
        res.status(500).send({ error: "Falha interna ao deletar no DB." });
    }
});

export default router;