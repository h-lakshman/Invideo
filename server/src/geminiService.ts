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
      
      Please provide either:
      1. Both a vertex shader and a fragment shader, or
      2. A single combined GLSL shader snippet
      
      Format your response with code blocks using the \`\`\`vertex, \`\`\`fragment, or \`\`\`glsl syntax.
      The shader should be simple but visually interesting, and must be valid GLSL that can compile and run in a WebGL context.
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
