import React, { useState } from "react";
import RustCalculator from "./Components/TabOne";
import ShaderGenerator from "./Components/ShaderGenerator";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"calculator" | "shader">(
    "calculator"
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          React + Rust/WASM + AI Shader Generator
        </h1>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("calculator")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "calculator"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Rust Calculator
              </button>
              <button
                onClick={() => setActiveTab("shader")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "shader"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                AI Shader Generator
              </button>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white shadow rounded-lg p-6">
          <RustCalculator active={activeTab === "calculator"} />
          <ShaderGenerator active={activeTab === "shader"} />
        </div>
      </div>
    </div>
  );
};

export default App;
