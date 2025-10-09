import { Router, Request, Response } from 'express';
import { createTokenInDB } from '../services/db.service';

const router = Router();

export interface RegisterTokenRequest extends Request {
  body: {
    userID_Domain: string;
    token: string;
    platform: 'Android' | 'IOS';
  };
}

router.post('/', async (req: RegisterTokenRequest, res: Response) => {
    const { userID_Domain, token, platform } = req.body; 
  
    if (!userID_Domain || !token || !platform) {
        return res.status(400).send({ error: "userID_Domain, Token FCM e platform (Android/IOS) são obrigatórios." });
    }
  
    try {
        await createTokenInDB(userID_Domain, token, platform); 
        res.status(200).send({ success: true, message: `Token registrado para ${userID_Domain} (DB).` });
    } catch (dbError) {
        console.error(`[ERRO DB] Falha ao criar o token para ${userID_Domain}:`, dbError);
        res.status(500).send({ error: "Falha interna ao criar o token no DB." });
    }
});

export default router;