FROM node:10

RUN npm install -g bower gulp

WORKDIR /app

COPY package.json bower.json gulpfile.js ./

RUN npm install
RUN npm rebuild node-sass

RUN bower install --allow-root --silent

COPY . .

EXPOSE 9001

CMD ["gulp", "serve"]

