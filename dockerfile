# ==============================
# ETAPA 1: BUILD (Compilação) - NOMEADA 'builder'
# Instala arquivos de desenvolvimento (libmysqlclient-dev)
# ==============================
FROM node:20 AS builder

# Instala ferramentas essenciais para download
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    gnupg \
    wget \
    lsb-release && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Configuração e Instalação do Repositório MySQL
# 1. Baixa o arquivo de configuração do repositório
RUN wget -O /tmp/mysql-apt-config.deb https://dev.mysql.com/get/mysql-apt-config_0.8.22-1_all.deb && \
    # 2. Instala o repositório (cria /etc/apt/sources.list.d/mysql.list)
    dpkg -i /tmp/mysql-apt-config.deb && \
    apt-get update

# 3. Instala o cliente MySQL real para compilar dependências nativas
RUN apt-get install -y --no-install-recommends \
    libmysqlclient-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala dependências e compila
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build 

# ==============================
# ETAPA 2: PRODUÇÃO (Runtime)
# Instala apenas as bibliotecas de runtime (libmysqlclient21)
# ==============================
FROM node:20-bookworm-slim

WORKDIR /app

# 1. COPIA O REPOSITÓRIO: Copia o arquivo de configuração do MySQL da Etapa 1
#    para que esta Etapa saiba onde encontrar os pacotes.
COPY --from=builder /etc/apt/sources.list.d/mysql.list /etc/apt/sources.list.d/
COPY --from=builder /etc/apt/trusted.gpg.d /etc/apt/trusted.gpg.d

# 2. Instala a biblioteca de runtime do MySQL (libmysqlclient21 ou similar)
# O repositório agora está configurado, então o apt-get funcionará.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libmysqlclient21 && \ 
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copia arquivos finais do build
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/serviceAccountKey.json /app/serviceAccountKey.json
COPY --from=builder /app/prisma /app/prisma

EXPOSE 3000

CMD ["node", "dist/server.js"]