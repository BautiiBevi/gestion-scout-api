import pool from "../config/db.js";

// TRAER TODOS LOS CONCEPTOS
export const getConceptos = async () => {
  // Los ordenamos por fecha de creación, los más nuevos primero
  const { rows } = await pool.query(
    "SELECT * FROM conceptos_cobro ORDER BY fecha_creacion DESC",
  );
  return rows;
};

// CREAR UN NUEVO CONCEPTO
export const crearConcepto = async (data: any) => {
  const { nombre, monto_base, alcance, fecha_vencimiento } = data;

  const { rows } = await pool.query(
    `INSERT INTO conceptos_cobro (nombre, monto_base, alcance, fecha_vencimiento) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, monto_base, alcance, fecha_vencimiento || null],
  );

  return rows[0];
};

// ELIMINAR UN CONCEPTO (Solo si te equivocaste al crearlo)
export const eliminarConcepto = async (id: number) => {
  await pool.query("DELETE FROM conceptos_cobro WHERE id_concepto = $1", [id]);
};

export const asignarConceptoABeneficiarios = async (idConcepto: number) => {
  // 1. Buscamos la info del concepto
  const { rows: conceptos } = await pool.query(
    "SELECT monto_base, alcance FROM conceptos_cobro WHERE id_concepto = $1",
    [idConcepto],
  );

  if (conceptos.length === 0) throw new Error("Concepto no encontrado");

  const { monto_base, alcance } = conceptos[0];

  // 2. Insertamos las deudas masivamente (evitando duplicados con el NOT EXISTS)
  const query = `
    INSERT INTO cargos (id_beneficiario, id_concepto, monto_final, estado)
    SELECT id_beneficiario, $1, $2, 'PENDIENTE'
    FROM beneficiarios
    WHERE ($3 = 'GRUPO' OR UPPER(rama_actual) = UPPER($3))
      AND NOT EXISTS (
        SELECT 1 FROM cargos 
        WHERE cargos.id_beneficiario = beneficiarios.id_beneficiario 
          AND cargos.id_concepto = $1
      )
    RETURNING id_cargo;
  `;

  const { rows: cargosGenerados } = await pool.query(query, [
    idConcepto,
    monto_base,
    alcance,
  ]);

  return cargosGenerados.length; // Devolvemos a cuántos chicos se les asignó
};

export const getConceptosDisponiblesParaBeneficiario = async (
  idBeneficiario: number,
) => {
  const query = `
    SELECT * FROM conceptos_cobro 
    WHERE (alcance = 'GRUPO' OR UPPER(alcance) = (
      SELECT UPPER(rama_actual) FROM beneficiarios WHERE id_beneficiario = $1
    ))
    AND id_concepto NOT IN (
      SELECT id_concepto FROM cargos WHERE id_beneficiario = $1
    )
    ORDER BY nombre ASC;
  `;
  const { rows } = await pool.query(query, [idBeneficiario]);
  return rows;
};

export const crearCuotasMasivas = async (data: any) => {
  const { meses, anio, monto_base, alcance, fecha_vencimiento } = data;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const conceptosCreados = [];

    for (const mes of meses) {
      const nombre = `Cuota ${mes} ${anio}`;
      const { rows } = await client.query(
        `INSERT INTO conceptos_cobro (nombre, monto_base, alcance, fecha_vencimiento) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [nombre, monto_base, alcance, fecha_vencimiento || null],
      );
      conceptosCreados.push(rows[0]);
    }

    await client.query("COMMIT");
    return conceptosCreados;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
