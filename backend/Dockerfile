FROM node:20-alpine

WORKDIR /app

# copy dependency files
COPY package*.json ./

# install dependencies
RUN npm install

# copy project files
COPY . .

# expose backend port
EXPOSE 3001

# start dev server
CMD ["npm", "run", "dev"]