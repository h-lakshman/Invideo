#!/bin/bash

# Change to the backend directory
cd "$(dirname "$0")/elixir_backend"

# Get dependencies and compile
mix deps.get
mix compile

# Start the backend server on port 443
PORT=443 MIX_ENV=prod mix phx.server 