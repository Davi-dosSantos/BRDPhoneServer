import express from 'express';
import * as admin from 'firebase-admin';
import dbUpdateRouter from './routes/dbUpdate.routes';
import firebaseDataPushRouter from './routes/firebaseDataPush.routes';
const serviceAccountString = process.env.FIREBASE_ADMIN_CREDENTIALS;

if (!serviceAccountString) {
    throw new Error("A variável de ambiente FIREBASE_ADMIN_CREDENTIALS não está definida.");
}
const serviceAccount = JSON.parse(serviceAccountString) as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/dbUpdate', dbUpdateRouter);         
app.use('/firebaseDataPush', firebaseDataPushRouter); 

app.listen(PORT, () => {
  console.log(`Middleware FCM rodando e escutando na porta ${PORT}`);
});