#!/bin/sh
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Uvicorn server..."
exec uvicorn telegraph.asgi:application --host 0.0.0.0 --port 8111 --workers 1