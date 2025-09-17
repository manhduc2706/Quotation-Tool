import { Router } from "express";
import { QuotationController } from "../controllers/Quotation.controller";

const router = Router();
const quotationController = new QuotationController();

// Basic CRUD routes
router.post("/", quotationController.createQuotation); // Tạo mới báo giá
router.post("/createExcel", quotationController.downloadExcelForm);
export default router;
