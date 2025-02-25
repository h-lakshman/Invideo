import React, { useState } from "react";
import RustCalculator from "./Components/TabOne";
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"calculator" | "other">(
    "calculator"
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          React + Rust/WASM + Elixir App
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
                onClick={() => setActiveTab("other")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "other"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Tab 2
              </button>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white shadow rounded-lg p-6">
          <RustCalculator active={activeTab === "calculator"} />
          {activeTab === "other" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Tab 2 Content</h2>
              <p>This would be your second tab content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
