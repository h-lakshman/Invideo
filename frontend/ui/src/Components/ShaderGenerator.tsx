import React, { useState, useEffect, useRef } from "react";
import { mat4 } from "gl-matrix";

interface ShaderGeneratorProps {
  active: boolean;
}

interface ShaderResponse {
  success: boolean;
  data?: {
    vertexShader?: string;
    fragmentShader?: string;
    combinedShader?: string;
  };
  error?: string;
  rawOutput?: string;
}

const ShaderGenerator: React.FC<ShaderGeneratorProps> = ({ active }) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shaderResponse, setShaderResponse] = useState<ShaderResponse | null>(
    null
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!active || !shaderResponse?.success || !canvasRef.current) return;

    // Clean up previous WebGL context and resources
    const cleanup = () => {
      if (glRef.current && programRef.current) {
        const gl = glRef.current;
        gl.useProgram(null);
        gl.deleteProgram(programRef.current);

        // Delete vertex array objects and buffers
        const vao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
        if (vao) gl.deleteVertexArray(vao);

        // Reset context
        glRef.current = null;
        programRef.current = null;
      }
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    cleanup(); // Clean up before setting up new context

    const setupWebGL = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      console.log("Setting up WebGL context...");

      const gl = canvas.getContext("webgl2", {
        preserveDrawingBuffer: true,
        alpha: true,
      }) as WebGL2RenderingContext;

      if (!gl) {
        setError("WebGL2 is not supported in your browser");
        return;
      }
      glRef.current = gl;

      // Resize canvas to match its display size
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      // Default vertex shader if none provided
      const defaultVertexShader = `#version 300 es
        in vec4 a_position;
        uniform float u_time;
        void main() {
          gl_Position = a_position;
        }`;

      // Default fragment shader if none provided
      const defaultFragmentShader = `#version 300 es
        precision highp float;
        uniform float u_time;
        out vec4 fragColor;
        void main() {
          fragColor = vec4(sin(u_time) * 0.5 + 0.5, cos(u_time) * 0.5 + 0.5, sin(u_time + 3.14) * 0.5 + 0.5, 1.0);
        }`;

      let vertexShaderSource =
        shaderResponse.data?.vertexShader || defaultVertexShader;
      let fragmentShaderSource =
        shaderResponse.data?.fragmentShader ||
        (shaderResponse.data?.combinedShader
          ? shaderResponse.data.combinedShader
          : defaultFragmentShader);

      const hasMVPMatrix = vertexShaderSource.includes(
        "u_modelViewProjectionMatrix"
      );

      const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        vertexShaderSource
      );
      const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
      );

      if (!vertexShader || !fragmentShader) {
        return;
      }

      // Create program
      const program = createProgram(gl, vertexShader, fragmentShader);
      if (!program) {
        return;
      }
      programRef.current = program;

      // Use the program
      gl.useProgram(program);

      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      if (hasMVPMatrix) {
        setupCube(gl, program);
      } else {
        setupQuad(gl, program);
      }

      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);

      startTimeRef.current = Date.now();

      render();
    };

    const setupQuad = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      const positionAttributeLocation = gl.getAttribLocation(
        program,
        "a_position"
      );
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );

      const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
      );
    };

    const setupCube = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Cube vertices (8 corners)
      const positions = [
        // Front face
        -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,

        // Back face
        -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5, -0.5,

        // Top face
        -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, -0.5,

        // Bottom face
        -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5,

        // Right face
        0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5,

        // Left face
        -0.5, -0.5, -0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, -0.5,
      ];

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
      );

      const positionAttributeLocation = gl.getAttribLocation(
        program,
        "a_position"
      );
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        3,
        gl.FLOAT,
        false,
        0,
        0
      );

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

      // Indices for the cube faces (6 faces, 2 triangles each)
      const indices = [
        0,
        1,
        2,
        0,
        2,
        3, // front
        4,
        5,
        6,
        4,
        6,
        7, // back
        8,
        9,
        10,
        8,
        10,
        11, // top
        12,
        13,
        14,
        12,
        14,
        15, // bottom
        16,
        17,
        18,
        16,
        18,
        19, // right
        20,
        21,
        22,
        20,
        22,
        23, // left
      ];

      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW
      );
    };

    const createShader = (
      gl: WebGL2RenderingContext,
      type: number,
      source: string
    ) => {
      const shader = gl.createShader(type);
      if (!shader) {
        setError("Could not create shader");
        return null;
      }

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!success) {
        const errorMsg = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        setError(`Could not compile shader: ${errorMsg}`);
        return null;
      }

      return shader;
    };

    const createProgram = (
      gl: WebGL2RenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader
    ) => {
      const program = gl.createProgram();
      if (!program) {
        setError("Could not create program");
        return null;
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      const success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!success) {
        const errorMsg = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        setError(`Could not link program: ${errorMsg}`);
        return null;
      }

      return program;
    };

    const render = () => {
      if (!glRef.current || !programRef.current) {
        console.log("Render skipped - missing GL context or program");
        return;
      }

      const gl = glRef.current;
      const program = programRef.current;

      console.log("Rendering frame...");

      // Clear with a dark background to make it obvious if rendering is happening
      gl.clearColor(0.1, 0.1, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Use the program
      gl.useProgram(program);

      const timeUniformLocation = gl.getUniformLocation(program, "u_time");
      if (timeUniformLocation) {
        const timeInSeconds = (Date.now() - startTimeRef.current) / 1000;
        gl.uniform1f(timeUniformLocation, timeInSeconds);
      }

      const resolutionUniformLocation = gl.getUniformLocation(
        program,
        "u_resolution"
      );
      if (resolutionUniformLocation) {
        gl.uniform2f(
          resolutionUniformLocation,
          gl.canvas.width,
          gl.canvas.height
        );
      }

      const mvpUniformLocation = gl.getUniformLocation(
        program,
        "u_modelViewProjectionMatrix"
      );

      if (mvpUniformLocation) {
        const aspect = gl.canvas.width / gl.canvas.height;
        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, Math.PI / 4, aspect, 0.1, 100);

        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, [0, 0, 3], [0, 0, 0], [0, 1, 0]);

        const modelMatrix = mat4.create();
        const timeInSeconds = (Date.now() - startTimeRef.current) / 1000;
        mat4.rotateY(modelMatrix, modelMatrix, timeInSeconds);

        const mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
        mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);

        gl.uniformMatrix4fv(mvpUniformLocation, false, mvpMatrix);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    // Start the setup and render process
    try {
      setupWebGL();
    } catch (err) {
      console.error("Error during WebGL setup:", err);
      setError(err instanceof Error ? err.message : "WebGL setup failed");
      cleanup();
    }

    // Cleanup on unmount or when dependencies change
    return cleanup;
  }, [active, shaderResponse]);

  const generateShader = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setShaderResponse(null);

    try {
      const healthCheck = await fetch("http://localhost:4000/");
      if (!healthCheck.ok) {
        throw new Error("Server is not responding");
      }
      const response = await fetch("http://localhost:4000/api/shader", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setShaderResponse(data);

      if (!data.success) {
        setError(data.error || "Failed to generate shader");
      }
    } catch (err) {
      console.error("Error generating shader:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect to the server"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!active) return null;

  return (
    <div className="max-w-3xl mx-auto px-5 py-6">
      <h2 className="text-2xl font-medium mb-6 text-gray-800">
        Shader Generator
      </h2>

      <div className="mb-5">
        <label htmlFor="prompt" className="block mb-2 text-sm text-gray-600">
          Describe your shader:
        </label>
        <div className="flex gap-3">
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., flowing liquid with ripples"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={generateShader}
            disabled={loading || !prompt.trim()}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed ${
              loading ? "opacity-80" : ""
            }`}
          >
            {loading ? "Working..." : "Generate"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {shaderResponse && (
        <div className="mt-6">
          <div className="mb-5">
            <canvas
              ref={canvasRef}
              className="w-full h-72 bg-black rounded-md border border-gray-200"
            />
          </div>

          <div>
            <h3 className="text-base font-medium mb-2 text-gray-700">
              Shader Code
            </h3>
            <pre className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs overflow-auto whitespace-pre-wrap max-h-80 font-mono">
              {shaderResponse.data ? (
                <>
                  {shaderResponse.data.vertexShader && (
                    <>
                      <div className="font-semibold mb-2">Vertex Shader:</div>
                      {shaderResponse.data.vertexShader}
                    </>
                  )}

                  {shaderResponse.data.fragmentShader && (
                    <>
                      <div className="font-semibold mt-4 mb-2">
                        Fragment Shader:
                      </div>
                      {shaderResponse.data.fragmentShader}
                    </>
                  )}

                  {shaderResponse.data.combinedShader &&
                    !shaderResponse.data.vertexShader &&
                    !shaderResponse.data.fragmentShader && (
                      <>
                        <div className="font-semibold mb-2">Shader Code:</div>
                        {shaderResponse.data.combinedShader}
                      </>
                    )}
                </>
              ) : (
                "No shader code generated"
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShaderGenerator;
