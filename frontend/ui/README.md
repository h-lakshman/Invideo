# AI Shader Generator Frontend

This is a React frontend for generating GLSL shaders using AI. It connects to an Express backend that uses the Gemini API to generate shader code based on text prompts.

## Features

- React-based UI with TypeScript
- WebGL2 shader rendering with support for:
  - 2D fragment shaders
  - 3D shaders with rotating cubes
  - Animation via time uniforms
- Integration with AI-powered shader generation API
- Real-time shader preview
- Raw shader code display
- Error handling for invalid shader code

## Setup

1. Make sure the backend server is running (see the server README)
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. Navigate to the "AI Shader Generator" tab
2. Enter a description of the shader you want to generate (e.g., "A rotating cube with effects")
3. Click "Generate Shader"
4. The generated shader will be displayed in the preview canvas
5. The raw shader code will be shown below the preview

## Requirements

- Modern browser with WebGL2 support
- Backend server running on http://localhost:3000

## Technologies Used

- React
- TypeScript
- WebGL2
- gl-matrix for 3D matrix operations
- Tailwind CSS
