import { Router } from "express";
import { FileController } from "../controllers/File.controller";

const router = Router();
const fileController = new FileController();

router.post("/", fileController.create);

export default router;
