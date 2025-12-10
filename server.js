const express = require("express");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* ====== BD en memoria (SE BORRA SOLO SI REINICIA RENDER) ====== */
let usuarios = [];          // usuarios verificados
let verificaciones = {};    // correos esperando verificación
let reportes = [];          // reportes creados
let sesion = { correo: null, admin: false };

/* ====== RUTAS ====== */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* Registro */
app.post("/registrar", (req, res) => {
  const { correo, clave } = req.body;

  if (usuarios.find(u => u.correo === correo)) {
    return res.send("Este correo ya está registrado. <a href='/'>Volver</a>");
  }

  const codigo = Math.floor(100000 + Math.random() * 900000);
  verificaciones[correo] = { clave, codigo };

  res.send(`
    Tu código de verificación es: <b>${codigo}</b><br>
    <a href="/verificar.html">Verificar cuenta</a>
  `);
});

/* Verificación */
app.post("/verificar", (req, res) => {
  const { correo, codigo } = req.body;
  const ver = verificaciones[correo];

  if (!ver) {
    return res.send("No existe un proceso de registro para este correo.");
  }

  if (String(ver.codigo) === String(codigo)) {
    usuarios.push({ correo, clave: ver.clave });
    delete verificaciones[correo];
    return res.send("Cuenta verificada. <a href='/'>Iniciar sesión</a>");
  }

  res.send("Código incorrecto. <a href='/verificar.html'>Intentar otra vez</a>");
});

/* Login */
app.post("/login", (req, res) => {
  const { correo, clave } = req.body;

  // ADMIN
  if (correo === "admin@dgeti.mx" && clave === "admin123") {
    sesion = { correo, admin: true };
    return res.send("Bienvenido administrador <a href='/panel_admin.html'>Panel</a>");
  }

  const ok = usuarios.find(u => u.correo === correo && u.clave === clave);

  if (ok) {
    sesion = { correo, admin: false };
    return res.send("Sesión iniciada. <a href='/crear_reporte.html'>Crear reporte</a>");
  }

  res.send("Credenciales inválidas. <a href='/'>Volver</a>");
});

/* Crear reporte */
app.post("/crear_reporte", (req, res) => {
  if (!sesion.correo) {
    return res.send("Debes iniciar sesión.");
  }

  const { titulo, descripcion } = req.body;
  reportes.push({ titulo, descripcion, autor: sesion.correo });

  res.send("Reporte creado. <a href='/'>Volver</a>");
});

/* Panel admin */
app.get("/admin/reportes", (req, res) => {
  if (!sesion.admin) {
    return res.send("Acceso solo para administradores.");
  }

  res.json(reportes);
});

/* PUERTO */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor listo en puerto " + PORT));
