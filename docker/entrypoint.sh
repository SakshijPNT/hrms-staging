#!/bin/sh
set -e

dotnet /app/api/Hrms.NewApi.dll &
API_PID=$!

for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:5000/health >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "ERROR: .NET API process exited during startup. Check connection string and database."
    wait "$API_PID" || true
    exit 1
  fi
  sleep 2
done

exec /usr/sbin/nginx -g 'daemon off;'
