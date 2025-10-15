#!/bin/sh
set -e

echo "Waiting for database..."
until echo 'SELECT 1;' | bun prisma db execute --stdin --url="$DATABASE_URL" > /dev/null 2>&1; do
  sleep 2
done

if [ ! -f /app/.migrated ]; then
  echo "Running migrations..."
  bun db:push
  bun db:seed
  touch /tmp/.migrated
fi

exec "$@"