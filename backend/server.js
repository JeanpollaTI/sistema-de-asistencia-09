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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (ej: fotos subidas)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ----------------- RUTAS API -----------------
app.use("/auth", authRouter);           // Registro, login, usuarios/profesores
app.use("/horario", horarioRouter);     // Módulo de horario
app.use("/profesores", profesoresRouter); // Administración de profesores

// ----------------- SERVIR FRONTEND (React build) -----------------
// Si vas a subir frontend y backend juntos en Render:
const frontendPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendPath));

// Cualquier ruta que no sea API → devolver index.html
app.get("*", (req, res) => {
  if (!req.path.startsWith("/auth") && !req.path.startsWith("/horario") && !req.path.startsWith("/profesores")) {
    res.sendFile(path.join(frontendPath, "index.html"));
  } else {
    res.status(404).json({ msg: "Ruta no encontrada" });
  }
});

// ----------------- MONGODB -----------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.log("❌ Error MongoDB:", err));

// ----------------- SERVIDOR -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

export default app;
