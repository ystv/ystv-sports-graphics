FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:16

RUN npm install -g prettier

RUN mkdir -p /workspaces/sports-scores && chown -R node:node /workspaces/sports-scores

RUN mkdir -p /home/vscode/.vscode-server/extensions \
        /home/vscode/.vscode-server-insiders/extensions \
    && chown -R node \
        /home/vscode/.vscode-server \
        /home/vscode/.vscode-server-insiders

COPY .yarn/ /workspaces/sports-scores/.yarn
COPY .yarnrc.yml package.json yarn.lock scores/package.json scores/yarn.lock nodecg-bundle/package.json nodecg-bundle/yarn.lock /workspaces/sports-scores/
RUN chown -R node:node /workspaces/sports-scores && su node -c "cd /workspaces/sports-scores && yarn"

USER node:node
