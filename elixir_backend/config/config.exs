# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

# Load environment variables from .env file
if File.exists?(".env") do
  File.read!(".env")
  |> String.split("\n")
  |> Enum.each(fn line ->
    case String.split(line, "=", parts: 2) do
      [key, value] -> System.put_env(String.trim(key), String.trim(value))
      _ -> :ok
    end
  end)
end

config :elixir_backend,
  generators: [timestamp_type: :utc_datetime]

# Configures the endpoint
config :elixir_backend, ElixirBackendWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Phoenix.Endpoint.Cowboy2Adapter,
  render_errors: [
    formats: [json: ElixirBackendWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: ElixirBackend.PubSub,
  live_view: [signing_salt: "1+5X2UmX"],
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  watchers: []

# Configure CORS
config :cors_plug,
  origin: ["http://localhost:5173"],
  max_age: 86400,
  methods: ["GET", "POST", "OPTIONS"],
  headers: ["Content-Type", "Authorization", "Accept", "Origin", "User-Agent", "DNT", "Cache-Control", "X-Mx-ReqToken", "Keep-Alive", "X-Requested-With", "If-Modified-Since"],
  expose: ["Content-Type", "Authorization"],
  credentials: true

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Gemini API configuration
config :elixir_backend, :gemini_api,
  api_key: System.get_env("GEMINI_API_KEY"),
  model: System.get_env("GEMINI_MODEL", "gemini-2.0-flash")

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
