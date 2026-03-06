import { Request, Response } from "express";
import * as conceptoService from "../services/concepto.service.js";

export const getAll = async (req: Request, res: Response) => {
  try {
    const conceptos = await conceptoService.getConceptos();
    res.json(conceptos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const nuevoConcepto = await conceptoService.crearConcepto(req.body);
    res.status(201).json(nuevoConcepto);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await conceptoService.eliminarConcepto(id);
    res.json({ mensaje: "Concepto eliminado correctamente" });
  } catch (error: any) {
    // Si da error acá, probablemente sea porque ya hay deudas asignadas a este concepto
    // (Por la restricción ON DELETE RESTRICT que le pusimos en la BD)
    if (error.code === "23503") {
      return res.status(400).json({
        message:
          "No podés borrar este concepto porque ya hay beneficiarios con esta deuda.",
      });
    }
    res.status(500).json({ error: error.message });
  }
};

export const asignar = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const cantidadGenerada =
      await conceptoService.asignarConceptoABeneficiarios(id);

    res.json({
      mensaje: "Cargos generados correctamente",
      cantidad: cantidadGenerada,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
