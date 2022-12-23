#!/usr/bin/env bash
set -euo pipefail

docker-compose up -d couchbase redis

pushd scores-src
NODE_ENV="test" yarn dev &
SCORES_PID=$!
popd

pushd bundle-src
NODE_ENV="test" yarn bundle:dev &
BUNDLE_PID=$!
popd

echo "Waiting for things to start up..."
sleep 5

NODE_ENV="test" yarn nodecg &
NCG_PID=$!

if [ "$#" -ge 1 ]; then
  set +e
  yarn cypress "$@"
  CY_RETVAL=$?
  kill "${NCG_PID}" "${BUNDLE_PID}" "${SCORES_PID}"
fi

wait "${NCG_PID}" "${BUNDLE_PID}" "${SCORES_PID}"
echo "We've tried our best to clean everything up."
echo "It might not have worked, so you may need to run a 'killall node'."
exit "${CY_RETVAL:-0}"
