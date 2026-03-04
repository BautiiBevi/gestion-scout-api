import pool from "../config/db.js";
import { Beneficiario } from "../models/beneficiario.model.js";

export const getAll = async (): Promise<Beneficiario[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM beneficiarios ORDER BY apellido ASC",
  );
  return rows;
};

export const getById = async (id: number): Promise<Beneficiario | null> => {
  const { rows } = await pool.query(
    "SELECT * FROM beneficiarios WHERE id_beneficiario = $1",
    [id],
  );
  return rows.length ? rows[0] : null;
};

export const create = async (data: Beneficiario): Promise<Beneficiario> => {
  const { id_familia, nombre, apellido, dni, fecha_nacimiento, rama_actual } =
    data;

  try {
    const { rows } = await pool.query(
      `INSERT INTO beneficiarios (id_familia, nombre, apellido, dni, fecha_nacimiento, rama_actual) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id_familia, nombre, apellido, dni, fecha_nacimiento, rama_actual],
    );
    return rows[0];
  } catch (error: any) {
    if (error.code === "23503") {
      throw new Error(
        "La familia especificada no existe. Creá la familia primero.",
      );
    }
    throw error;
  }
};

export const update = async (
  id: number,
  data: Partial<Beneficiario>,
): Promise<Beneficiario | null> => {
  const { nombre, apellido, dni, fecha_nacimiento, rama_actual, id_familia } =
    data; // 👈 Asegurate de recibir id_familia

  const query = `
    UPDATE beneficiarios 
    SET 
      nombre = $1, 
      apellido = $2, 
      dni = $3, 
      fecha_nacimiento = $4, 
      rama_actual = $5,
      id_familia = $6 
    WHERE id_beneficiario = $7 
    RETURNING *`;

  const values = [
    nombre,
    apellido,
    dni,
    fecha_nacimiento,
    rama_actual,
    id_familia,
    id,
  ];

  const { rows } = await pool.query(query, values);
  return rows.length ? rows[0] : null;
};

export const remove = async (id: number): Promise<void> => {
  await pool.query("DELETE FROM beneficiarios WHERE id_beneficiario = $1", [
    id,
  ]);
};
