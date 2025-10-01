# Etapa única: desarrollo con Angular CLI dev server
FROM node:20-alpine

# Útil para deps nativas ocasionales
RUN apk add --no-cache git

WORKDIR /app

# Instala deps primero para cache
COPY package*.json ./
RUN npm ci

# Copia el resto del código
COPY . .

# Vars útiles en contenedor
ENV HOST=0.0.0.0
ENV PORT=4200
ENV CHOKIDAR_USEPOLLING=true
ENV NG_CLI_ANALYTICS=off

# ...
# ...
EXPOSE 4200
CMD ["sh","-c","npx ng serve --host 0.0.0.0 --port 4200 --poll 2000 --proxy-config proxy.docker.js"]


