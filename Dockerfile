FROM node:18-alpine

# Install natpmpc
RUN apk add --no-cache libnatpmp libnatpmp-dev build-base && \
    cd /tmp && \
    wget http://miniupnp.free.fr/files/libnatpmp-20150609.tar.gz && \
    tar -xzf libnatpmp-20150609.tar.gz && \
    cd libnatpmp-20150609 && \
    make && \
    make install && \
    cd / && \
    rm -rf /tmp/libnatpmp-20150609* && \
    apk del build-base libnatpmp-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
