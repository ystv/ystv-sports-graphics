FROM node:16-slim AS build

WORKDIR /app
COPY .yarn /app/.yarn
COPY package.json yarn.lock .yarnrc.yml /app/
RUN yarn install && rm .yarn/cache/*

COPY . /app
RUN yarn build:server

FROM node:16-slim
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
# needed for libcouchbase
COPY --from=build /app/node_modules/couchbase/build/Release/couchbase_impl.node /app/addon-build/release/install-root/couchbase_impl.node
COPY --from=build /app/config /app/config
COPY --from=build /app/package.json /app/
COPY --from=build /app/dist/index.server.js /app/
WORKDIR /app
CMD ["index.server.js"]
