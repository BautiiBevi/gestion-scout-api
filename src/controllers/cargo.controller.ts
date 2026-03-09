import { Request, Response } from "express";
import * as cargoService from "../services/cargo.service.js";
import { AuthRequest } from "../middlewares/auth.middleware.js";

export const getByBeneficiario = async (req: Request, res: Response) => {
  try {
    const idBeneficiario = Number(req.params.idBeneficiario);
    const cargos = await cargoService.getCargosPorBeneficiario(idBeneficiario);
    res.json(cargos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const pagar = async (req: AuthRequest, res: Response) => {
  try {
    const idCargo = Number(req.params.idCargo);
    const { metodoPago } = req.body; // Ej: 'EFECTIVO' o 'TRANSFERENCIA'

    // Sacamos el ID del dirigente que está logueado en este momento
    const idUsuarioCobrador = req.usuario.id;

    const pago = await cargoService.registrarPago(
      idCargo,
      idUsuarioCobrador,
      metodoPago || "EFECTIVO",
    );

    res.json({ mensaje: "Pago registrado con éxito", pago });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createIndividual = async (req: Request, res: Response) => {
  try {
    const { idBeneficiario, idConcepto } = req.body;
    const nuevoCargo = await cargoService.crearCargoIndividual(
      idBeneficiario,
      idConcepto,
    );
    res.status(201).json(nuevoCargo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const pagarMultiples = async (req: any, res: Response) => {
  try {
    const { ids, metodoPago } = req.body;
    const idUsuarioCobrador = req.usuario.id;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "Se requiere un array de IDs" });
    }

    await cargoService.registrarPagoMultiple(
      ids,
      idUsuarioCobrador,
      metodoPago,
    );
    res.json({ mensaje: "Cobro múltiple realizado con éxito" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
