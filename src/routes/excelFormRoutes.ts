import { Router } from "express";
import { ExcelFormController } from "../controllers/ExcelForm.controller";

const router = Router();
const excelFormController = new ExcelFormController();

/**
 * Định nghĩa route để tải xuống file Excel.
 * POST /api/excel/download
 */
router.post("/", excelFormController.createExcelForm);

export default router;
