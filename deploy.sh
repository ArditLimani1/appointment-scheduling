#!/usr/bin/env bash
set -euo pipefail

PHP=/opt/alt/php84/usr/bin/php
cd "$HOME/laravel_app"

git pull origin master
"$PHP" "$(command -v composer)" install --no-dev --optimize-autoloader
"$PHP" artisan migrate --force
"$PHP" artisan optimize
