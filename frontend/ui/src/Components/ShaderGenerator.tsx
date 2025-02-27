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

    const setupWebGL = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Clean previos animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      const gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
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
      if (!glRef.current || !programRef.current) return;

      const gl = glRef.current;
      const program = programRef.current;

      gl.clearColor(0, 0, 0, 0);
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

    setupWebGL();
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
      const response = await fetch("http://localhost:3000/api/shader", {
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
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">AI Shader Generator</h2>

      <div className="mb-4">
        <label
          htmlFor="prompt"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Describe the kind of WebGL shader you want:
        </label>
        <input
          id="prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A rotating cube with a gradient background"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        onClick={generateShader}
        disabled={loading || !prompt.trim()}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Generating..." : "Generate Shader"}
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {shaderResponse && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Generated Shader</h3>

          {/* Canvas to display the shader */}
          <div className="mb-4">
            <canvas
              ref={canvasRef}
              className="w-full h-64 border border-gray-300 rounded-md bg-black"
            />
          </div>

          {/* Raw shader code display */}
          <div className="mt-4">
            <h4 className="font-medium mb-1">Raw Shader Code:</h4>
            <pre className="bg-gray-100 p-3 rounded-md overflow-auto max-h-64 text-xs">
              {shaderResponse.rawOutput || "No shader code generated"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShaderGenerator;
