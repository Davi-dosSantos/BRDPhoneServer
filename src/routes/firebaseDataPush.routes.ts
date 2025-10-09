import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { getTokenFromDB } from '../services/db.service';

const router = Router();

interface NotifyCallRequest extends Request {
  body: {
    userID_destino: string;
    userID_origem: string;
  };
}

router.post('/', async (req: NotifyCallRequest, res: Response) => {

    const { userID_destino, userID_origem } = req.body; 

    if (!userID_destino || !userID_origem) {
        return res.status(400).send({ error: "userID_destino e userID_origem são obrigatórios." });
    }
    if (userID_destino === userID_origem) {
        return res.status(400).send({ error: "userID_destino e userID_origem não podem ser iguais." });
    }
    let recipient;
    try {
        recipient = await getTokenFromDB(userID_destino);
    } catch (dbError) {
        return res.status(500).send({ error: "Falha interna ao buscar o token." });
    }

    if (!recipient) {
        console.warn(`[AVISO] Token para ${userID_destino} não encontrado no DB. Push ignorado.`);
        return res.status(404).send({ error: "Token FCM para o UserID de destino não encontrado no DB." });
    }
    
    const { token, platform } = recipient;


    let message: admin.messaging.Message = {
        token: token
    };
    
    
    if (platform === 'Android') {
        message.android = {
            directBootOk: true,
            priority: 'high',
            ttl: 25000 
        };
    } else if (platform === 'IOS') {
        message.apns = {
            headers: {
                'apns-priority': '10', 
                'apns-expiration': (Date.now() / 1000 + 25).toString(), 
            },
            payload: {
                aps: {
                    contentAvailable: true 
                }
            }
        };
    }

    try {
        const response = await admin.messaging().send(message);
        console.log(`[PUSH SUCESSO] Notificação (${platform}) enviada para ${userID_destino}. ID Firebase: ${response}`);
        res.status(200).send({ success: true, message: "Notificação FCM enviada com sucesso." });
        console.log(message);
    } catch (error: unknown) {
        const firebaseError = error as { code?: string };

        console.error(`[ERRO FCM] Falha ao enviar para ${userID_destino}:`, firebaseError.code);

        res.status(500).send({ error: `Falha no envio do FCM: ${firebaseError.code}` });
    }
});

export default router;