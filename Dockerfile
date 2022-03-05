FROM debian:stable-slim AS build-env
FROM node:16-slim AS build

WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn --no-progress --frozen-lockfile install

COPY . /app
RUN yarn build:server

FROM gcr.io/distroless/nodejs:16
# needed for libcouchbase
COPY --from=build-env /lib/x86_64-linux-gnu/libz.so.1 /lib/x86_64-linux-gnu/libz.so.1
COPY --from=build /app /app
WORKDIR /app
CMD ["dist/index.server.js"]
