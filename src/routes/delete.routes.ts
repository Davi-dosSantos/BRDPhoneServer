import { Router, Request, Response } from 'express';
import { deleteTokensForUser } from '../services/db.service';
import { getCurrentTimestamp } from '../utils/date';

const router = Router();
const timeStamp = getCurrentTimestamp();

export interface DeleteTokenRequest extends Request {
  body: {
    userID_Domain: string;
  };
}

router.delete('/', async (req: DeleteTokenRequest, res: Response) => {
    const { userID_Domain } = req.body; 
  
    if (!userID_Domain) {
        return res.status(400).send({ error: "userID_Domain obrigatórios." });
    }
  
    try {
        await deleteTokensForUser(userID_Domain); 
        res.status(200).send({ success: true, message: `${timeStamp} User ${userID_Domain} deletado com sucesso (DB).` });
    } catch (dbError) {
        console.error(`${timeStamp} [ERRO DB] Falha ao deletar ${userID_Domain}:`, dbError);
        res.status(500).send({ error: "Falha interna ao deletar no DB." });
    }
});

export default router;