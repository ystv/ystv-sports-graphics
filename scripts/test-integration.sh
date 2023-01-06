#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Start database
docker-compose --project-directory "$SCRIPT_DIR/.." up -d couchbase redis
# wait for it to be ready
curl --retry 30 --retry-delay 0 --retry-all-errors http://localhost:8091/pools/default

pushd scores-src || exit 1

if ! curl -fs http://localhost:8000/healthz; then
  # Build server
  yarn build
  # Start it
  NODE_ENV="test" yarn prod:server >"$SCRIPT_DIR/../test-server.log" 2>&1 &
fi

# Run tests
set +e
yarn test:integration
yarn_exit=$?

popd || exit 1

# Clean up
kill "$(jobs -p)"
exit "$yarn_exit"
