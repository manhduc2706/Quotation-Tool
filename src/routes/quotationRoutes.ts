import { Router } from "express";
import { QuotationController } from "../controllers/Quotation.controller";

const router = Router();
const quotationController = new QuotationController();

// Basic CRUD routes
router.post("/", quotationController.createQuotation); // Tạo mới báo giá
// router.get("/", quotationController.getAllQuotations); // Lấy tất cả báo giá
// router.get("/:id", quotationController.getQuotationById); // Lấy báo giá theo ID
// router.put("/:id", quotationController.updateQuotation); // Cập nhật báo giá theo ID
// router.delete("/:id", quotationController.deleteQuotation); // Xóa báo giá theo ID

export default router;
