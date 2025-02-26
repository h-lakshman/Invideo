import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import shaderRoutes from "./shaderRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", shaderRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Shader Generator API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
