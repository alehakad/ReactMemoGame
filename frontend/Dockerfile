FROM node:18-alpine

WORKDIR /app/frontend

COPY public/ /app/frontend/public
COPY src/ /app/frontend/src
COPY package.json /app/frontend/

# install all package.json dependencies
RUN npm install 

CMD ["npm", "start"]