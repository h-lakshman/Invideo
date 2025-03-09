defmodule ElixirBackend.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Phoenix.PubSub, name: ElixirBackend.PubSub},
      ElixirBackendWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: ElixirBackend.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    ElixirBackendWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
