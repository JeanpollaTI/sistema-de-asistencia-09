import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Grupo.css";

function Grupo({ user }) {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCrearGrupo, setShowCrearGrupo] = useState(false);
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: "", alumnos: [] });
  const [alumnoInput, setAlumnoInput] = useState({ nombre: "", apellidoPaterno: "", apellidoMaterno: "" });
  const [profesores, setProfesores] = useState([]);
  const [selectedGrupo, setSelectedGrupo] = useState(null);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState("");

  // -------------------- Cargar grupos y profesores --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === "admin") {
          const gruposRes = await axios.get("/api/grupos");
          setGrupos(gruposRes.data);
          const profesoresRes = await axios.get("/api/profesores");
          setProfesores(profesoresRes.data);
        } else if (user?.role === "profesor") {
          const gruposRes = await axios.get("/api/mis-grupos");
          setGrupos(gruposRes.data);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) return <p>Cargando grupos...</p>;

  // -------------------- Funciones para crear grupo --------------------
  const agregarAlumno = () => {
    if (!alumnoInput.nombre.trim() || !alumnoInput.apellidoPaterno.trim()) return;
    const fullName = `${alumnoInput.nombre} ${alumnoInput.apellidoPaterno} ${alumnoInput.apellidoMaterno || ""}`.trim();
    const updatedAlumnos = [...nuevoGrupo.alumnos, { ...alumnoInput, fullName }];

    updatedAlumnos.sort((a, b) => a.apellidoPaterno.toLowerCase().localeCompare(b.apellidoPaterno.toLowerCase()));

    setNuevoGrupo({ ...nuevoGrupo, alumnos: updatedAlumnos });
    setAlumnoInput({ nombre: "", apellidoPaterno: "", apellidoMaterno: "" });
  };

  const limpiarAlumnos = () => setNuevoGrupo({ ...nuevoGrupo, alumnos: [] });

  const guardarGrupo = async () => {
    if (!nuevoGrupo.nombre.trim()) return alert("Escribe el Grado y Grupo");
    if (nuevoGrupo.alumnos.length === 0) return alert("Agrega al menos un alumno");

    try {
      const response = await axios.post("/api/grupos", nuevoGrupo);
      setGrupos([...grupos, response.data]);
      setNuevoGrupo({ nombre: "", alumnos: [] });
      setShowCrearGrupo(false);
    } catch (error) {
      console.error("Error al guardar el grupo:", error);
    }
  };

  // -------------------- Asignar Profesor --------------------
  const asignarProfesor = async (grupoId) => {
    if (!profesorSeleccionado) return alert("Selecciona un profesor");

    try {
      const res = await axios.put(`/api/grupos/${grupoId}/asignar-profesor`, { profesorId: profesorSeleccionado });
      setGrupos(grupos.map(g => g._id === grupoId ? res.data : g));
      alert("Profesor asignado correctamente");
      setProfesorSeleccionado("");
    } catch (error) {
      console.error("Error asignando profesor:", error);
    }
  };

  // -------------------- Vista Admin --------------------
  const renderAdminView = () => (
    <div className="grupo-admin">
      <h2>Administrar Grupos</h2>

      <div className="grupo-actions">
        <button className="btn-main" onClick={() => setShowCrearGrupo(true)}>Crear Grupo</button>
        <button className="btn-main" onClick={() => alert("Abrir modal Importar XLS")}>Importar XLS</button>
      </div>

      {showCrearGrupo && (
        <div className="modal-grupo">
          <h3>Crear Nuevo Grupo</h3>
          <input
            type="text"
            placeholder="Grado y Grupo (Ej. 1A)"
            value={nuevoGrupo.nombre}
            onChange={(e) => setNuevoGrupo({ ...nuevoGrupo, nombre: e.target.value })}
          />

          <div className="alumnos-section">
            <input
              type="text"
              placeholder="Nombre"
              value={alumnoInput.nombre}
              onChange={(e) => setAlumnoInput({ ...alumnoInput, nombre: e.target.value })}
            />
            <input
              type="text"
              placeholder="Apellido Paterno"
              value={alumnoInput.apellidoPaterno}
              onChange={(e) => setAlumnoInput({ ...alumnoInput, apellidoPaterno: e.target.value })}
            />
            <input
              type="text"
              placeholder="Apellido Materno"
              value={alumnoInput.apellidoMaterno}
              onChange={(e) => setAlumnoInput({ ...alumnoInput, apellidoMaterno: e.target.value })}
            />
            <button onClick={agregarAlumno}>Agregar</button>
            <button onClick={limpiarAlumnos} style={{ backgroundColor: "#f44336" }}>Limpiar Lista</button>
          </div>

          <ul>
            {nuevoGrupo.alumnos.map((a, i) => (
              <li key={i}>{i + 1}. {a.fullName}</li>
            ))}
          </ul>

          <div className="modal-buttons">
            <button onClick={guardarGrupo} className="btn-main">Guardar Grupo</button>
            <button onClick={() => setShowCrearGrupo(false)} className="btn-main" style={{ backgroundColor: "#888" }}>Cancelar</button>
          </div>
        </div>
      )}

      <h3>Grupos Existentes</h3>
      {grupos.length === 0 ? <p>No hay grupos registrados.</p> : (
        <div className="grupos-grid">
          {grupos.map(grupo => (
            <div key={grupo._id} className="grupo-rectangulo" onClick={() => setSelectedGrupo(grupo)}>
              <strong>{grupo.nombre}</strong>
              <p>Profesores: {grupo.profesores?.map(p => p.nombre).join(", ") || "Sin asignar"}</p>

              <select
                value={profesorSeleccionado}
                onChange={(e) => setProfesorSeleccionado(e.target.value)}
              >
                <option value="">Seleccionar profesor</option>
                {profesores.map(p => (
                  <option key={p._id} value={p._id}>{p.nombre}</option>
                ))}
              </select>
              <button onClick={() => asignarProfesor(grupo._id)}>Asignar Profesor</button>
            </div>
          ))}
        </div>
      )}

      {selectedGrupo && (
        <div className="detalle-grupo">
          <h4>{selectedGrupo.nombre} - Lista de Alumnos</h4>
          <ul>
            {selectedGrupo.alumnos.map((a, i) => (
              <li key={i}>{i + 1}. {a.fullName}</li>
            ))}
          </ul>
          <button onClick={() => setSelectedGrupo(null)} className="btn-main" style={{ backgroundColor: "#888" }}>Cerrar</button>
        </div>
      )}
    </div>
  );

  // -------------------- Vista Profesor --------------------
  const renderProfesorView = () => (
    <div className="grupo-profesor">
      <h2>Mis Grupos</h2>
      {grupos.length === 0 ? <p>No tienes grupos asignados.</p> : (
        grupos.map(grupo => (
          <div key={grupo._id} className="grupo-card">
            <h4>{grupo.nombre}</h4>
            <p>Total de alumnos: {grupo.alumnos?.length || 0}</p>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="grupo-container">
      {user?.role === "admin" && renderAdminView()}
      {user?.role === "profesor" && renderProfesorView()}
    </div>
  );
}

export default Grupo;
