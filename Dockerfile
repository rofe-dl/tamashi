FROM node:20
WORKDIR /opt/tamashi

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "run", "start"]