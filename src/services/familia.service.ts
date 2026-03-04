import pool from "../config/db.js";
import { Familia } from "../models/familia.model.js";

// GET ALL con Buscador opcional (?q=...)
export const getAll = async (searchQuery?: string): Promise<Familia[]> => {
  let query = "SELECT * FROM familias";
  const params: any[] = [];

  if (searchQuery) {
    query += " WHERE apellido_familia ILIKE $1";
    params.push(`%${searchQuery}%`);
  }

  query += " ORDER BY apellido_familia ASC";
  const { rows } = await pool.query(query, params);
  return rows;
};

export const getById = async (id: number): Promise<Familia | null> => {
  const { rows } = await pool.query(
    "SELECT * FROM familias WHERE id_familia = $1",
    [id],
  );
  return rows.length ? rows[0] : null;
};

export const create = async (data: Familia): Promise<Familia> => {
  const {
    apellido_familia,
    nombre_padre,
    nombre_madre,
    telefono_padre,
    telefono_madre,
    email,
    direccion,
  } = data;
  const query = `
    INSERT INTO familias (apellido_familia, nombre_padre, nombre_madre, telefono_padre, telefono_madre, email, direccion)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
  const { rows } = await pool.query(query, [
    apellido_familia,
    nombre_padre,
    nombre_madre,
    telefono_padre,
    telefono_madre,
    email,
    direccion,
  ]);
  return rows[0];
};

export const update = async (
  id: number,
  data: Partial<Familia>,
): Promise<Familia | null> => {
  const {
    apellido_familia,
    nombre_padre,
    nombre_madre,
    telefono_padre,
    telefono_madre,
    email,
    direccion,
  } = data;
  const query = `
    UPDATE familias 
    SET apellido_familia = $1, nombre_padre = $2, nombre_madre = $3, telefono_padre = $4, telefono_madre = $5, email = $6, direccion = $7
    WHERE id_familia = $8 RETURNING *`;
  const { rows } = await pool.query(query, [
    apellido_familia,
    nombre_padre,
    nombre_madre,
    telefono_padre,
    telefono_madre,
    email,
    direccion,
    id,
  ]);
  return rows.length ? rows[0] : null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query(
    "DELETE FROM familias WHERE id_familia = $1",
    [id],
  );
  return (rowCount ?? 0) > 0;
};
