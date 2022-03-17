FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:16

RUN npm install -g prettier

RUN mkdir -p /workspaces/sports-scores && chown node:node /workspaces/sports-scores

RUN mkdir -p /home/vscode/.vscode-server/extensions \
        /home/vscode/.vscode-server-insiders/extensions \
    && chown -R node \
        /home/vscode/.vscode-server \
        /home/vscode/.vscode-server-insiders

COPY package.json yarn.lock /workspaces/sports-scores/
RUN su node -c "cd /workspaces/sports-scores && yarn"

USER node:node
