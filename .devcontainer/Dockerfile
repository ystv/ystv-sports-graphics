FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:16-bullseye

RUN npm install -g prettier

RUN mkdir -p /home/vscode/.vscode-server/extensions \
        /home/vscode/.vscode-server-insiders/extensions \
    && chown -R node \
        /home/vscode/.vscode-server \
        /home/vscode/.vscode-server-insiders

RUN git clone --branch legacy-1.x https://github.com/nodecg/nodecg.git /nodecg
WORKDIR /nodecg
RUN npm install --production

WORKDIR /nodecg/bundles/ystv-sports-graphics
COPY .yarn/ /nodecg/bundles/ystv-sports-graphics/.yarn
COPY .yarnrc.yml package.json yarn.lock scores/package.json scores/yarn.lock nodecg-bundle/package.json nodecg-bundle/yarn.lock /nodecg/bundles/ystv-sports-graphics/
RUN chown -R node:node /nodecg && \
    su node -c "cd /nodecg/bundles/ystv-sports-graphics && yarn"

USER node:node
