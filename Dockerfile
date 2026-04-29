FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install --production
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate
USER node
EXPOSE 4000
CMD ["node", "src/index.js"]
