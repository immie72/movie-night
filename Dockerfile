FROM node:22-alpine
WORKDIR /app
COPY package.json server.js catalogue.js ./
COPY public ./public
RUN mkdir /app/data && chown -R node:node /app
USER node
ENV PORT=3000 DATA_DIR=/app/data
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server.js"]
