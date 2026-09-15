FROM postgres:16.15-trixie AS extension-build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential git ca-certificates postgresql-server-dev-16 \
    && git clone https://github.com/percona/pg_stat_monitor.git /tmp/pg_stat_monitor \
    && cd /tmp/pg_stat_monitor \
    && git checkout fc93cb91536eda1218d840ff3572a5161aa32ded \
    && make USE_PGXS=1 PG_CONFIG=/usr/lib/postgresql/16/bin/pg_config \
    && make install USE_PGXS=1 PG_CONFIG=/usr/lib/postgresql/16/bin/pg_config

FROM postgres:16.15-trixie
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-16-pgaudit openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=extension-build /usr/lib/postgresql/16/lib/pg_stat_monitor.so /usr/lib/postgresql/16/lib/
COPY --from=extension-build /usr/share/postgresql/16/extension/pg_stat_monitor* /usr/share/postgresql/16/extension/
COPY infra/postgres/entrypoint.sh /usr/local/bin/sap-postgres-entrypoint
RUN sed -i 's/\r$//' /usr/local/bin/sap-postgres-entrypoint && chmod 755 /usr/local/bin/sap-postgres-entrypoint
ENV PGDATA=/data/postgresql
ENTRYPOINT ["/usr/local/bin/sap-postgres-entrypoint"]
CMD ["postgres", "-c", "listen_addresses=*", "-c", "ssl=on", "-c", "ssl_cert_file=/data/tls/server.crt", "-c", "ssl_key_file=/data/tls/server.key", "-c", "shared_preload_libraries=pgaudit,pg_stat_monitor", "-c", "shared_buffers=32MB", "-c", "effective_cache_size=96MB", "-c", "work_mem=1MB", "-c", "maintenance_work_mem=16MB", "-c", "max_connections=40", "-c", "max_wal_size=128MB", "-c", "min_wal_size=32MB", "-c", "pg_stat_monitor.pgsm_max=10", "-c", "pg_stat_monitor.pgsm_track=none", "-c", "pg_stat_monitor.pgsm_normalized_query=on", "-c", "pg_stat_monitor.pgsm_enable_query_plan=off", "-c", "log_statement=none", "-c", "log_min_error_statement=panic"]
