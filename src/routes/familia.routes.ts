import { Router } from "express";
import * as familiaController from "../controllers/familia.controller.js";

const router = Router();

router.get("/", familiaController.getFamilias);
router.get("/:id", familiaController.getFamiliaById);
router.post("/", familiaController.postFamilia);
router.put("/:id", familiaController.putFamilia);
router.delete("/:id", familiaController.deleteFamilia);

export default router;
