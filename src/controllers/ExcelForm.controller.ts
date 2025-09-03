import { Request, Response } from "express";
import { ExcelFormService } from "../services/ExcelForm.service";
import { Types } from "mongoose";

export class ExcelFormController {
  private excelFormService: ExcelFormService;

  constructor() {
    this.excelFormService = new ExcelFormService();

    //bind
    this.createExcelForm = this.createExcelForm.bind(this);
  }

  /**
   * API để tạo và tải xuống file Excel.
   * @param req - Request chứa dữ liệu để tạo file Excel.
   * @param res - Response để gửi file Excel về FE.
   */
  async createExcelForm(req: Request, res: Response): Promise<void> {
    try {
      // Map request data từ FE
      const requestData = {
        deploymentType: req.body.deploymentType,
        categoryId: new Types.ObjectId(req.body._id), // FE gửi _id là categoryId
        userCount: req.body.userCount,
        pointCount: req.body.pointCount,
        cameraCount: req.body.cameraCount,
        selectedFeatures: req.body.selectedFeatures || [], // Nhận selectedFeatures
        iconKey: req.body.iconKey, // Nhận iconKey để xác định loại service
      };

      const result = await this.excelFormService.generateExcel(requestData);

      res.status(201).json({
        success: true,
        data: result,
        message: "Tạo báo giá excel thành công",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Lỗi khi tạo báo giá excel",
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }
}
