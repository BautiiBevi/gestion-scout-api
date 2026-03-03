const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // Para que Node entienda los datos que le mande Angular

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡API del Grupo Scout funcionando perfecto!');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});