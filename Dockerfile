FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY server.mjs hosa-blood-drive-accountability-form.html ./
ENV NODE_ENV=production
CMD ["node", "server.mjs"]
