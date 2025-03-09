defmodule ElixirBackendWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :elixir_backend

  @session_options [
    store: :cookie,
    key: "_elixir_backend_key",
    signing_salt: "XDzTNE7F",
    same_site: "Lax"
  ]

  plug Plug.Static,
    at: "/",
    from: :elixir_backend,
    gzip: false,
    only: ElixirBackendWeb.static_paths()

  if code_reloading? do
    plug Phoenix.CodeReloader
  end

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug ElixirBackendWeb.Router
end
