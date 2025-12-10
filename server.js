
const express=require("express");
const fs=require("fs");
const path=require("path");
const app=express();
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

let sesion={correo:null, admin:false};

function leerDB(){
  return JSON.parse(fs.readFileSync("./data/db.json","utf8"));
}
function guardarDB(db){
  fs.writeFileSync("./data/db.json", JSON.stringify(db,null,2));
}

app.get("/",(req,res)=>{
  res.sendFile(path.join(__dirname,"public/index.html"));
});

app.post("/registrar",(req,res)=>{
  const db=leerDB();
  const {correo, clave}=req.body;
  if(db.usuarios.find(u=>u.correo===correo)){
    return res.send("Correo ya registrado <a href='/'>Volver</a>");
  }
  const codigo=Math.floor(100000+Math.random()*900000);
  db.verificaciones[correo]= {clave, codigo};
  guardarDB(db);
  res.send("Tu código de verificación es: "+codigo+"<br><a href='/verificar.html'>Verificar</a>");
});

app.post("/verificar",(req,res)=>{
  const db=leerDB();
  const {correo, codigo}=req.body;
  const ver=db.verificaciones[correo];
  if(!ver) return res.send("No existe registro. <a href='/'>Volver</a>");
  if(ver.codigo===codigo){
    db.usuarios.push({correo, clave:ver.clave});
    delete db.verificaciones[correo];
    guardarDB(db);
    res.send("Cuenta verificada. <a href='/'>Iniciar sesión</a>");
  } else res.send("Código incorrecto.");
});

app.post("/login",(req,res)=>{
  const db=leerDB();
  const {correo, clave}=req.body;
  if(correo==="admin@dgeti.mx" && clave==="admin123"){
    sesion={correo, admin:true};
    return res.send("Bienvenido administrador <a href='/panel_admin.html'>Panel</a>");
  }
  const ok=db.usuarios.find(u=>u.correo===correo && u.clave===clave);
  if(ok){
    sesion={correo, admin:false};
    res.send("Sesión iniciada. <a href='/crear_reporte.html'>Crear reporte</a>");
  } else res.send("Credenciales incorrectas.");
});

app.post("/crear_reporte",(req,res)=>{
  if(!sesion.correo) return res.send("Debe iniciar sesión.");
  const {titulo, descripcion}=req.body;
  const db=leerDB();
  db.reportes.push({titulo, descripcion, autor:sesion.correo});
  guardarDB(db);
  res.send("Reporte creado. <a href='/'>Inicio</a>");
});

app.get("/admin/reportes",(req,res)=>{
  if(!sesion.admin) return res.send("Solo admin.");
  const db=leerDB();
  res.json(db.reportes);
});

app.listen(3000,()=>console.log("Listo en http://localhost:3000"));
