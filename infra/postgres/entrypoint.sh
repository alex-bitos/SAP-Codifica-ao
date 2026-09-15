#!/bin/sh
set -eu
mkdir -p /data/tls
if [ ! -s /data/tls/server.key ] || [ ! -s /data/tls/server.crt ]; then
  umask 077
  openssl req -new -x509 -nodes -days 3650 -newkey rsa:3072 \
    -subj '/CN=sap-codigos-postgres-economico.internal' \
    -keyout /data/tls/server.key -out /data/tls/server.crt >/dev/null 2>&1
fi
chown -R postgres:postgres /data/tls
chmod 600 /data/tls/server.key
chmod 644 /data/tls/server.crt
exec /usr/local/bin/docker-entrypoint.sh "$@"
