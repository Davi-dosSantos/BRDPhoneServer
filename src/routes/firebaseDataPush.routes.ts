import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { getTokenFromDB, deleteTokenFromDB } from '../services/db.service';

const router = Router();

interface NotifyCallRequest extends Request {
  body: {
    usuarioID_destino: string;
    usuarioID_origem: string;
    caller_name?: string;
  };
}

router.post('/', async (req: NotifyCallRequest, res: Response) => {

    const { usuarioID_destino, usuarioID_origem, caller_name } = req.body; 

    if (!usuarioID_destino || !usuarioID_origem) {
        return res.status(400).send({ error: "usuarioID_destino e usuarioID_origem são obrigatórios." });
    }

    let recipient;
    try {
        recipient = await getTokenFromDB(usuarioID_destino);
    } catch (dbError) {
        return res.status(500).send({ error: "Falha interna ao buscar o token." });
    }

    if (!recipient) {
        console.warn(`[AVISO] Token para ${usuarioID_destino} não encontrado no DB. Push ignorado.`);
        return res.status(404).send({ error: "Token FCM para o UsuarioID de destino não encontrado no DB." });
    }
    
    const { token, type } = recipient;

    
    const dataPayload = {
        type: 'INCOMING_CALL',
        caller_id: usuarioID_origem, 
        caller_name: caller_name || `Usuário ${usuarioID_origem}`,
        call_id: `call_${Date.now()}` 
    };

    let message: admin.messaging.Message = {
        token: token,
        data: dataPayload,
    };
    
    
    if (type === 'Android') {
        message.android = {
            priority: 'high',
            ttl: 25000 
        };
    } else if (type === 'IOS') {
        // message.apns = {
        //     headers: {
        //         'apns-priority': '10', 
        //         'apns-expiration': (Date.now() / 1000 + 25).toString(), 
        //     },
        //     payload: {
        //         aps: {
        //             contentAvailable: true 
        //         }
        //     }
        // };
    }

    try {
        const response = await admin.messaging().send(message);
        console.log(`[PUSH SUCESSO] Notificação (${type}) enviada para ${usuarioID_destino}. ID Firebase: ${response}`);
        res.status(200).send({ success: true, message: "Notificação FCM enviada com sucesso." });
    } catch (error: unknown) {
        const firebaseError = error as { code?: string };

        console.error(`[ERRO FCM] Falha ao enviar para ${usuarioID_destino}:`, firebaseError.code);

        if (firebaseError.code === 'messaging/invalid-argument' || firebaseError.code === 'messaging/unregistered') {
            await deleteTokenFromDB(usuarioID_destino); 
        }

        res.status(500).send({ error: `Falha no envio do FCM: ${firebaseError.code}` });
    }
});

export default router;