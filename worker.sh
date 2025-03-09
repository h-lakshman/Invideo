#!/bin/bash

# Log file paths
ELIXIR_LOG="./elixir_server.log"
FRONTEND_LOG="./frontend.log"

# Function to restart the Elixir backend if it crashes
restart_elixir() {
    echo "[$(date)] Elixir backend starting/restarting..." >> $ELIXIR_LOG
    
    while true; do
        cd "$(dirname "$0")/elixir_backend" && \
        PORT=443 MIX_ENV=prod mix phx.server >> $ELIXIR_LOG 2>&1
        
        echo "[$(date)] Elixir backend crashed, restarting in 5 seconds..." >> $ELIXIR_LOG
        sleep 5
    done
}

# Function to restart the frontend if it crashes
restart_frontend() {
    echo "[$(date)] Frontend starting/restarting..." >> $FRONTEND_LOG
    
    while true; do
        cd "$(dirname "$0")/frontend/ui" && \
        npm install --silent >> $FRONTEND_LOG 2>&1 && \
        npm run build >> $FRONTEND_LOG 2>&1 && \
        PORT=80 npm run preview -- --host 0.0.0.0 --port 80 >> $FRONTEND_LOG 2>&1
        
        echo "[$(date)] Frontend crashed, restarting in 5 seconds..." >> $FRONTEND_LOG
        sleep 5
    done
}

# Create log files if they don't exist
touch $ELIXIR_LOG
touch $FRONTEND_LOG

echo "[$(date)] Starting worker script..." | tee -a $ELIXIR_LOG $FRONTEND_LOG

# Start both processes in the background
restart_elixir &
restart_frontend &

# Keep the script running
wait 