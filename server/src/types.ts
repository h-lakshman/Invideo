export interface ShaderRequest {
  prompt: string;
}

export interface ShaderResponse {
  success: boolean;
  data?: {
    vertexShader?: string;
    fragmentShader?: string;
    combinedShader?: string;
  };
  error?: string;
  rawOutput?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
}
