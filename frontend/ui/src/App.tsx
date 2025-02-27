import React, { useState } from "react";
import RustCalculator from "./Components/TabOne";
import ShaderGenerator from "./Components/ShaderGenerator";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"calculator" | "shader">(
    "calculator"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <h1 className="text-xl font-medium text-gray-800">
            React + Rust/WASM + Shader Generator
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("calculator")}
                className={`pb-4 px-1 font-medium text-sm border-b-2 ${
                  activeTab === "calculator"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Rust Calculator
              </button>
              <button
                onClick={() => setActiveTab("shader")}
                className={`pb-4 px-1 font-medium text-sm border-b-2 ${
                  activeTab === "shader"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Shader Generator
              </button>
            </nav>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <RustCalculator active={activeTab === "calculator"} />
          <ShaderGenerator active={activeTab === "shader"} />
        </div>
      </main>
    </div>
  );
};

export default App;
