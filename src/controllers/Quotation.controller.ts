import { Request, Response } from "express";
import { QuotationService } from "../services/Quotation.service";
import { CreateQuotationData } from "../repositories/Quotation.repository";
import { Types } from "mongoose";
// import * as Types from 'mongoose';

export class QuotationController {
  private quotationService: QuotationService;

  constructor() {
    this.quotationService = new QuotationService();

    // Bind all methods to this context
    this.createQuotation = this.createQuotation.bind(this);
    // this.getAllQuotations = this.getAllQuotations.bind(this);
    // this.getQuotationById = this.getQuotationById.bind(this);
    // this.updateQuotation = this.updateQuotation.bind(this);
    // this.deleteQuotation = this.deleteQuotation.bind(this);
  }

  /**
   * Tạo mới một báo giá.
   * @param req - Request chứa dữ liệu tạo mới.
   * @param res - Response trả về kết quả tạo mới.
   */
  async createQuotation(req: Request, res: Response): Promise<void> {
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

      const result = await this.quotationService.createQuotation(requestData);

      res.status(201).json({
        success: true,
        data: result,
        message: "Tạo báo giá thành công",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Lỗi khi tạo báo giá",
        error: error instanceof Error ? error.message : "Lỗi không xác định",
      });
    }
  }

  //   /**
  //    * Lấy tất cả các báo giá.
  //    * @param req - Request không yêu cầu dữ liệu.
  //    * @param res - Response trả về danh sách báo giá.
  //    */
  //   async getAllQuotations(req: Request, res: Response): Promise<void> {
  //     try {
  //       const quotations = await this.quotationService.getAllQuotations();

  //       res.json({
  //         success: true,
  //         data: quotations,
  //         count: quotations.length,
  //       });
  //     } catch (error) {
  //       res.status(500).json({
  //         success: false,
  //         message: "Lỗi khi lấy danh sách báo giá",
  //         error: error instanceof Error ? error.message : "Lỗi không xác định",
  //       });
  //     }
  //   }

  //   /**
  //    * Lấy một báo giá theo ID.
  //    * @param req - Request chứa ID của báo giá.
  //    * @param res - Response trả về báo giá hoặc lỗi nếu không tìm thấy.
  //    */
  //   async getQuotationById(req: Request, res: Response): Promise<void> {
  //     try {
  //       const { id } = req.params;
  //       const quotation = await this.quotationService.getQuotationById(id);

  //       if (!quotation) {
  //         res.status(404).json({
  //           success: false,
  //           message: "Không tìm thấy báo giá",
  //         });
  //         return;
  //       }

  //       res.json({
  //         success: true,
  //         data: quotation,
  //       });
  //     } catch (error) {
  //       res.status(400).json({
  //         success: false,
  //         message: "Lỗi khi lấy báo giá",
  //         error: error instanceof Error ? error.message : "Lỗi không xác định",
  //       });
  //     }
  //   }

  //   /**
  //    * Cập nhật một báo giá theo ID.
  //    * @param req - Request chứa ID và dữ liệu cập nhật.
  //    * @param res - Response trả về kết quả cập nhật.
  //    */
  //   async updateQuotation(req: Request, res: Response): Promise<void> {
  //     try {
  //       const { id } = req.params;
  //       const updateData = req.body;
  //       const quotation = await this.quotationService.updateQuotation(
  //         id,
  //         updateData
  //       );

  //       if (!quotation) {
  //         res.status(404).json({
  //           success: false,
  //           message: "Không tìm thấy báo giá",
  //         });
  //         return;
  //       }

  //       res.json({
  //         success: true,
  //         data: quotation,
  //         message: "Cập nhật báo giá thành công",
  //       });
  //     } catch (error) {
  //       res.status(400).json({
  //         success: false,
  //         message: "Lỗi khi cập nhật báo giá",
  //         error: error instanceof Error ? error.message : "Lỗi không xác định",
  //       });
  //     }
  //   }

  //   /**
  //    * Xóa một báo giá theo ID.
  //    * @param req - Request chứa ID của báo giá cần xóa.
  //    * @param res - Response trả về kết quả xóa.
  //    */
  //   async deleteQuotation(req: Request, res: Response): Promise<void> {
  //     try {
  //       const { id } = req.params;
  //       const success = await this.quotationService.deleteQuotation(id);

  //       if (!success) {
  //         res.status(404).json({
  //           success: false,
  //           message: "Không tìm thấy báo giá",
  //         });
  //         return;
  //       }

  //       res.json({
  //         success: true,
  //         message: "Xóa báo giá thành công",
  //       });
  //     } catch (error) {
  //       res.status(400).json({
  //         success: false,
  //         message: "Lỗi khi xóa báo giá",
  //         error: error instanceof Error ? error.message : "Lỗi không xác định",
  //       });
  //     }
  //   }
}
