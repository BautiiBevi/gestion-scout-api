import pool from "../config/db.js";

// 1. TRAER LA CUENTA CORRIENTE DE UN BENEFICIARIO
export const getCargosPorBeneficiario = async (idBeneficiario: number) => {
  const query = `
    SELECT 
      c.id_cargo, c.monto_final, c.estado, c.fecha_creacion as fecha_cargo,
      con.nombre as concepto_nombre, con.fecha_vencimiento,
      p.fecha_pago, p.metodo_pago,
      u.nombre as cobrador_nombre, u.apellido as cobrador_apellido
    FROM cargos c
    JOIN conceptos_cobro con ON c.id_concepto = con.id_concepto
    LEFT JOIN pagos p ON c.id_cargo = p.id_cargo
    LEFT JOIN usuarios u ON p.id_usuario_cobrador = u.id_usuario
    WHERE c.id_beneficiario = $1
    ORDER BY 
      CASE WHEN c.estado = 'PENDIENTE' THEN 1 ELSE 2 END, -- Los pendientes arriba
      con.fecha_vencimiento ASC;
  `;
  const { rows } = await pool.query(query, [idBeneficiario]);
  return rows;
};

// 2. REGISTRAR UN PAGO (Con Transacción Segura)
export const registrarPago = async (
  idCargo: number,
  idUsuarioCobrador: number,
  metodoPago: string,
) => {
  const client = await pool.connect(); // Usamos un cliente específico para la transacción

  try {
    await client.query("BEGIN"); // Arranca la operación segura

    // 1. Verificamos cuánto debe y si ya está pagado (para evitar cobros dobles)
    const { rows: cargo } = await client.query(
      "SELECT monto_final, estado FROM cargos WHERE id_cargo = $1",
      [idCargo],
    );

    if (cargo.length === 0) throw new Error("Cargo no encontrado");
    if (cargo[0].estado === "PAGADO")
      throw new Error("Este cargo ya se encuentra pagado");

    const monto = cargo[0].monto_final;

    // 2. Actualizamos el estado de la deuda a PAGADO
    await client.query(
      "UPDATE cargos SET estado = 'PAGADO' WHERE id_cargo = $1",
      [idCargo],
    );

    // 3. Insertamos el recibo en la tabla de pagos
    const { rows: nuevoPago } = await client.query(
      `INSERT INTO pagos (id_cargo, monto_pagado, metodo_pago, id_usuario_cobrador) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [idCargo, monto, metodoPago, idUsuarioCobrador],
    );

    await client.query("COMMIT"); // ¡Si todo salió bien, guardamos los cambios!
    return nuevoPago[0];
  } catch (error) {
    await client.query("ROLLBACK"); // Si algo falló, deshacemos todo
    throw error;
  } finally {
    client.release(); // Devolvemos la conexión
  }
};

export const crearCargoIndividual = async (
  idBeneficiario: number,
  idConcepto: number,
) => {
  // 1. Buscamos el monto del concepto para copiarlo al cargo
  const { rows: concepto } = await pool.query(
    "SELECT monto_base FROM conceptos_cobro WHERE id_concepto = $1",
    [idConcepto],
  );

  if (concepto.length === 0) throw new Error("Concepto no encontrado");

  // 2. Creamos la deuda (cargo)
  const { rows } = await pool.query(
    `INSERT INTO cargos (id_beneficiario, id_concepto, monto_final, estado) 
     VALUES ($1, $2, $3, 'PENDIENTE') RETURNING *`,
    [idBeneficiario, idConcepto, concepto[0].monto_base],
  );

  return rows[0];
};

export const registrarPagoMultiple = async (
  idsCargos: number[],
  idUsuarioCobrador: number,
  metodoPago: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // Iniciamos la transacción

    for (const id of idsCargos) {
      // 1. Verificamos que el cargo exista y no esté pagado
      const { rows: cargo } = await client.query(
        "SELECT monto_final, estado FROM cargos WHERE id_cargo = $1",
        [id],
      );

      if (cargo.length === 0) continue; // Si no existe, pasamos al siguiente
      if (cargo[0].estado === "PAGADO") continue; // Si ya está pago, lo salteamos

      const monto = cargo[0].monto_final;

      // 2. Actualizamos el estado del cargo
      await client.query(
        "UPDATE cargos SET estado = 'PAGADO' WHERE id_cargo = $1",
        [id],
      );

      // 3. Registramos el pago individual en el historial
      await client.query(
        `INSERT INTO pagos (id_cargo, monto_pagado, metodo_pago, id_usuario_cobrador) 
         VALUES ($1, $2, $3, $4)`,
        [id, monto, metodoPago, idUsuarioCobrador],
      );
    }

    await client.query("COMMIT"); // Guardamos todos los cambios de una
    return { mensaje: "Todos los pagos fueron registrados" };
  } catch (error) {
    await client.query("ROLLBACK"); // Si algo falló, deshacemos TODO
    throw error;
  } finally {
    client.release();
  }
};
