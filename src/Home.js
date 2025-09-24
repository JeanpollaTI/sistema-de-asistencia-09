import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import logo from "./logo.png";
import axios from "axios";

function Home({ user, handleNavClick }) {
  const navigate = useNavigate();
  const [profesores, setProfesores] = useState([]);
  const [selectedProfesor, setSelectedProfesor] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [asignaturasSelect, setAsignaturasSelect] = useState([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const materias = [
    "MATEMATICAS COOR.ACADEMICA",
    "TUTORIA",
    "ESPAÑOL",
    "INGLES TUTORIA",
    "INGLES",
    "MATEMATICAS",
    "CIENCIAS I",
    "CIENCIAS II",
    "CIENCIAS III",
    "ELECTRONICA",
    "INDUSTRIA DEL VESTIDO",
    "DISEÑO ARQUIT.",
    "INFORMATICA",
    "GEOGRAFIA-HISTORIA TUTORIA",
    "HISTORIA",
    "F.CIVICA y ETICA",
    "F.CIVICA y ETICA-A.C",
    "F.CIVICA y ETICA-A.C TUTORIA",
    "ARTES(MUSICA)",
    "EDUCACION FISICA",
  ];

  useEffect(() => {
    const navMenu = document.getElementById("nav-menu");
    const navToggle = document.getElementById("nav-toggle");
    const navClose = document.getElementById("nav-close");

    if (navToggle)
      navToggle.addEventListener("click", () =>
        navMenu.classList.add("show-menu")
      );
    if (navClose)
      navClose.addEventListener("click", () =>
        navMenu.classList.remove("show-menu")
      );

    const navLinks = document.querySelectorAll(".nav-link, .nav-link-button");
    navLinks.forEach((n) =>
      n.addEventListener("click", () =>
        navMenu.classList.remove("show-menu")
      )
    );

    const scrollHeader = () => {
      const header = document.getElementById("header");
      if (window.scrollY >= 80) header.classList.add("scroll-header");
      else header.classList.remove("scroll-header");
    };
    window.addEventListener("scroll", scrollHeader);

    return () => window.removeEventListener("scroll", scrollHeader);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") fetchProfesores();
  }, [user]);

  const fetchProfesores = () => {
    const token = localStorage.getItem("token");
    if (!token) return console.error("⚠️ No hay token guardado.");

    axios
      .get("http://localhost:5000/auth/profesores", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfesores(res.data || []))
      .catch((err) => console.error("Error al obtener profesores:", err));
  };

  const openModal = (profesor) => {
    setSelectedProfesor(profesor);
    setAsignaturasSelect(profesor.asignaturas || []);
    setModalVisible(true);
    setConfirmDeleteVisible(false);
  };

  const closeModal = () => {
    setSelectedProfesor(null);
    setModalVisible(false);
    setConfirmDeleteVisible(false);
    setAsignaturasSelect([]);
  };

  const profileImgUrl = (foto) => {
    if (!foto) return "http://localhost:5000/uploads/fotos/default.png";
    if (foto.startsWith("http")) return foto;
    return `http://localhost:5000${foto}`;
  };

  const handleAsignaturasChange = (materia) => {
    if (asignaturasSelect.includes(materia))
      setAsignaturasSelect(asignaturasSelect.filter((m) => m !== materia));
    else setAsignaturasSelect([...asignaturasSelect, materia]);
  };

  const guardarAsignaturas = () => {
    if (!selectedProfesor) return;
    const token = localStorage.getItem("token");

    axios
      .put(
        `http://localhost:5000/profesores/${selectedProfesor._id}/asignaturas`,
        { asignaturas: asignaturasSelect },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchProfesores();
        closeModal();
      })
      .catch((err) => console.error("Error al guardar asignaturas:", err));
  };

  const handleDeleteClick = () => setConfirmDeleteVisible(true);

  const confirmDelete = () => {
    if (!selectedProfesor) return;
    const token = localStorage.getItem("token");

    axios
      .delete(`http://localhost:5000/profesores/${selectedProfesor._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        fetchProfesores();
        closeModal();
      })
      .catch((err) => console.error("Error al eliminar profesor:", err));
  };

  const cancelDelete = () => setConfirmDeleteVisible(false);

  const primerNombre = user?.nombre ? user.nombre.split(" ")[0] : "";

  const sections = [
    { id: "home", label: "INICIO" },
    ...(user?.role === "profesor"
      ? [
          { id: "asistencia", label: "ASISTENCIAS" },
          { id: "justificaciones", label: "JUSTIFICACIONES" },
          { id: "grupo", label: "GRUPO" },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          { id: "profesores", label: "PROFESORES" },
          { id: "grupo", label: "GRUPO" },
        ]
      : []),
  ];

  return (
    <div>
      {/* HEADER */}
      <header className="header" id="header">
        <nav className="nav container">
          <a
            href="#home"
            className="nav-logo"
            onClick={(e) => handleNavClick(e, "home")}
          >
            <img src={logo} alt="logo" className="nav-logo-img" />
          </a>

          <div className="nav-menu" id="nav-menu">
            <ul className="nav-list">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <button
                    className="nav-button nav-link-button"
                    onClick={() =>
                      sec.id === "grupo"
                        ? navigate("/grupo")
                        : handleNavClick(null, sec.id)
                    }
                  >
                    {sec.label}
                  </button>
                </li>
              ))}

              {user && (
                <li>
                  <button
                    className="nav-button nav-link-button"
                    onClick={() => navigate("/horario")}
                  >
                    HORARIO GENERAL
                  </button>
                </li>
              )}

              {user?.role === "admin" && (
                <li>
                  <button
                    className="nav-button nav-link-button"
                    onClick={() => navigate("/register-profesor")}
                  >
                    REGISTRAR PROFESOR
                  </button>
                </li>
              )}

              {user ? (
                <li className="nav-profile">
                  <img
                    src={profileImgUrl(user.foto)}
                    alt="Perfil"
                    className="profile-img-small"
                    onClick={() => navigate("/perfil")}
                  />
                </li>
              ) : (
                <li>
                  <button
                    className="nav-button nav-link-button"
                    onClick={() => navigate("/login")}
                  >
                    INICIAR SESIÓN
                  </button>
                </li>
              )}
            </ul>

            <div className="nav-close" id="nav-close">
              <i className="fas fa-times"></i>
            </div>
          </div>

          <div className="nav-toggle" id="nav-toggle">
            <i className="fas fa-th-large"></i>
          </div>
        </nav>
      </header>

      {/* HOME */}
      <section className="home section" id="home">
        <div className="home-container container grid">
          <div className="home-data">
            <h1 className="home-title">
              {user ? (
                <>
                  Bienvenido{" "}
                  <span className="user-name-gold">{primerNombre}</span> al
                  sistema de <span>asistencia</span>
                </>
              ) : (
                <>
                  Bienvenido al sistema de <span>asistencia</span>
                </>
              )}
            </h1>
            {!user && (
              <p>Por favor inicia sesión para acceder a todas las funciones.</p>
            )}
          </div>
        </div>
      </section>

      {/* PROFESORES ADMIN */}
      {user?.role === "admin" && (
        <section className="profesores section" id="profesores">
          <center>
            <h2>Perfiles de Profesores</h2>
          </center>
          <table className="profesores-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Asignaturas</th>
                <th>Fecha de Registro</th>
                <th>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {profesores.map((prof) => (
                <tr key={prof._id}>
                  <td>{prof.nombre}</td>
                  <td>{prof.asignaturas?.join(", ") || "No asignada"}</td>
                  <td>{prof.fechaRegistro}</td>
                  <td>
                    <button onClick={() => openModal(prof)}>Ver perfil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* MODAL PROFESOR */}
      {modalVisible && selectedProfesor && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              X
            </button>
            <h3>{selectedProfesor.nombre}</h3>
            <img
              src={profileImgUrl(selectedProfesor.foto)}
              alt={selectedProfesor.nombre}
              className="profile-img-modal"
            />
            <p>
              <b>Correo:</b> {selectedProfesor.email}
            </p>
            <p>
              <b>Celular:</b> {selectedProfesor.celular}
            </p>
            <p>
              <b>Edad:</b> {selectedProfesor.edad}
            </p>
            <p>
              <b>Sexo:</b> {selectedProfesor.sexo}
            </p>
            <p>
              <b>Asignaturas:</b>
            </p>
            <div className="checkbox-group">
              {materias.map((m) => (
                <label key={m}>
                  <input
                    type="checkbox"
                    value={m}
                    checked={asignaturasSelect.includes(m)}
                    onChange={() => handleAsignaturasChange(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
            <button onClick={guardarAsignaturas} style={{ marginTop: "10px" }}>
              Guardar asignaturas
            </button>

            <button
              onClick={handleDeleteClick}
              style={{
                marginTop: "10px",
                backgroundColor: "red",
                color: "white",
              }}
            >
              Eliminar profesor
            </button>

            {confirmDeleteVisible && (
              <div className="mini-alert">
                <p>
                  ¿Seguro que deseas eliminar a {selectedProfesor.nombre}?
                </p>
                <div className="mini-alert-buttons">
                  <button className="mini-alert-yes" onClick={confirmDelete}>
                    Sí
                  </button>
                  <button className="mini-alert-no" onClick={cancelDelete}>
                    No
                  </button>
                </div>
              </div>
            )}

            <p>
              <b>Fecha de registro:</b> {selectedProfesor.fechaRegistro}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
