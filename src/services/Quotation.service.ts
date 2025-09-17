import { QuotationRepository } from "../repositories/Quotation.repository";
import * as ExcelJS from "exceljs";
import { CreateQuotationData, OutPutQuotationData } from "../types/quotation";
import path from "path";
import { getLocation } from "../seeds/location";
import axios from "axios";
import { FileModel } from "../models/File.model";
import { minioClient } from "../config/minioClient";

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
        throw new Error(
          "Vui lòng chọn ít nhất một tính năng cho cảnh báo an ninh"
        );
      }
    }

    return await this.quotationRepository.create(data);
  }

  async downloadExcel(input: CreateQuotationData): Promise<Buffer> {
    const quotation = await this.quotationRepository.create(input);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Quotation");

    // ============================
    // Bảng nhỏ phía trên (Thông tin chung)
    // ============================

    // Lấy đường dẫn tuyệt đối đến ảnh
    const logoPath = path.join(__dirname, "../images/LogoCMC.png");

    // Đọc file ảnh và thêm vào workbook
    const logoImage = workbook.addImage({
      filename: logoPath,
      extension: "png", // jpg, jpeg cũng được
    });

    // Thêm ảnh vào sheet (vị trí C1:D5 chẳng hạn)
    // Chèn ảnh vào vùng từ C2 đến D5
    sheet.addImage(logoImage, {
      tl: { col: 2, row: 1 }, // top-left tại ô C2
      ext: { width: 250, height: 70 }, // chiều rộng & cao ảnh (px)
    });

    // Merge từ E2 đến O2
    sheet.mergeCells("E2:O2");
    sheet.mergeCells("E3:O3");
    const cell = sheet.getCell("E2");
    const cellss = sheet.getCell("E3");
    cell.value = "CMC TECHNOLOGY & SOLUTION";
    cellss.value =
      "Trụ sở: Tầng 16, CMC Tower, phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Thành phố Hà Nội.";

    // Style chữ
    cell.font = { bold: true, size: 14, color: { argb: "0070C0" } }; // xanh, in đậm
    cell.alignment = { horizontal: "center", vertical: "middle" };

    cellss.font = {
      bold: true,
      size: 11,
      color: { argb: "0070C0" },
      underline: true,
    }; // xanh, in đậm
    cellss.alignment = { horizontal: "center", vertical: "middle" };

    // Merge từ B5 đến O5
    sheet.mergeCells("B5:O5");
    const b5Cell = sheet.getCell("B5");
    b5Cell.value = "BÁO GIÁ DỊCH VỤ";

    // Style chữ
    b5Cell.font = { bold: true, size: 40, color: { argb: "0070C0" } }; // xanh, in đậm
    b5Cell.alignment = { horizontal: "center", vertical: "middle" };

    // Merge từ J5 đến N5
    sheet.mergeCells("J6:N6");
    const j6Cell = sheet.getCell("J6");
    // const location = await getLocation(); // lấy từ API hoặc geoip-lite

    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    j6Cell.value = `Hà Nội, ngày ${day}, tháng ${month}, năm ${year}`;

    // Style chữ
    j6Cell.font = {
      bold: true,
      size: 11,
      color: { argb: "FF000000" },
      italic: true,
    }; // xanh, in đậm
    j6Cell.alignment = { horizontal: "right", vertical: "middle" };

    //Merge B8 - D8
    sheet.mergeCells("B8:D8");
    const b8Cell = sheet.getCell("B8");
    b8Cell.value = "DỰ ÁN: Triển khai C-Cam cho khách hàng";

    // Style chữ
    b8Cell.font = { bold: true, size: 11, color: { argb: "FF000000" } }; // xanh, in đậm
    b8Cell.alignment = { horizontal: "left", vertical: "middle" };

    //Thông tin liên hệ 1
    const labels1 = [
      { left: "Kính gửi:", right: "", mergeRows: 2, underline: true },
      { left: "Địa chỉ:", right: "" },
      { left: "Mobile:", right: "" },
      { left: "Email:", right: "" },
    ];

    let startRow1 = 10; // bắt đầu từ hàng 10

    labels1.forEach((item) => {
      if (item.mergeRows === 2) {
        // Merge 2 dòng liền nhau
        sheet.mergeCells(`B${startRow1}:F${startRow1 + 1}`);
        const cell = sheet.getCell(`B${startRow1}`);
        cell.value = {
          richText: [
            {
              text: item.left,
              font: {
                bold: true,
                size: 11,
                underline: item.underline || false,
              },
            },
            {
              text: ` ${item.right}`,
              font: { bold: false, size: 11 },
            },
          ],
        };
        cell.alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        sheet.getRow(startRow1).height = 20;
        startRow1 += 2; // nhảy qua 2 hàng vì merge
      } else {
        // Merge 1 dòng
        sheet.mergeCells(`B${startRow1}:F${startRow1}`);
        const cell = sheet.getCell(`B${startRow1}`);
        cell.value = {
          richText: [
            {
              text: item.left,
              font: { bold: true, size: 11 },
            },
            {
              text: ` ${item.right}`,
              font: { bold: false, size: 11 },
            },
          ],
        };
        cell.alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        sheet.getRow(startRow1).height = 20;
        startRow1 += 1; // nhảy xuống 1 hàng
      }
    });

    // Thông tin liên hệ 2
    const labels = [
      { left: "Bên báo giá:", right: ` C-CAM ${input.deploymentType}` },
      {
        left: "Tên công ty:",
        right: " TỔNG CÔNG TY CÔNG NGHỆ & GIẢI PHÁP CMC",
      },
      {
        left: "Địa chỉ:",
        right:
          " Tòa CMC Tower, số 11, Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
      },
      { left: "Tài khoản:", right: "" },
      {
        richText: [
          { text: "Liên hệ:", font: { bold: true, size: 11 } },
          { text: " ", font: { size: 11 } }, // khoảng trắng
          {
            text: "                         Mobile:",
            font: { bold: true, size: 11 },
          },
          { text: " ", font: { size: 11 } }, // sau này chèn nội dung Mobile
        ],
      },
      { left: "Email:", right: "" },
    ];

    labels.forEach((item, i) => {
      const rowIndex = 9 + i;
      sheet.mergeCells(`G${rowIndex}:O${rowIndex}`);
      const cell = sheet.getCell(`G${rowIndex}`);

      if (item.richText) {
        // Nếu có richText -> gán trực tiếp
        cell.value = { richText: item.richText };
      } else if (i < 2) {
        // Hai dòng đầu -> in đậm toàn bộ
        cell.value = {
          richText: [
            {
              text: `${item.left}${item.right}`,
              font: { bold: true, size: 11, color: { argb: "FF000000" } },
            },
          ],
        };
      } else {
        // Các dòng sau -> phần trước in đậm, phần sau thường
        cell.value = {
          richText: [
            {
              text: item.left,
              font: { bold: true, size: 11, color: { argb: "FF000000" } },
            },
            {
              text: item.right,
              font: { bold: false, size: 11, color: { argb: "FF000000" } },
            },
          ],
        };
      }

      cell.alignment = {
        horizontal: "left",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      sheet.getRow(rowIndex).height = 20;
    });

    sheet.addRow([]);

    // ============================
    // Chèn 12 dòng trống trước
    // ============================
    for (let i = 1; i < 2; i++) {
      sheet.addRow([]);
    }

    // ============================
    // Đơn vị tính
    // ============================
    let vndRow = sheet.addRow([]);

    let vndCell = vndRow.getCell(14);
    vndCell.value = "Đơn vị tính: VNĐ";
    vndCell.font = {
      size: 11,
      bold: true,
      color: { argb: "FF000000" },
      italic: true,
    };
    vndCell.alignment = { horizontal: "center", vertical: "middle" };

    // Border chỉ quanh đúng ô này
    vndCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // ============================
    // Định nghĩa header ở dòng 18
    // ============================
    const headerRow = sheet.addRow([
      "",
      "STT",
      "Mô tả",
      "Thông số kỹ thuật",
      "Số lượng",
      "NCC",
      "Hình ảnh minh họa",
      "Hãng",
      "Xuất xứ",
      "Đơn giá trước VAT",
      "Khuyến mại",
      "Thành tiền trước VAT",
      "VAT",
      "Thành tiền VAT",
      "Ghi chú",
    ]);

    sheet.getRow(18).height = 30;

    // Set width cho từng cột (theo config cũ)
    sheet.getColumn(1).width = 2; // cột A trống
    sheet.getColumn(2).width = 6; // STT
    sheet.getColumn(3).width = 30; // Mô tả
    sheet.getColumn(4).width = 40; // Thông số kỹ thuật
    sheet.getColumn(5).width = 10; // Số lượng
    sheet.getColumn(6).width = 10; // NCC
    sheet.getColumn(7).width = 30; // Hình ảnh minh họa
    sheet.getColumn(8).width = 10; // Hãng
    sheet.getColumn(9).width = 10; // Xuất xứ
    sheet.getColumn(10).width = 20; // Đơn giá trước VAT
    sheet.getColumn(11).width = 15; // Khuyến mại
    sheet.getColumn(12).width = 25; // Thành tiền trước VAT
    sheet.getColumn(13).width = 20; // VAT
    sheet.getColumn(14).width = 20; // Thành tiền VAT
    sheet.getColumn(15).width = 30; // Ghi chú

    // Style cho header
    headerRow.font = { bold: true, size: 12 };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    for (let col = 2; col <= headerRow.cellCount; col++) {
      const cell = headerRow.getCell(col);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4472C4" }, // xanh đậm
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }

    // ============================
    // Tải ảnh từ URL về buffer
    // ============================

    async function getFileBuffer(
      bucket: string,
      fileKey: string
    ): Promise<Buffer> {
      const stream = await minioClient.getObject(bucket, fileKey); // trả về ReadableStream

      const chunks: Buffer[] = [];
      return await new Promise((resolve, reject) => {
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", (err: Error) => reject(err));
      });
    }

    // ============================
    // Mục A - License
    // ============================
    const firstHeader = sheet.addRow([]);
    const licenseHeader = sheet.addRow(["", "A", "Chi Phí License Phần Mềm"]);
    licenseHeader.font = { bold: true, size: 11 };
    licenseHeader.alignment = { horizontal: "left" };
    sheet.mergeCells(`C${licenseHeader.number}:D${licenseHeader.number}`);

    let totalLicenseAmount = 0;
    let licenseStt = 1;
    for (const l of quotation.licenses) {
      const rowTotal = l.unitPrice * l.quantity;
      totalLicenseAmount += rowTotal;

      const row = sheet.addRow([
        "",
        licenseStt++,
        l.name,
        l.description,
        l.quantity,
        l.vendor,
        "",
        l.vendor,
        l.origin,
        l.unitPrice,
        "",
        rowTotal,
        "",
        l.unitPrice * l.quantity,
        l.note,
      ]);

      row.getCell(10).numFmt = "#,##0";
      row.getCell(12).numFmt = "#,##0";
      row.getCell(13).numFmt = "#,##0";
      row.getCell(14).numFmt = "#,##0";

      if (l.fileId) {
        try {
          const fileLicense = await FileModel.findById(l.fileId); // 🔑 lấy theo từng d.fileId
          if (!fileLicense) {
            throw new Error("File not found");
          }
          const buffer = await getFileBuffer(
            fileLicense.bucket,
            fileLicense.fileKey
          );

          const base64 = buffer.toString("base64");

          const imageId = workbook.addImage({
            base64,
            extension: "png",
          });

          const colIndex = 6;
          const rowIndex = sheet.lastRow!.number;

          // Điều chỉnh chiều rộng cột
          const col = sheet.getColumn(colIndex);
          const desiredColWidth = 150 / 7; // khoảng 7px ~ 1 unit ExcelJS
          if (!col.width || col.width < desiredColWidth) {
            col.width = desiredColWidth;
          }

          // Điều chỉnh chiều cao dòng
          const row = sheet.getRow(rowIndex);
          const desiredRowHeight = 250 * 0.75; // khoảng 0.75px ~ 1 unit height ExcelJS
          if (!row.height || row.height < desiredRowHeight) {
            row.height = desiredRowHeight;
          }

          const colR = Number(colIndex + 0.95);
          const rowR = Number(rowIndex - 1 + 0.14);

          // Chèn ảnh giữ kích thước cố định
          sheet.addImage(imageId, {
            tl: { col: colR, row: rowR },
            ext: { width: 150, height: 150 },
            editAs: "absolute",
          });
        } catch (err) {
          console.error(`Không tải được ảnh từ ${l.fileId}:`, err);
        }
      }
    }

    // Hardcode điều kiện deploymentType
    if (quotation.deploymentType === "Cloud") {
      const row = sheet.addRow([
        "",
        licenseStt,
        "(Miễn phí) Phí bảo trì và nâng cấp hàng năm",
        `- Bảo trì hệ thống phần mềm: cập nhật các bản vá lỗi, nâng cấp các phiên bản về firmware mới nếu có để đảm bảo hệ thống hoạt động ổn định.
- Hỗ trợ kỹ thuật từ xa trong các trường hợp xảy ra các vấn đề về vận hành hoặc kỹ thuật của hệ thống.
- Hỗ trợ đào tạo, hướng dẫn lại việc sử dụng phần mềm cho nhân sự mới tiếp nhận hệ thống của phía khách hàng.
- Hỗ trợ backup hoặc khôi phục dữ liệu nếu có yêu cầu.`,
        1,
        "CMC TS",
        "",
        "CMC TS",
        "Việt Nam",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);

      row.getCell(10).numFmt = "#,##0";
      row.getCell(12).numFmt = "#,##0";
      row.getCell(13).numFmt = "#,##0";
      row.getCell(14).numFmt = "#,##0";
    } else if (quotation.deploymentType === "OnPremise") {
      const maintainFee = (totalLicenseAmount * 20) / 100;
      const row = sheet.addRow([
        "",
        licenseStt,
        "(Tùy chọn) Phí bảo trì và nâng cấp hằng năm (tính từ năm thứ 2)",
        `- Bảo trì hệ thống phần mềm: cập nhật các bản vá lỗi, nâng cấp các phiên bản về firmware mới nếu có để đảm bảo hệ thống hoạt động ổn định.
- Hỗ trợ kỹ thuật từ xa trong các trường hợp xảy ra các vấn đề về vận hành hoặc kỹ thuật của hệ thống.
- Hỗ trợ đào tạo, hướng dẫn lại việc sử dụng phần mềm cho nhân sự mới tiếp nhận hệ thống của phía khách hàng.
- Hỗ trợ backup hoặc khôi phục dữ liệu nếu có yêu cầu.`,
        1,
        "CMC TS",
        "",
        "CMC TS",
        "Việt Nam",
        maintainFee,
        "",
        maintainFee,
        "",
        maintainFee,
        "",
      ]);

      row.getCell(10).numFmt = "#,##0";
      row.getCell(12).numFmt = "#,##0";
      row.getCell(13).numFmt = "#,##0";
      row.getCell(14).numFmt = "#,##0";
    }

    // Lấy index của hàng header này
    const headerRowIndex = licenseHeader.number;
    const firstRowIndex = firstHeader.number;

    // Giả sử bảng từ cột B -> O (2 -> 15)
    for (let col = 2; col <= 15; col++) {
      const cell = sheet.getRow(headerRowIndex).getCell(col);
      const cellFirst = sheet.getRow(firstRowIndex).getCell(col);

      cellFirst.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "B4C6E7" }, // xanh trung bình
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "8EA9DB" }, // xanh trung bình
      };
      cell.font = { bold: true, size: 11, color: { argb: "FF000000" } };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    }

    // ============================
    // Mục B - Device
    // ============================
    sheet.addRow([]);
    const deviceHeader = sheet.addRow(["", "B", "Chi Phí Thiết Bị"]);
    deviceHeader.font = { bold: true, size: 11 };
    deviceHeader.alignment = { horizontal: "left" };
    sheet.mergeCells(`C${deviceHeader.number}:D${deviceHeader.number}`);

    let deviceStt = 1;
    for (const d of quotation.devices) {
      const row = sheet.addRow([
        "",
        deviceStt++,
        d.name,
        d.description,
        d.quantity,
        d.vendor,
        "",
        d.vendor,
        d.origin,
        d.unitPrice,
        "",
        d.unitPrice * d.quantity,
        d.priceRate,
        d.totalAmount * d.quantity,
        "",
      ]);

      row.getCell(10).numFmt = "#,##0";
      row.getCell(12).numFmt = "#,##0";
      row.getCell(13).numFmt = "#,##0";
      row.getCell(14).numFmt = "#,##0";

      // Nếu có imageUrl thì chèn ảnh
      if (d.fileId) {
        try {
          const fileDevice = await FileModel.findById(d.fileId); // 🔑 lấy theo từng d.fileId
          if (!fileDevice) {
            throw new Error("File not found");
          }
          const buffer = await getFileBuffer(
            fileDevice.bucket,
            fileDevice.fileKey
          );

          const base64 = buffer.toString("base64");

          const imageId = workbook.addImage({
            base64,
            extension: "png",
          });

          const colIndex = 6;
          const rowIndex = sheet.lastRow!.number;

          // Điều chỉnh chiều rộng cột
          const col = sheet.getColumn(colIndex);
          const desiredColWidth = 150 / 7; // khoảng 7px ~ 1 unit ExcelJS
          if (!col.width || col.width < desiredColWidth) {
            col.width = desiredColWidth;
          }

          // Điều chỉnh chiều cao dòng
          const row = sheet.getRow(rowIndex);
          const desiredRowHeight = 250 * 0.75; // khoảng 0.75px ~ 1 unit height ExcelJS
          if (!row.height || row.height < desiredRowHeight) {
            row.height = desiredRowHeight;
          }

          const colR = Number(colIndex + 0.95);
          const rowR = Number(rowIndex - 1 + 0.14);

          // Chèn ảnh giữ kích thước cố định
          sheet.addImage(imageId, {
            tl: { col: colR, row: rowR },
            ext: { width: 150, height: 150 },
            editAs: "absolute",
          });
        } catch (err) {
          console.error(`Không tải được ảnh từ ${d.fileId}:`, err);
        }
      }
    }

    //Chỉnh màu phần tiêu đề

    const deviceHeaderIndex = deviceHeader.number;

    // Giả sử bảng từ cột B -> O (2 -> 15)
    for (let col = 2; col <= 15; col++) {
      const cell = sheet.getRow(deviceHeaderIndex).getCell(col);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "8EA9DB" }, // xanh trung bình
      };
      cell.font = { bold: true, size: 11, color: { argb: "FF000000" } };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    }

    // ============================
    // Mục C - Server
    // ============================
    sheet.addRow([]);
    const serverHeader = sheet.addRow(["", "C", "Chi Phí Máy Chủ Và Máy Trạm"]);
    serverHeader.font = { bold: true, size: 11 };
    serverHeader.alignment = { horizontal: "left" };
    sheet.mergeCells(`C${serverHeader.number}:D${serverHeader.number}`);

    let serverStt = 1;
    for (const c of quotation.costServers) {
      if (c.unitPrice === 0 || c.totalAmount === 0) {
        sheet.addRow(["", serverStt++, c.name]);
      } else {
        const row = sheet.addRow([
          "",
          serverStt++,
          c.name,
          "",
          c.quantity,
          "",
          "",
          "",
          "",
          c.unitPrice,
          "",
          c.unitPrice * c.quantity,
          c.priceRate,
          c.totalAmount,
          "",
        ]);

        row.getCell(10).numFmt = "#,##0";
        row.getCell(12).numFmt = "#,##0";
        row.getCell(13).numFmt = "#,##0";
        row.getCell(14).numFmt = "#,##0";
      }

      // Nếu có imageUrl thì chèn ảnh
      if (c.fileId) {
        try {
          const fileServer = await FileModel.findById(c.fileId); // 🔑 lấy theo từng d.fileId
          if (!fileServer) {
            throw new Error("File not found");
          }
          const buffer = await getFileBuffer(
            fileServer.bucket,
            fileServer.fileKey
          );

          const base64 = buffer.toString("base64");

          const imageId = workbook.addImage({
            base64,
            extension: "png",
          });

          const colIndex = 6;
          const rowIndex = sheet.lastRow!.number;

          // Điều chỉnh chiều rộng cột
          const col = sheet.getColumn(colIndex);
          const desiredColWidth = 150 / 7; // khoảng 7px ~ 1 unit ExcelJS
          if (!col.width || col.width < desiredColWidth) {
            col.width = desiredColWidth;
          }

          // Điều chỉnh chiều cao dòng
          const row = sheet.getRow(rowIndex);
          const desiredRowHeight = 250 * 0.75; // khoảng 0.75px ~ 1 unit height ExcelJS
          if (!row.height || row.height < desiredRowHeight) {
            row.height = desiredRowHeight;
          }

          const colR = Number(colIndex + 0.95);
          const rowR = Number(rowIndex - 1 + 0.14);

          // Chèn ảnh giữ kích thước cố định
          sheet.addImage(imageId, {
            tl: { col: colR, row: rowR },
            ext: { width: 150, height: 150 },
            editAs: "absolute",
          });
        } catch (err) {
          console.error(`Không tải được ảnh từ ${c.fileId}:`, err);
        }
      }
    }

    const serverHeaderIndex = serverHeader.number;

    // Giả sử bảng từ cột B -> O (2 -> 15)
    for (let col = 2; col <= 15; col++) {
      const cell = sheet.getRow(serverHeaderIndex).getCell(col);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "8EA9DB" }, // xanh trung bình
      };
      cell.font = { bold: true, size: 11, color: { argb: "FF000000" } };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    }

    // ============================
    // Border & style cho toàn bảng
    // ============================
    const totalRows = sheet.rowCount;
    const totalCols = sheet.columnCount;

    for (let rowIndex = 18; rowIndex <= totalRows; rowIndex++) {
      const r = sheet.getRow(rowIndex);
      for (let colIndex = 1; colIndex <= totalCols; colIndex++) {
        const cell = r.getCell(colIndex);
        if (colIndex === 1 && (!cell.value || cell.value === "")) continue;

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal:
            rowIndex === 18 // hàng header
              ? "center"
              : colIndex === 3 || colIndex === 4 || colIndex === 15
              ? "left"
              : "center",
          wrapText: true,
        };
      }
    }

    // ============================
    // Tổng hợp cuối
    // ============================
    sheet.addRow([]);

    const summaryRows = [
      {
        label: "CHI PHÍ TRIỂN KHAI",
        valueCol: [12, 14],
        value: quotation.summary.deploymentCost,
        merge: (rowNumber: number) => `B${rowNumber}:K${rowNumber}`,
        height: 30,
        note: "Chi phí tạm tính, có thể phát sinh thay đổi trong quá trình triển khai",
      },
      {
        label: "TỔNG GIÁ TRỊ THÀNH TIỀN CHƯA BAO GỒM VAT",
        valueCol: 12,
        value:
          quotation.summary.deviceTotal / 1.08 +
          quotation.summary.licenseTotal -
          ((quotation.summary.costServerTotal / 1.08) * 8) / 100 +
          quotation.summary.deploymentCost,
        merge: (rowNumber: number) => `B${rowNumber}:K${rowNumber}`,
        height: 30,
      },
      {
        label: "THUẾ VAT 8%",
        valueCol: 13,
        value:
          ((quotation.summary.deviceTotal / 1.08 +
            quotation.summary.costServerTotal / 1.08) *
            8) /
          100,
        merge: (rowNumber: number) => `B${rowNumber}:L${rowNumber}`,
        height: 30,
      },
      {
        label: "TỔNG GIÁ TRỊ ĐÃ BAO GỒM THUẾ",
        valueCol: 14,
        value: quotation.summary.grandTotal,
        merge: (rowNumber: number) => `B${rowNumber}:M${rowNumber}`,
        height: 40,
        note: "Chi phí ước tính, thực tế chênh lệch 10%-20%",
      },
    ];

    summaryRows.forEach((item) => {
      const row = sheet.addRow([]);

      // Label
      row.getCell(2).value = item.label;
      row.getCell(2).font = { bold: true, size: 11 };
      row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };

      // Value (hỗ trợ nhiều cột)
      const cols = Array.isArray(item.valueCol)
        ? item.valueCol
        : [item.valueCol];
      cols.forEach((col) => {
        row.getCell(col).value = item.value;
        row.getCell(col).font = { bold: true, size: 11 };
        row.getCell(col).alignment = {
          horizontal:
            col === 12 || col === 13 || col === 14 ? "center" : "left",
          vertical: "middle",
        };
      });

      if (item.label === "CHI PHÍ TRIỂN KHAI" && item.note !== undefined) {
        row.getCell(15).value = item.note;
        row.getCell(15).font = { italic: true, size: 11 };
        row.getCell(15).alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      }

      if (
        item.label === "TỔNG GIÁ TRỊ ĐÃ BAO GỒM THUẾ" &&
        item.note !== undefined
      ) {
        row.getCell(15).value = item.note;
        row.getCell(15).font = { italic: true, size: 11 };
        row.getCell(15).alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      }

      if (typeof item.value === "number") {
        row.getCell(12).numFmt = "#,##0";
        row.getCell(13).numFmt = "#,##0";
        row.getCell(14).numFmt = "#,##0";
      }

      // Merge vùng label
      sheet.mergeCells(item.merge(row.number));

      // Border cho toàn bộ hàng
      const totalCols = sheet.columnCount;
      for (let colIndex = 2; colIndex <= totalCols; colIndex++) {
        const cell = row.getCell(colIndex);
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      }

      //Nếu có height thì ưu tiên theo quy ước
      if (item.height) {
        row.height = item.height;
      }
    });

    // ============================
    // Ghi chú
    // ============================
    sheet.addRow([]);

    // Hàng tiêu đề "Ghi chú"
    let rows = sheet.addRow([]);
    let cells = rows.getCell(3);
    cells.value = "Ghi chú";
    sheet.mergeCells(`C${rows.number}:N${rows.number}`);

    // Style cho tiêu đề
    cells.font = {
      bold: true,
      size: 12,
      color: { argb: "FFFFFFFF" },
    };
    cells.alignment = { horizontal: "center", vertical: "middle" };
    cells.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" }, // xanh header
    };
    cells.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // Hàng nội dung
    rows = sheet.addRow([]);
    let noteCell = rows.getCell(3);
    noteCell.value =
      "- Giá vật tư tạm tính, có thể thay đổi lên xuống theo Giá thực tế khi nhập hàng\n" +
      "- Giá trên đã bao gồm thuế VAT 8%\n" +
      "- Báo giá có giá trị trong vòng 30 ngày";

    sheet.mergeCells(`C${rows.number}:N${rows.number}`);
    rows.height = 60; // tăng chiều cao cho đủ 3 dòng

    // Style cho nội dung
    noteCell.font = { size: 11, color: { argb: "FF000000" } };
    noteCell.alignment = {
      horizontal: "center",
      vertical: "top",
      wrapText: true,
    };
    noteCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // ============================
    // Thông tin liên hệ
    // ============================
    sheet.addRow([]);

    //Liên hệ
    let startRow = sheet.rowCount + 1;

    // Tạo 4 hàng trống liên tiếp
    for (let i = 0; i < 4; i++) {
      sheet.addRow([]);
    }

    // Merge từ C đến N, gộp 4 hàng liên tiếp
    sheet.mergeCells(`C${startRow}:N${startRow + 3}`);

    let mergedCell = sheet.getCell(`C${startRow}`);
    mergedCell.value = {
      richText: [
        {
          text: "Nếu Quý khách có bất kỳ câu hỏi nào liên quan đến báo giá này vui lòng liên hệ thông tin bên dưới:\n",
          font: { bold: true, size: 11 },
        },
        { text: "Liên hệ:\n", font: { size: 11 } },
        { text: "SĐT:\n", font: { size: 11 } },
        { text: "Email:", font: { size: 11 } },
      ],
    };

    // Style chung cho alignment và border
    mergedCell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    mergedCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    //Lời cảm ơn
    sheet.addRow([]);
    let thankRow = sheet.addRow([]);
    thankRow.getCell(3).value =
      "CHÂN THÀNH CẢM ƠN SỰ TIN TƯỞNG HỢP TÁC CỦA QUÝ KHÁCH DÀNH CHO CHÚNG TÔI";
    sheet.mergeCells(`C${thankRow.number}:N${thankRow.number}`);

    // Style
    thankRow.getCell(3).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    thankRow.getCell(3).font = { size: 11, bold: true };

    thankRow.getCell(3).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    workbook.eachSheet((sheet) => {
      sheet.eachRow((row) => {
        row.eachCell((cell) => {
          // Giữ nguyên các thuộc tính khác, chỉ đổi font name
          const oldFont = cell.font || {};
          cell.font = { ...oldFont, name: "Times New Roman" };
        });
      });
    });

    // Trả về buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
