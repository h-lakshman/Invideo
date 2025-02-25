import React, { useState, useEffect } from "react";
import init, { calculate_wasm } from "@calculator/rust_calculator";

interface CalculatorProps {
  active: boolean;
}

const RustCalculator: React.FC<CalculatorProps> = ({ active }) => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wasmLoaded, setWasmLoaded] = useState(false);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        await init();
        setWasmLoaded(true);
      } catch (err) {
        console.error("Failed to load WASM:", err);
        setError("Failed to load calculator module");
      }
    };

    loadWasm();
  }, []);

  const handleCalculate = () => {
    if (!wasmLoaded) {
      setError("Calculator module not loaded yet");
      return;
    }

    try {
      setError(null);
      const calculationResult = calculate_wasm(expression);
      setResult(calculationResult);
    } catch (err) {
      console.error("Calculation error:", err);
      setError(err instanceof Error ? err.message : "Invalid expression");
      setResult(null);
    }
  };

  if (!active) return null;

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Rust Calculator</h2>
      <div className="mb-4">
        <label
          htmlFor="expression"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Enter Mathematical Expression:
        </label>
        <input
          id="expression"
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="e.g., 2+2, 3*4, (5+7)/2"
          className="w-full p-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        onClick={handleCalculate}
        disabled={!wasmLoaded || !expression.trim()}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        Calculate
      </button>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {result !== null && !error && (
        <div className="mt-4 p-4 bg-green-100 rounded-md">
          <p className="font-bold">Result:</p>
          <p className="text-2xl">{result}</p>
        </div>
      )}
    </div>
  );
};

export default RustCalculator;
