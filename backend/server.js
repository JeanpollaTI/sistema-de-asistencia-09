import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import morgan from "morgan";

// ----------------- RUTAS -----------------
import { authRouter } from "./routes/auth.js";
import { horarioRouter } from "./routes/horario.js";
import { profesoresRouter } from "./routes/profesores.js";

// ----------------- CONFIG -----------------
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------- LOGGER -----------------
app.use(morgan("dev"));

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

// ----------------- CREAR CARPETA UPLOADS SI NO EXISTE -----------------
const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

// Servir archivos estáticos (ej: fotos subidas, PDFs)
app.use("/uploads", express.static(uploadsPath));

// ----------------- RUTAS API -----------------
app.use("/auth", authRouter);
app.use("/horario", horarioRouter);
app.use("/profesores", profesoresRouter);

// ----------------- SERVIR FRONTEND (React build) -----------------
const frontendPath = path.join(__dirname, "../build");
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

// ----------------- ERROR HANDLER -----------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Ocurrió un error en el servidor." });
});

// ----------------- MONGODB -----------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.log("❌ Error MongoDB:", err));

// ----------------- SERVIDOR -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

export default app;
