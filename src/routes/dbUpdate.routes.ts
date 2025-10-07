import { Router, Request, Response } from 'express';
import { updateTokenInDB } from '../services/db.service';

const router = Router();

interface RegisterTokenRequest extends Request {
  body: {
    usuarioID: string;
    token: string;
    type: 'Android' | 'IOS';
  };
}

router.post('/', async (req: RegisterTokenRequest, res: Response) => {
    const { usuarioID, token, type } = req.body; 
  
    if (!usuarioID || !token || !type) {
        return res.status(400).send({ error: "usuarioID, Token FCM e Type (Android/IOS) são obrigatórios." });
    }
  
    try {
        await updateTokenInDB(usuarioID, token, type); 
        res.status(200).send({ success: true, message: `Token atualizado/registrado para ${usuarioID} (DB).` });
    } catch (dbError) {
        console.error(`[ERRO DB] Falha ao atualizar o token para ${usuarioID}:`, dbError);
        res.status(500).send({ error: "Falha interna ao atualizar o token no DB." });
    }
});

export default router;