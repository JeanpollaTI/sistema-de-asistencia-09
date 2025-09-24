import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Horario.css";

import logoAgs from "./Ags.png";
import logoDerecho from "./Logoescuela.png";

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const horas = [1, 2, 3, 4, 5, 6, 7];
const paletaColores = [
  "#f44336","#e91e63","#9c27b0","#673ab7",
  "#3f51b5","#2196f3","#03a9f4","#00bcd4",
  "#009688","#4caf50","#8bc34a","#cddc39",
  "#ffeb3b","#ffc107","#ff9800","#ff5722"
];

function Horario({ user }) {
  const [profesores, setProfesores] = useState([]);
  const [horario, setHorario] = useState({});
  const [anio, setAnio] = useState("2025-2026");
  const [mostrarPaleta, setMostrarPaleta] = useState(false);
  const [colorSeleccionado, setColorSeleccionado] = useState("#f44336");
  const [leyenda, setLeyenda] = useState({});
  const [modoBorrador, setModoBorrador] = useState(false);
  const [pdfHorario, setPdfHorario] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const fileInputRef = useRef(null);

  const mostrarAlerta = (mensaje, tipo = "success") => {
    setAlerta({ mensaje, tipo });
    setTimeout(() => setAlerta(null), 3000);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("http://localhost:5000/auth/profesores", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data)) setProfesores(res.data);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`http://localhost:5000/horario/${anio}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data?.datos) setHorario(res.data.datos);
      if (res.data?.leyenda) setLeyenda(res.data.leyenda);
      if (res.data?.pdfUrl) setPdfHorario(res.data.pdfUrl);
    }).catch(console.error);
  }, [anio, profesores]);

  const generarHorarioVacio = () => {
    const nuevoHorario = {};
    profesores.forEach(prof => {
      nuevoHorario[prof.nombre] = {};
      dias.forEach(d => {
        horas.forEach(h => {
          nuevoHorario[prof.nombre][`General-${d}-${h}`] = { text: "", color: "transparent" };
        });
      });
    });
    setHorario(nuevoHorario);
    mostrarAlerta("Horario limpiado correctamente ✅", "success");
  };

  const handleCellChange = (profesor, asignatura, dia, hora, value) => {
    if (user.role !== "admin") return;
    setHorario(prev => {
      const profesorHorario = prev[profesor] || {};
      const clave = `${asignatura}-${dia}-${hora}`;
      const celdaExistente = profesorHorario[clave] || { text: "", color: "transparent" };
      return {
        ...prev,
        [profesor]: { ...profesorHorario, [clave]: { ...celdaExistente, text: value } }
      };
    });
  };

  const pintarHora = (profesor, asignatura, dia, hora) => {
    if (user.role !== "admin") return;
    if (!mostrarPaleta && !modoBorrador) return;
    const nuevoColor = modoBorrador ? "transparent" : colorSeleccionado;
    setHorario(prev => {
      const profesorHorario = prev[profesor] || {};
      const clave = `${asignatura}-${dia}-${hora}`;
      const celdaExistente = profesorHorario[clave] || { text: "", color: "transparent" };
      return {
        ...prev,
        [profesor]: { ...profesorHorario, [clave]: { ...celdaExistente, color: nuevoColor } }
      };
    });
    if (!modoBorrador && !leyenda[colorSeleccionado]) {
      setLeyenda(prev => ({ ...prev, [colorSeleccionado]: "" }));
    }
  };

  const eliminarLeyenda = color => {
    setLeyenda(prev => {
      const copia = { ...prev };
      delete copia[color];
      return copia;
    });
    mostrarAlerta("Color eliminado de la leyenda ❌", "error");
  };

  const getBase64Image = imgPath => new Promise(resolve => {
    const img = new Image();
    img.src = imgPath;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
  });

  const exportarPDF = async () => {
    const doc = new jsPDF("landscape");
    const logoAgsBase64 = await getBase64Image(logoAgs);
    const logoDerBase64 = await getBase64Image(logoDerecho);

    doc.addImage(logoAgsBase64, "PNG", 10, 5, 40, 16);
    doc.addImage(logoDerBase64, "PNG", 260, 5, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ESCUELA SECUNDARIA GENERAL, No. 9", 148, 15, { align: "center" });
    doc.text("“AMADO NERVO”", 148, 22, { align: "center" });
    doc.text(`HORARIO GENERAL ${anio}`, 148, 29, { align: "center" });

    const tabla = document.querySelector(".horario-table").cloneNode(true);
    tabla.style.position = "absolute";
    tabla.style.left = "-9999px";
    document.body.appendChild(tabla);

    tabla.querySelectorAll("input").forEach(input => {
      const span = document.createElement("span");
      span.textContent = input.value;
      span.style.display = "inline-block";
      span.style.width = input.offsetWidth + "px";
      span.style.height = input.offsetHeight + "px";
      span.style.lineHeight = input.offsetHeight + "px";
      input.parentNode.replaceChild(span, input);
    });

    const canvas = await html2canvas(tabla, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    document.body.removeChild(tabla);

    const pdfWidth = doc.internal.pageSize.getWidth() - 20;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    doc.addImage(imgData, "PNG", 10, 35, pdfWidth, pdfHeight);

    if (Object.keys(leyenda).length > 0) {
      let leyendaY = 35 + pdfHeight + 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Leyenda:", 10, leyendaY);
      leyendaY += 5;
      Object.entries(leyenda).forEach(([color, desc]) => {
        doc.setFillColor(color);
        doc.rect(10, leyendaY, 6, 6, "F");
        doc.setTextColor(0);
        doc.text(desc || "", 18, leyendaY + 5);
        leyendaY += 8;
      });
    }

    doc.save(`Horario_${anio}.pdf`);
    mostrarAlerta("PDF exportado correctamente 📄✅", "success");
  };

  const guardarHorario = async () => {
    if (user.role !== "admin") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("anio", anio);
      formData.append("datos", JSON.stringify(horario));
      formData.append("leyenda", JSON.stringify(leyenda));

      const res = await axios.post("http://localhost:5000/horario", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setPdfHorario(res.data.horario?.pdfUrl || null);
      mostrarAlerta("Horario guardado correctamente ✅", "success");
    } catch (err) {
      console.error(err);
      mostrarAlerta("Error al guardar el horario ❌", "error");
    }
  };

  const abrirExploradorPDF = () => fileInputRef.current.click();

  const handleArchivoChange = async e => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("anio", anio);

    const token = localStorage.getItem("token");
    try {
      const res = await axios.post("http://localhost:5000/horario", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setPdfHorario(res.data.horario?.pdfUrl || null);
      mostrarAlerta("PDF subido correctamente ✅", "success");
    } catch (err) {
      console.error(err);
      mostrarAlerta("Error al subir PDF ❌", "error");
    }
  };

  if (user.role !== "admin" && pdfHorario) {
    return (
      <div className="pdf-viewer-full" style={{ position: "fixed", top: "60px", left: 0, right: 0, bottom: 0, overflow: "auto", backgroundColor: "#fff" }}>
        <embed
          src={`http://localhost:5000${pdfHorario}#toolbar=0&navpanes=0&scrollbar=0`}
          type="application/pdf"
          width="100%"
          height="100%"
          style={{ border: "none", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div className="horario-page">
      {alerta && <div className={`alerta ${alerta.tipo}`}>{alerta.mensaje}</div>}

      <div className="titulo-anio">
        {user.role === "admin" ? (
          <input type="text" value={anio} onChange={e => setAnio(e.target.value)} className="anio-input" />
        ) : <h2>{anio}</h2>}
      </div>

      {user.role === "admin" && (
        <div className="admin-panel">
          <button className={`btn-add ${modoBorrador ? "activo" : ""}`} onClick={() => setModoBorrador(!modoBorrador)}>🧹 Borrador</button>
          <button className="btn-add" onClick={() => setMostrarPaleta(!mostrarPaleta)}>🖌 Pincel</button>
          {mostrarPaleta && (
            <div className="paleta-colores">
              {paletaColores.map(c => (
                <div key={c} className="color-cuadro" style={{ backgroundColor: c }} onClick={() => { setColorSeleccionado(c); setModoBorrador(false); }} />
              ))}
            </div>
          )}
          <button onClick={generarHorarioVacio} className="btn-add">Limpiar Horario</button>
          <button onClick={guardarHorario} className="btn-add">💾 Guardar horario</button>
          <button onClick={exportarPDF} className="btn-add">📄 Exportar PDF</button>
          <button onClick={abrirExploradorPDF} className="btn-add">⬆️ Subir PDF Horario</button>
          <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }} onChange={handleArchivoChange} />
        </div>
      )}

      {user.role === "admin" && (
        <table className="horario-table">
          <thead>
            <tr>
              <th>Profesor</th>
              <th>Asignaturas</th>
              {dias.map(d => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {profesores.map(prof => (
              <tr key={prof._id}>
                <td>{prof.nombre}</td>
                <td>{(prof.asignaturas || ["General"]).join(", ")}</td>
                {dias.map(d => (
                  <td key={`${prof._id}-${d}`}>
                    <div className="horas-row-horizontal">
                      {horas.map(h => {
                        const cell = horario?.[prof.nombre]?.[`General-${d}-${h}`] || { text: "", color: "transparent" };
                        return (
                          <div key={`${d}-${h}`} className="hora-box-horizontal" style={{ backgroundColor: cell.color === "transparent" ? "#fff" : cell.color }}
                            onClick={() => pintarHora(prof.nombre, "General", d, h)}>
                            <div className="hora-num">{h}</div>
                            <input type="text" maxLength={4} value={cell.text} onChange={e => handleCellChange(prof.nombre, "General", d, h, e.target.value)} />
                          </div>
                        );
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {user.role === "admin" && Object.keys(leyenda).length > 0 && (
        <div className="leyenda">
          <h3>Leyenda</h3>
          <div className="leyenda-colores">
            {Object.entries(leyenda).map(([color, significado]) => (
              <div key={color} className="leyenda-item">
                <div className="color-cuadro-leyenda" style={{ backgroundColor: color }} />
                <input type="text" placeholder="Significado" value={significado} onChange={e => setLeyenda(prev => ({ ...prev, [color]: e.target.value }))} />
                <button className="btn-add" onClick={() => eliminarLeyenda(color)}>❌</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Horario;
