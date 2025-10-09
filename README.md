📞 BRDPhoneServer - Middleware FCM

Este projeto é um servidor de backend (Middleware) construído com Node.js e TypeScript, utilizando o framework Express. Sua principal função é gerenciar os tokens de registro (FCM Tokens) dos dispositivos móveis (Android/iOS) e atuar como um ponto central para o envio de notificações push via Firebase Cloud Messaging (FCM).
🚀 Configuração Inicial e Setup

Siga os passos abaixo para configurar e rodar o projeto localmente.
1. Pré-requisitos

    Node.js (versão 18 ou superior)

    npm ou yarn

    MySQL (servidor de banco de dados rodando)

    Firebase Admin SDK Key (Arquivo JSON)

2. Instalação de Dependências

# Navegue até o diretório raiz do projeto
npm install

3. Configuração do Firebase Admin SDK

O servidor é configurado para carregar as credenciais de autenticação do Firebase Admin SDK a partir de um arquivo JSON.

    Baixe o arquivo de chave da conta de serviço (Service Account Key) no Console do Firebase.

    Renomeie o arquivo baixado para serviceAccountKey.json.

    Coloque este arquivo diretamente na raiz do projeto (na mesma pasta que o package.json).

4. Configuração do Banco de Dados (Prisma)

O projeto usa Prisma como ORM para interagir com o MySQL.

    Variáveis de Ambiente (.env):
    Crie um arquivo .env na raiz do projeto com sua URL de conexão. Certifique-se de que o banco de dados fcm_db (ou o nome que você definiu no schema.prisma) já esteja criado no seu MySQL.

    # Exemplo de conexão MySQL
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/fcm_db"

    Geração do Cliente Prisma:
    Após configurar o .env e o schema.prisma (certificando-se de que o modelo fcmToken existe), gere o cliente:

    npx prisma generate

5. Execução do Servidor

O servidor roda usando ts-node.

npm run dev

O servidor será iniciado e estará escutando na porta 3000.
🔌 Rotas da API

O servidor segue uma convenção RESTful focada no recurso (user) e na notificação (firebaseDataPush). Todas as rotas usam a porta 3000 na URL base.
1. Verificação de Usuário

Verifica se um usuário, identificado pelo seu ID, possui um token FCM cadastrado no banco de dados.

    Endpoint: /user/check

    Método: POST

Campo
	

Tipo
	

Descrição

userID_Domain
	

string
	

O ID exclusivo do usuário no seu domínio.

Exemplo de Resposta (Sucesso - Encontrado):

{
  "exists": true,
  "message": "Usuário 41008 existe no DB."
}

Exemplo de Resposta (Erro - Não Encontrado):

Retorna o status HTTP 404 Not Found.

{
  "exists": false,
  "message": "Usuário 41008 não encontrado no DB."
}

2. Registro / Atualização de Token

Essa rota é idempotente (cria se não existe, atualiza se existe) e é usada pelo app móvel para garantir que o token FCM mais recente esteja no DB.

    Endpoint: /user/update (ou user/create se for mantido separado)

    Método: POST

Campo
	

Tipo
	

Descrição

userID_Domain
	

string
	

ID do usuário.

token
	

string
	

Token FCM fornecido pelo Firebase SDK.

type
	

string
	

Plataforma: Android ou IOS.

Exemplo de Resposta:

{
  "success": true,
  "message": "Token atualizado/registrado para sip:41008 (DB)."
}

3. Envio de Notificação Push (FCM)

(Esta rota ainda não foi totalmente implementada, mas é o endpoint planejado para o envio de mensagens.)

    Endpoint: /firebaseDataPush

    Método: POST

    Função: Receber uma carga útil (payload) e usar o firebase-admin para enviar a notificação ao token associado ao userID_Domain fornecido.

