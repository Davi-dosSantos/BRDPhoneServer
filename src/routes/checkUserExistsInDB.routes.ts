import { Router, Request, Response } from 'express';
import { checkUserExistsInDB } from '../services/db.service';
const router = Router();

interface CheckUserRequest extends Request {
  body: {
    userID_Domain: string;
  };
}

router.post('/', async (req: CheckUserRequest, res: Response) => {
    const { userID_Domain } = req.body; 

    if (!userID_Domain) {
        return res.status(400).send({ error: "userID_Domain é obrigatório." });
    }

    try {
        const exists = await checkUserExistsInDB(userID_Domain);
        if (exists) {
            return res.status(200).send({ exists: true, message: `Usuário ${userID_Domain} existe no DB.` });
        } else {
            return res.status(404).send({ exists: false, message: `Usuário ${userID_Domain} não encontrado no DB.` });
        }
    } catch (dbError) {
        console.error(`[ERRO DB] Falha ao verificar o usuário ${userID_Domain}:`, dbError);
        return res.status(500).send({ error: "Falha interna ao verificar o usuário no DB." });
    }
});



export default router;