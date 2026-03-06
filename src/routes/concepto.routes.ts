import { Router } from "express";
import {
  getAll,
  create,
  remove,
  asignar,
} from "../controllers/concepto.controller.js";
import { verificarToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas protegidas
router.get("/", verificarToken, getAll);
router.post("/", verificarToken, create);
router.post("/:id/asignar", verificarToken, asignar); // <-- NUEVA RUTA
router.delete("/:id", verificarToken, remove);

export default router;
