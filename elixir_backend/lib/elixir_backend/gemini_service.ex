defmodule ElixirBackend.GeminiService do
  @moduledoc """
  Service for interacting with the Gemini API to generate shader code.
  """

  @doc """
  Generates shader code using the Gemini API based on the provided prompt.
  """
  def generate_shader(prompt) do
    api_key = System.get_env("GEMINI_API_KEY")
    model = "gemini-2.0-flash"  # Hardcode the model name to match the working curl command
    url = "https://generativelanguage.googleapis.com/v1beta/models/#{model}:generateContent?key=#{api_key}"

    enhanced_prompt = """
    Generate a GLSL shader based on the following description: "#{prompt}".
    
    Your task is to create a visually impressive and animated GLSL shader that works properly in WebGL 2.0.
    
    ATTENTION: The shader MUST follow this EXACT specification to work in the frontend:
    
    1. The vertex shader must accept vertices already in clip space (-1 to 1 range).
    2. The shader must use WebGL 2.0 syntax with "#version 300 es" at the top.
    3. The fragment shader must use "out vec4 fragColor;" for output.
    4. Animation must use the u_time uniform for movement.
    
    Use EXACTLY these variable names:
    - in vec4 a_position; // Already in clip space (-1 to 1)
    - uniform float u_time; // Time in seconds
    - uniform vec2 u_resolution; // Canvas width and height
    - out vec4 fragColor; // Fragment shader output
    
    CRITICAL: The vertex shader should NOT transform the positions by dividing by resolution.
    The a_position values are ALREADY in clip space (-1 to 1).
    
    Example vertex shader:
    ```vertex
    #version 300 es
    in vec4 a_position;
    out vec2 v_texCoord;
    
    void main() {
      v_texCoord = a_position.xy * 0.5 + 0.5; // Convert from clip space to texture coordinates
      gl_Position = a_position; // Position is already in clip space
    }
    ```
    
    Example fragment shader:
    ```fragment
    #version 300 es
    precision highp float;
    
    in vec2 v_texCoord;
    uniform float u_time;
    uniform vec2 u_resolution;
    out vec4 fragColor;
    
    void main() {
      vec3 color = vec3(0.5) + 0.5 * cos(u_time + v_texCoord.xyx + vec3(0, 2, 4));
      fragColor = vec4(color, 1.0);
    }
    ```
    
    Please provide BOTH a vertex shader and a fragment shader in this exact format.
    
    Format your response with code blocks using:
    ```vertex
    #version 300 es
    // Vertex shader code here
    ```
    
    ```fragment
    #version 300 es
    // Fragment shader code here  
    ```
    """

    options = [
      timeout: 120_000,  # 120 seconds timeout
      recv_timeout: 120_000,  # 120 seconds receive timeout
      follow_redirect: true
    ]

    case HTTPoison.post(url, Poison.encode!(%{
      contents: [
        %{
          parts: [
            %{
              text: enhanced_prompt
            }
          ]
        }
      ]
    }), [{"Content-Type", "application/json"}], options) do
      {:ok, %{status_code: 200, body: body}} ->
        case Poison.decode(body) do
          {:ok, %{"candidates" => [%{"content" => %{"parts" => [%{"text" => text}]}} | _]}} ->
            {:ok, extract_shader_code(text)}

          {:ok, %{"error" => error}} ->
            {:error, "Gemini API error: #{inspect(error)}"}

          _ ->
            {:error, "Invalid response from Gemini API"}
        end

      {:ok, %{status_code: status, body: body}} ->
        {:error, "Gemini API error: #{status} - #{body}"}

      {:error, error} ->
        {:error, "HTTP request failed: #{inspect(error)}"}
    end
  end

  defp extract_shader_code(text) do
    result = %{}

    # Try to find vertex shader
    case Regex.run(~r/```(?:vertex|glsl)?\s*([\s\S]*?)\s*```/, text) do
      [_, vertex_code] ->
        if String.contains?(text, "```vertex") or String.contains?(String.downcase(text), "vertex shader") do
          Map.put(result, :vertexShader, String.trim(vertex_code))
        else
          Map.put(result, :combinedShader, String.trim(vertex_code))
        end

      nil ->
        result
    end
    |> extract_fragment_shader(text)
  end

  defp extract_fragment_shader(result, text) do
    case Regex.run(~r/```(?:fragment)\s*([\s\S]*?)\s*```/, text) do
      [_, fragment_code] ->
        result
        |> Map.put(:fragmentShader, String.trim(fragment_code))
        |> maybe_remove_combined_shader()

      nil ->
        result
    end
  end

  defp maybe_remove_combined_shader(%{vertexShader: _, fragmentShader: _} = result) do
    Map.delete(result, :combinedShader)
  end

  defp maybe_remove_combined_shader(result), do: result
end 