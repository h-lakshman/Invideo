import axios from "axios";
import dotenv from "dotenv";
import { GeminiResponse } from "./types";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Extracts shader code from the LLM response
 * Looks for code blocks marked with ```glsl, ```vertex, ```fragment, or just ```
 */
const extractShaderCode = (text: string) => {
  const result: {
    vertexShader?: string;
    fragmentShader?: string;
    combinedShader?: string;
  } = {};

  // Try to find vertex shader
  const vertexMatch = text.match(/```(?:vertex|glsl)?\s*([\s\S]*?)\s*```/);
  if (vertexMatch && vertexMatch[1]) {
    // Check if this is specifically labeled as vertex shader
    if (
      text.includes("```vertex") ||
      text.toLowerCase().includes("vertex shader")
    ) {
      result.vertexShader = vertexMatch[1].trim();
    } else {
      // If not specifically labeled, it might be a combined shader
      result.combinedShader = vertexMatch[1].trim();
    }
  }

  // Try to find fragment shader
  const fragmentMatch = text.match(/```(?:fragment)\s*([\s\S]*?)\s*```/);
  if (fragmentMatch && fragmentMatch[1]) {
    result.fragmentShader = fragmentMatch[1].trim();
  }

  // If we have both vertex and fragment, we don't need combined
  if (result.vertexShader && result.fragmentShader) {
    delete result.combinedShader;
  }

  return result;
};

/**
 * Generates shader code using the Gemini API
 */
export const generateShader = async (
  prompt: string
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  rawOutput?: string;
}> => {
  try {
    const enhancedPrompt = `
    Generate a GLSL shader based on the following description: "${prompt}".
    
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
    \`\`\`vertex
    #version 300 es
    in vec4 a_position;
    out vec2 v_texCoord;
    
    void main() {
      v_texCoord = a_position.xy * 0.5 + 0.5; // Convert from clip space to texture coordinates
      gl_Position = a_position; // Position is already in clip space
    }
    \`\`\`
    
    Example fragment shader:
    \`\`\`fragment
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
    \`\`\`
    
    Please provide BOTH a vertex shader and a fragment shader in this exact format.
    
    Format your response with code blocks using:
    \`\`\`vertex
    #version 300 es
    // Vertex shader code here
    \`\`\`
    
    \`\`\`fragment
    #version 300 es
    // Fragment shader code here  
    \`\`\`
    `;

    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data as GeminiResponse;

    if (
      data.candidates &&
      data.candidates.length > 0 &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.length > 0
    ) {
      const text = data.candidates[0].content.parts[0].text;
      const shaderCode = extractShaderCode(text);

      // Check if we extracted any shader code
      if (Object.keys(shaderCode).length === 0) {
        return {
          success: false,
          error: "Could not extract valid shader code from the response",
          rawOutput: text,
        };
      }

      return {
        success: true,
        data: shaderCode,
        rawOutput: text,
      };
    }

    return {
      success: false,
      error: "Invalid response from Gemini API",
      rawOutput: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error generating shader:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      rawOutput: error instanceof Error ? error.stack : undefined,
    };
  }
};
