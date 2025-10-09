import express from 'express';
import * as admin from 'firebase-admin';
import createRouter from './routes/create.routes';
import upsertRouter from './routes/upsert.routes';
import checkUserExistenceRouter from './routes/checkUserExistsInDB.routes';
import firebaseDataPushRouter from './routes/firebaseDataPush.routes';
import path from 'path';


const SERVICE_ACCOUNT_FILE = 'serviceAccountKey.json';
const serviceAccountPath = path.resolve(__dirname, '..', SERVICE_ACCOUNT_FILE);


let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = require(serviceAccountPath) as admin.ServiceAccount;
} catch (error) {
  console.error(`[ERRO DE INICIALIZAÇÃO] Não foi possível carregar o arquivo de credenciais Firebase em: ${serviceAccountPath}`);
  console.error("Verifique se o arquivo JSON da conta de serviço existe na raiz do projeto e se chama: serviceAccountKey.json");
  throw new Error("Falha ao carregar credenciais do Firebase Admin SDK.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/user/exists', checkUserExistenceRouter);
app.use('/user/create', createRouter);
app.use('/user/upsert', upsertRouter);         
app.use('/firebaseDataPush', firebaseDataPushRouter); 

app.listen(PORT, () => {
  console.log(`Middleware FCM rodando e escutando na porta ${PORT}`);
});