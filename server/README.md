# Shader Generator Backend

This is an Express.js backend that uses the Gemini API to generate GLSL shader code based on text prompts.

## Features

- Express.js server with TypeScript
- Integration with Gemini API for shader generation
- Error handling for invalid shader code
- Returns both raw LLM output and extracted shader code

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.0-flash
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Generate Shader

- **URL**: `/api/shader`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "prompt": "A colorful flowing liquid"
  }
  ```
- **Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "vertexShader": "// Vertex shader code here",
      "fragmentShader": "// Fragment shader code here"
    },
    "rawOutput": "Full LLM response text"
  }
  ```
- **Error Response**:
  ```json
  {
    "success": false,
    "error": "Error message",
    "rawOutput": "Raw LLM output if available"
  }
  ```

## Build for Production

```
npm run build
npm start
```
