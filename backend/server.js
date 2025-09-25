import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ----------------- RUTAS -----------------
import { authRouter } from "./routes/auth.js";
import { horarioRouter } from "./routes/horario.js";
import { profesoresRouter } from "./routes/profesores.js";

// ----------------- CONFIG -----------------
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- MIDDLEWARE -----------------
const frontendURL = process.env.FRONTEND_URL && process.env.FRONTEND_URL !== ""
  ? process.env.FRONTEND_URL
  : "*";

app.use(cors({
  origin: frontendURL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (ej: fotos subidas)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ----------------- RUTAS API -----------------
app.use("/auth", authRouter);
app.use("/horario", horarioRouter);
app.use("/profesores", profesoresRouter);

// ----------------- SERVIR FRONTEND (React build) -----------------
const frontendPath = path.join(__dirname, "../build"); // <- Ajustado
app.use(express.static(frontendPath));

// ----------------- CATCH-ALL FRONTEND -----------------
app.use((req, res, next) => {
  const apiPrefixes = ["/auth", "/horario", "/profesores", "/uploads"];
  if (!apiPrefixes.some(prefix => req.path.startsWith(prefix))) {
    res.sendFile(path.join(frontendPath, "index.html"));
  } else {
    next();
  }
});

// ----------------- MONGODB -----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.log("❌ Error MongoDB:", err));

// ----------------- SERVIDOR -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

export default app;
