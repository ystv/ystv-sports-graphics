#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV=test

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Start database
docker-compose --project-directory "$SCRIPT_DIR/.." up -d couchbase redis
echo "Waiting for Couchbase Server to be ready..."
curl -u Administrator:password --retry 30 --retry-delay 0 --retry-all-errors -so /dev/null http://localhost:8091/pools/default/buckets/sports-scores

pushd "$SCRIPT_DIR/../scores-src" || exit 1

if ! curl -fs -o /dev/null http://localhost:8000/healthz; then
  echo "Building scores server..."
  yarn build

  echo "Starting scores server..."
  yarn prod:server >"$SCRIPT_DIR/../test-server.log" 2>&1 &
  curl --retry 30 --retry-delay 0 --retry-all-errors -fs -o /dev/null http://localhost:8000/healthz
fi

# Run tests
set +e
yarn test:integration
yarn_exit=$?

popd || exit 1

# Clean up
kill "$(jobs -p)"
exit "$yarn_exit"
