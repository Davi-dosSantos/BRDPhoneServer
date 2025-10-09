import { Router, Request, Response } from 'express';
import { updateTokenInDB } from '../services/db.service';
import { RegisterTokenRequest } from './create.routes';

const router = Router();

router.post('/', async (req: RegisterTokenRequest, res: Response) => {
    const { userID_Domain, token, platform } = req.body; 
  
    if (!userID_Domain || !token || !platform) {
        return res.status(400).send({ error: "userID_Domain, Token FCM e platform (Android/IOS) são obrigatórios." });
    }
  
    try {
        await updateTokenInDB(userID_Domain, token, platform); 
        res.status(200).send({ success: true, message: `Token atualizado para ${userID_Domain} (DB).` });
    } catch (dbError) {
        console.error(`[ERRO DB] Falha ao atualizar o token para ${userID_Domain}:`, dbError);
        res.status(500).send({ error: "Falha interna ao atualizar o token no DB." });
    }
});

export default router;