import { Request, Response } from "express";
import { generateShader } from "./geminiService";
import { ShaderRequest } from "./types";


export const generateShaderCode = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body as ShaderRequest;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    const result = await generateShader(prompt);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in shader controller:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
