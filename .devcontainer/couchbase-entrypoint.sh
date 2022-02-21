#!/usr/bin/env bash
set -euo pipefail

# Clean up old logs and make sure we have directories we need
rm -rf /opt/couchbase/var/lib/couchbase/logs/*
mkdir -p /opt/couchbase/var/lib/couchbase/{config,data,stats,logs}

echo "Run up Couchbase Server"
# The actual command to run CB server based on the server image entrypoint.
/opt/couchbase/bin/couchbase-server -- -kernel global_enable_tracing false -noinput &

echo "Wait for it to be ready"
until curl -sS -w 200 http://127.0.0.1:8091/ui/index.html &> /dev/null; do
    echo "Not ready, waiting to recheck"
    sleep 2
done

chown -R couchbase:couchbase /cbdata

# This stuff may fail if it's already configured
set +e

# Set some options
couchbase-cli node-init -c couchbase://localhost -u Administrator -p password \
  --node-init-data-path /cbdata/data --node-init-index-path /cbdata/index

# Initialize the cluster
couchbase-cli cluster-init --cluster-name 'ystvcouchdev0' --cluster-username Administrator --cluster-password password \
 --cluster-ramsize 256 --cluster-index-ramsize 256 --services data,index,query

# Create the bucket
couchbase-cli bucket-create -c couchbase://localhost -u Administrator -p password --bucket sports-scores \
 --bucket-type couchbase --storage-backend couchstore --durability-min-level none \
 --bucket-ramsize 256 --enable-flush 1

# Create the app user
couchbase-cli user-manage -c couchbase://localhost -u Administrator -p password --set \
  --rbac-username sports-scores --rbac-password password --rbac-name 'Sports Scores Service Account' \
  --roles 'bucket_full_access[sports-scores]' --auth-domain local

wait
