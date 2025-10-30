import { Router, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { FirebaseError } from 'firebase-admin';
import { getActiveTokensFromDB, FCMToken } from '../services/db.service'; 
import { Platform } from '@prisma/client'; 
import { getCurrentTimestamp } from '../utils/date';
const router = Router();

interface NotifyCallRequest extends Request {
    body: {
        userID_destino: string;
        userID_origem: string;
    };
}

interface PushResult {
    token: string;
    platform: Platform; 
    status: boolean;
    messageId?: string;
    errorCode?: string;
    errorMessage?: string;
}

router.post('/', async (req: NotifyCallRequest, res: Response) => {

    const timeStamp = getCurrentTimestamp();
    const { userID_destino, userID_origem } = req.body; 

    if (!userID_destino || !userID_origem) {
        return res.status(400).send({ error: "userID_destino e userID_origem são obrigatórios." });
    }
    if (userID_destino === userID_origem) {
        return res.status(400).send({ error: "userID_destino e userID_origem não podem ser iguais." });
    }

    let activeTokens: FCMToken[] = [];
    try {
        activeTokens = await getActiveTokensFromDB(userID_destino);
    } catch (dbError) {
        console.error(`${timeStamp} [ERRO DB] Falha ao buscar tokens para ${userID_destino}:`, dbError);
        return res.status(500).send({ error: "Falha interna ao buscar tokens no DB." });
    }

    if (activeTokens.length === 0) {
        console.warn(`${timeStamp} [AVISO] Nenhum token ativo encontrado para ${userID_destino}. Push ignorado.`);
        return res.status(404).send({ error: "Nenhum token FCM ativo encontrado para o UserID de destino." });
    }

    // --- Preparação e Envio de Mensagens em Lote ---
    const sendPromises: Promise<string>[] = [];

    for (const recipient of activeTokens) {
        const { token, platform } = recipient; 
        
        let message: admin.messaging.Message = {
            token: token,
            data: {
                caller_id: userID_origem, 
                target_id: userID_destino,
                type: 'INCOMING_CALL' 
            }
        };

        if (platform === Platform.Android || platform === Platform.Extension) {
            message.android = { directBootOk: true, priority: 'high', ttl: 25000 };
        } else if (platform === Platform.IOS) {
            message.apns = {
                headers: { 'apns-priority': '10', 'apns-expiration': (Date.now() / 1000 + 25).toString() },
                payload: { aps: { contentAvailable: true, alert: { title: 'Nova Chamada', body: `Chamada de ${userID_origem}` } } }
            };
        }
        
        sendPromises.push(admin.messaging().send(message));
    }



    const results = await Promise.allSettled(sendPromises);
    
    const detailedResults: PushResult[] = [];
    let tokensToDeactivate: { token: string, platform: Platform }[] = [];
    let successCount = 0;
    let errorCount = 0;

    results.forEach((result, index) => {
        const tokenData = activeTokens[index];
        if (!tokenData) {
            console.error(`${timeStamp} [ERRO INTERNO] Token ausente no array ativo para índice ${index}.`);
            return; 
        }
        const { token, platform  } = tokenData; 

        if (result.status === 'fulfilled') {
            successCount++;
            detailedResults.push({
                token: token,
                platform: platform,
                status: true,
                messageId: result.value 
            });
            console.log(`${timeStamp} [PUSH SUCESSO] Notificação (${platform}) enviada para ${userID_destino}. ID Firebase: ${result.value}`);
        } else {
            errorCount++;
            const error = result.reason as FirebaseError; 
            const errorCode = error?.code || 'UNKNOWN_ERROR';
            const errorMessage = error?.message || 'Erro de envio desconhecido.';
            
            detailedResults.push({
                token: token,
                platform: platform,
                status: false,
                errorCode: errorCode,
                errorMessage: errorMessage
            });
            
            console.error(`${timeStamp} [ERRO FCM] Falha ao enviar para ${userID_destino}/${platform}: Código: ${errorCode}, Mensagem: ${errorMessage}`);

            //Marcar token para desativação ---
            if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-argument') {
                tokensToDeactivate.push({ token, platform });
            }
        }
    });
    
    // desativação de tokens em lote
    //if (tokensToDeactivate.length > 0) {
    //    console.log(`Iniciando desativação de ${tokensToDeactivate.length} tokens inválidos.`);
    //    tokensToDeactivate.forEach(({ token, platform }) => {
    //        deactivateTokenInDB(token).catch(dbErr => { 
    //            console.error(`[ERRO DB] Falha ao desativar token ${token}/${platform}:`, dbErr);
    //        });
    //    });
    //}

    // Resposta 
    if (successCount > 0) {
        res.status(200).send({ 
            success: true, 
            message: `${timeStamp} Notificação processada. Sucessos: ${successCount}, Falhas: ${errorCount}.`,
            results: detailedResults 
        });
    } else {
        res.status(500).send({ 
            success: false, 
            message: `${timeStamp} Falha ao enviar notificação para todos os dispositivos. Total de falhas: ${errorCount}.`,
            results: detailedResults 
        });
    }
});

export default router;