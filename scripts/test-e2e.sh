#!/usr/bin/env bash
set -euo pipefail
export NODE_ENV=test
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

setup_only=0
no_bundle=0
while test $# -gt 0; do
  case "$1" in
  --setup-only)
    setup_only=1
    ;;
  --no-bundle)
    no_bundle=1
    ;;
  --*)
    echo "bad option $1"
    ;;
  esac
  shift
done

# Start database
docker-compose --project-directory "$SCRIPT_DIR/.." up -d couchbase redis
# wait for it to be ready
curl --retry 30 --retry-delay 0 --retry-all-errors -so /dev/null http://localhost:8091/pools/default

pushd "$SCRIPT_DIR/../scores-src" || exit 1

if ! curl -fs -o /dev/null http://localhost:8000/healthz || ! curl -fs -o /dev/null http://localhost:3000/healthz; then
  echo "Building scores server/client..."
  yarn build
fi

if ! curl -fs -o /dev/null http://localhost:8000/healthz; then
  echo "Starting scores server..."
  yarn prod:server >"$SCRIPT_DIR/../test-server.log" 2>&1 &
fi
if ! curl -fs -o /dev/null http://localhost:3000; then
  echo "Starting scores client..."
  yarn prod:client >/dev/null &
fi

popd || exit 1

if ! curl -fs -o /dev/null http://localhost:9090 && [ "$no_bundle" -eq 0 ]; then
  pushd "$SCRIPT_DIR/../bundle-src" || exit 1
  echo "Building bundle..."
  yarn bundle:build

  echo "Starting NodeCG..."
  node "$SCRIPT_DIR/../../../index.js" >"$SCRIPT_DIR/../test-nodecg.log" 2>&1 &
  popd || exit 1
fi

if [ "$setup_only" -eq 1 ]; then
  echo "Setup complete."
  exit 0
fi

echo "Running E2E tests..."
fail=0
yarn cypress run || fail=1

exit "$fail"
