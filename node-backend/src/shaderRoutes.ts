import express, { Router } from "express";
import { generateShaderCode } from "./shaderController";

const router: Router = express.Router();

router.post("/shader", generateShaderCode);

export default router;
