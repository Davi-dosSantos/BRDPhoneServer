import { Router, Request, Response } from 'express';
import { checkUserTokensExist, FCMToken, getActiveTokensFromDB } from '../services/db.service'; 

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

    let userTokens: FCMToken[] = [];
    try {
        // Busca todos os tokens ativos (array de objetos)
        userTokens = await getActiveTokensFromDB(userID_Domain); 
        
        if (userTokens.length > 0) {
            // Se tokens forem encontrados, formata a lista de dispositivos
            const devices = userTokens.map(tokenRecord => ({
                token: tokenRecord.token,
                platform: tokenRecord.platform, // Retorna o nome da plataforma/dispositivo
                last_active: tokenRecord.updatedAt // Informação extra útil
            }));

            // Retorna o status 200 com os dados
            return res.status(200).send({ 
                exists: true, 
                userID: userID_Domain,
                message: `Encontrados ${devices.length} dispositivo(s) ativo(s).`,
                devices: devices // Lista de dispositivos e seus tokens/plataformas
            });
        } else {
            // Nenhum token ativo encontrado
            return res.status(404).send({ 
                exists: false, 
                message: `O usuário ${userID_Domain} não tem tokens ativos no DB.`,
                devices: []
            });
        }
    } catch (dbError) {
        console.error(`[ERRO DB] Falha ao buscar os tokens para ${userID_Domain}:`, dbError);
        return res.status(500).send({ error: "Falha interna ao buscar os dispositivos no DB." });
    }
});

export default router;