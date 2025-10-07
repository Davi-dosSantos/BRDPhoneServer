# ==============================
# ETAPA 1: BUILD (Compilação)
# Usa uma imagem Node completa para instalar dependências
# ==============================
FROM node:20-bookworm-slim AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de definição do projeto
COPY package.json package-lock.json ./

# Instala as dependências de produção
# O --omit=dev garante que as dependências de desenvolvimento não sejam instaladas
RUN npm install --omit=dev

# Copia o código-fonte do servidor (server.js, serviceAccountKey.json, etc.)
COPY . .

# ==============================
# ETAPA 2: PRODUÇÃO (Runtime)
# Usa uma imagem base menor e mais segura para execução
# ==============================
FROM node:20-bookworm-slim

# Define o diretório de trabalho da imagem final
WORKDIR /app

# Copia apenas os arquivos necessários da etapa de build:
# 1. O código-fonte do servidor
COPY --from=builder /app .
# 2. O arquivo de chave do Firebase (CRUCIAL!)
# Certifique-se de que o nome 'serviceAccountKey.json' esteja correto
COPY serviceAccountKey.json /app/serviceAccountKey.json 

# O servidor Node.js precisa ser acessível pela porta 3000 (conforme definido no server.js)
EXPOSE 3000

# Executa o servidor usando node server.js
# O comando CMD usa o usuário 'node' padrão da imagem, que é mais seguro que 'root'
CMD ["node", "server.js"]