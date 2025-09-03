import {
  QuotationRepository,
  CreateQuotationData,
  OutPutQuotationData,
} from "../repositories/Quotation.repository";
import { IQuotation } from "../models/Quotation.model";

export class QuotationService {
  private quotationRepository: QuotationRepository;

  constructor() {
    this.quotationRepository = new QuotationRepository();
  }

  /**
   * Tạo mới một báo giá.
   * @param data - Dữ liệu từ FE bao gồm deploymentType, categoryId, userCount, pointCount.
   * @returns Báo giá đã được tạo.
   */
  async createQuotation(
    data: CreateQuotationData
  ): Promise<OutPutQuotationData> {
    // Validate input
    if (!data.categoryId || !data.pointCount || !data.deploymentType) {
      throw new Error("Thiếu thông tin bắt buộc để tạo báo giá");
    }

    if (data.pointCount <= 0) {
      throw new Error("Số lượng vị trí phải lớn hơn 0");
    }

    // Chỉ validate userCount khi không phải securityAlert
    if (data.iconKey !== "securityAlert") {
      if (!data.userCount || data.userCount <= 0) {
        throw new Error("Số lượng user phải lớn hơn 0");
      }
    }

    // Validate selectedFeatures cho securityAlert
    if (data.iconKey === "securityAlert") {
      if (!data.selectedFeatures || data.selectedFeatures.length === 0) {
        throw new Error("Vui lòng chọn ít nhất một tính năng cho cảnh báo an ninh");
      }
    }

    return await this.quotationRepository.create(data);
  }

//   /**
//    * Lấy tất cả các báo giá.
//    * @returns Danh sách báo giá.
//    */
//   async getAllQuotations(): Promise<IQuotation[]> {
//     return await this.quotationRepository.findAll();
//   }

//   /**
//    * Lấy báo giá theo ID.
//    * @param id - ID của báo giá.
//    * @returns Báo giá hoặc null nếu không tìm thấy.
//    */
//   async getQuotationById(id: string): Promise<IQuotation | null> {
//     return await this.quotationRepository.findById(id);
//   }

//   /**
//    * Cập nhật báo giá theo ID.
//    * @param id - ID của báo giá.
//    * @param updateData - Dữ liệu cần cập nhật.
//    * @returns Báo giá sau khi cập nhật hoặc null nếu không tìm thấy.
//    */
//   async updateQuotation(
//     id: string,
//     updateData: Partial<IQuotation>
//   ): Promise<IQuotation | null> {
//     return await this.quotationRepository.update(id, updateData);
//   }

//   /**
//    * Xóa báo giá theo ID.
//    * @param id - ID của báo giá.
//    * @returns `true` nếu xóa thành công, `false` nếu không tìm thấy.
//    */
//   async deleteQuotation(id: string): Promise<boolean> {
//     return await this.quotationRepository.delete(id);
//   }
}


