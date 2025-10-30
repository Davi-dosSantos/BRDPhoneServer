import { Router, Request, Response } from 'express';
import { FCMToken, getActiveTokensFromDB } from '../services/db.service'; 
import { getCurrentTimestamp } from '../utils/date';

const router = Router();

interface CheckUserRequest extends Request {
  body: {
    userID_Domain: string;
  };
}
router.post('/', async (req: CheckUserRequest, res: Response) => {
    const timeStamp = getCurrentTimestamp();
    const { userID_Domain } = req.body; 

    if (!userID_Domain) {
        return res.status(400).send({ error: "userID_Domain é obrigatório." });
    }

    let userTokens: FCMToken[] = [];
    try {
        // Busca todos os tokens ativos (array de objetos)
        userTokens = await getActiveTokensFromDB(userID_Domain); 
        
        if (userTokens.length > 0) {
            // Se tokens forem encontrados, formata a lista de dispositivos
            const devices = userTokens.map(tokenRecord => ({
                token: tokenRecord.token,
                platform: tokenRecord.platform, // Retorna o nome da plataforma/dispositivo
                last_active: tokenRecord.updatedAt // Data da último atividade
            }));

            // Retorna o status 200 com os dados
            return res.status(200).send({ 
                exists: true, 
                userID: userID_Domain,
                message: `${timeStamp} Encontrados ${devices.length} dispositivo(s) ativo(s).`,
                devices: devices 
            });
        } else {
            // Nenhum token ativo encontrado
            return res.status(404).send({ 
                exists: false, 
                message: `${timeStamp} O usuário ${userID_Domain} não tem tokens ativos no DB.`,
                devices: []
            });
        }
    } catch (dbError) {
        console.error(`${timeStamp} [ERRO DB] Falha ao buscar os tokens para ${userID_Domain}:`, dbError);
        return res.status(500).send({ error: "Falha interna ao buscar os dispositivos no DB." , dbError});
    }
});

export default router;