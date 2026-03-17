import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { enviarMailBienvenida } from "./mailer.service.js";

const generarPasswordRandom = () => Math.random().toString(36).slice(-8);

export const crearDirigente = async (data: any) => {
  const { nombre, apellido, dni, email, rol } = data;

  const passwordProvisoria = generarPasswordRandom();
  const passwordEncriptada = await bcrypt.hash(passwordProvisoria, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, dni, email, password, rol, debe_cambiar_password) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id_usuario, nombre, email`,
      [nombre, apellido, dni, email, passwordEncriptada, rol],
    );

    // 👇 EL SALVAVIDAS: Intentamos mandar el mail, pero si falla, no rompemos todo
    try {
      // Le sacamos el "await" para que se mande de fondo (fire-and-forget)
      // y responda al frontend al instante sin esperar a Gmail.
      enviarMailBienvenida(email, nombre, passwordProvisoria).catch((err) => {
        console.error(
          "⚠️ Usuario creado, pero Gmail rechazó el envío del correo:",
          err,
        );
      });
    } catch (mailError) {
      console.error("⚠️ Error al intentar conectar con el servicio de correo");
    }

    return rows[0];
  } catch (error: any) {
    if (error.code === "23505") throw new Error("El DNI o Email ya existen.");
    throw error;
  }
};
