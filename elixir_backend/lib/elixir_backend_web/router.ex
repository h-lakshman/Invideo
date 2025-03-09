defmodule ElixirBackendWeb.Router do
  use ElixirBackendWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug CORSPlug, origin: ["http://localhost:5173", "http://51.21.221.146"], methods: ["GET", "POST", "OPTIONS"]
  end

  scope "/api", ElixirBackendWeb do
    pipe_through :api

    options "/shader", ShaderController, :options
    post "/shader", ShaderController, :generate_shader
  end

  scope "/", ElixirBackendWeb do
    pipe_through :api

    get "/", ShaderController, :index
  end
end
