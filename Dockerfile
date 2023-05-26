FROM node:latest
WORKDIR /
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
