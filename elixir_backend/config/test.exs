import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :elixir_backend, ElixirBackendWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "pEQd5M1TdOWBBXrz28M6Qn4h6gjFcMn/XQRv6X7TmgxYOmDY/Y3usmh/5bAffJO0",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
