import Config

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

config :cors_plug,
  origin: ["http://localhost:5173", "http://51.21.221.146"],
  max_age: 86400,
  methods: ["GET", "POST", "OPTIONS"],
  headers: ["Content-Type", "Authorization", "Accept", "Origin", "User-Agent", "DNT", "Cache-Control", "X-Mx-ReqToken", "Keep-Alive", "X-Requested-With", "If-Modified-Since"],
  expose: ["Content-Type", "Authorization"],
  credentials: true

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

config :elixir_backend, :gemini_api,
  api_key: System.get_env("GEMINI_API_KEY"),
  model: System.get_env("GEMINI_MODEL", "gemini-2.0-flash")

import_config "#{config_env()}.exs"
