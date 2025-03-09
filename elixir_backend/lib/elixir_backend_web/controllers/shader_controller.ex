defmodule ElixirBackendWeb.ShaderController do
  use ElixirBackendWeb, :controller

  alias ElixirBackend.GeminiService

  def index(conn, _params) do
    json(conn, %{message: "Shader Generator API is running"})
  end

  def options(conn, _params) do
    conn
    |> put_resp_header("access-control-allow-origin", "*")
    |> put_resp_header("access-control-allow-methods", "POST, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "content-type")
    |> send_resp(204, "")
  end

  def generate_shader(conn, %{"prompt" => prompt}) do
    case GeminiService.generate_shader(prompt) do
      {:ok, shader_code} ->
        conn
        |> put_resp_header("access-control-allow-origin", "*")
        |> json(%{
          success: true,
          data: shader_code
        })

      {:error, error} ->
        conn
        |> put_status(:internal_server_error)
        |> put_resp_header("access-control-allow-origin", "*")
        |> json(%{
          success: false,
          error: error
        })
    end
  end

  def generate_shader(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> put_resp_header("access-control-allow-origin", "*")
    |> json(%{
      success: false,
      error: "Prompt is required"
    })
  end
end 