import { Router } from "express";
import categoryRoutes from "./categoryRoutes";
import deviceRoutes from "./deviceRoutes";
import licenseRoutes from "./licenseRoutes";
import quotationRoutes from "./quotationRoutes";
import itemDetailRoutes from "./itemDetailRoutes";
import costServerRoutes from "./costServerRoutes";
import excelFormRoutes from "./excelFormRoutes";

const router = Router();

// Mount all routes
router.use("/categories", categoryRoutes);
router.use("/devices", deviceRoutes);
router.use("/costServer", costServerRoutes)
router.use("/licenses", licenseRoutes);
router.use("/itemDetail", itemDetailRoutes);
router.use("/quotations", quotationRoutes);
router.use("excelForm", excelFormRoutes)

export default router;
