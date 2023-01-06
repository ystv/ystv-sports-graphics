#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Start Redis
docker-compose --project-directory "$SCRIPT_DIR/.." up -d redis

pushd scores-src || exit 1
yarn test
yarn_exit=$?
popd || exit 1
exit "$yarn_exit"
