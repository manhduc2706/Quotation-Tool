import { Workbook } from "exceljs";
import { Response } from "express";
import { CreateQuotationData } from "../repositories/Quotation.repository";
import { ExcelForm } from "../models/ExcelForm.model";
import { ExcelFormRepository } from "../repositories/ExcelForm.repository";

export class ExcelFormService {
  private excelFormRepository: ExcelFormRepository;

  constructor() {
    this.excelFormRepository = new ExcelFormRepository();
  }
  /**
   * Tạo file Excel từ dữ liệu đầu vào.
   * @param data - Dữ liệu để tạo file Excel.
   * @param res - Đối tượng Response để gửi file Excel về FE.
   */
  async generateExcel(data: CreateQuotationData): Promise<ExcelForm> {
    return await this.excelFormRepository.createExcelForm(data);
  }
}
