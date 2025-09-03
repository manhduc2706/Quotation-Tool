import { useState } from "react";
import { SelectedFeature } from "../pages/Home";
import { ServiceOption } from "../types";
import IconCalculator from "./ui/iconCalculator";
import IconExcel from "./ui/iconExcel";

export interface ShowQuotationProps {
  quotation: {
    iconKey: string;
    pointCount: number | null;
    cameraCount: number | null;
    devices: Array<{
      name: string;
      itemType: string;
      vatRate: number;
      selectedFeatures?: SelectedFeature[];
      pointCount: number;
      description: string;
      unitPrice: number;
      totalAmount: number;
    }>;
    licenses: Array<{
      name: string;
      itemType: string;
      vatRate: number;
      selectedFeatures?: SelectedFeature[];
      pointCount: number;
      description: string;
      unitPrice: number;
      costServer: number;
      totalAmount: number;
    }>;
    costServers: Array<{
      name: string;
      vatRate: number;
      selectedFeatures?: SelectedFeature[];
      description: string;
      unitPrice: number;
      totalAmount: number;
    }>;
    summary: {
      deviceTotal: number;
      licenseTotal: number;
      costServerTotal: number;
      deploymentCost: number;
      grandTotal: number;
    };
  };
}

export default function ShowQuotation({ quotation }: ShowQuotationProps) {
  const mergedItems = [
    ...quotation.devices.map((item) => ({
      ...item,
      sourceType: "device",
    })),
    ...quotation.licenses.map((item) => ({
      ...item,
      sourceType: "license",
    })),
    ...quotation.costServers.map((item) => ({
      ...item,
      sourceType: "costServer",
    })),
  ];

  return (
    <div className="min-h-screen max-w-[1280px] bg-gray-50 border">
      <div className="flex flex-col pb-2">
        <div className="bg-[#0F4FAF] text-white p-4">
          <div className="flex flex-row items-center gap-2">
            <IconCalculator />
            <h2 className="text-2xl font-bold">Báo Giá Chi Tiết</h2>
          </div>
          <p className="text-sm">
            Bảng giá chi tiết cho dịch vụ hệ thống C-CAM
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <table className="min-w-full divide-y divide-gray-300 rounded-md  mb-6 font-medium text-gray-700">
          <thead>
            <tr className="bg-gray-100 text-black text-center">
              <th className="px-3 py-3 divide-y divide-gray-300">STT</th>
              <th className="px-3 py-3 divide-y divide-gray-300">Hạng mục</th>
              <th className="px-3 py-3 divide-y divide-gray-300">Số lượng</th>
              <th className="px-3 py-3 divide-y divide-gray-300">
                Đơn giá (VND)
              </th>
              <th className="px-3 py-3 divide-y divide-gray-300">
                Thành tiền (VND)
              </th>
              <th className="px-3 py-3 divide-y divide-gray-300">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {mergedItems.map((item, index) => {
              const isLastRow = index === mergedItems.length - 1;
              const borderClass = isLastRow ? "" : "border-b border-gray-300";

              // Kiểm tra iconKey để xác định số lượng
              const quantity =
                item.sourceType === "device" &&
                quotation.iconKey === "securityAlert"
                  ? quotation.cameraCount ?? 0 // Nếu securityAlert, dùng cameraCount
                  : quotation.pointCount; // Nếu không, dùng pointCount

              return (
                <tr key={index} className="bg-gray-50 hover:bg-gray-100">
                  <td className={`px-3 py-6 ${borderClass}`}>{index + 1}</td>
                  <td
                    className={`px-3 py-6 text-left font-medium ${borderClass}`}
                  >
                    {item.name}
                  </td>
                  <td className={`px-3 py-6 ${borderClass}`}>
                    {quantity !== null ? quantity.toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className={`px-3 py-6 ${borderClass}`}>
                    {item.unitPrice.toLocaleString("vi-VN")}
                  </td>
                  <td className={`px-3 py-6 ${borderClass}`}>
                    {(item.unitPrice * (quantity ?? 0)).toLocaleString("vi-VN")}
                  </td>
                  <td className={`px-3 py-6 text-left ${borderClass}`}>
                    {item.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <hr className="my-6 border-gray-300" />

        {/* Tổng kết */}

        <table className="w-full divide-y divide-gray-300 rounded-md mb-4">
          <tbody>
            <tr>
              <td className="px-3 py-2 text-lg font-semibold text-gray-900 divide-y divide-gray-300">
                Tạm tính
              </td>
              <td className="px-3 py-2 divide-y divide-gray-300 text-right text-lg font-semibold text-gray-900">
                {(
                  quotation.summary.deviceTotal / 1.08 +
                  quotation.summary.licenseTotal
                ).toLocaleString("vi-VN")}{" "}
                VND
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-lg font-semibold text-gray-900 divide-y divide-gray-300">
                VAT (8%)
              </td>
              <td className="px-3 py-2 divide-y divide-gray-300 text-right text-lg font-semibold text-gray-900">
                {(
                  ((quotation.summary.deviceTotal / 1.08 +
                    quotation.summary.costServerTotal) *
                    8) /
                  100
                ).toLocaleString("vi-VN")}{" "}
                VND
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-lg font-semibold text-gray-900 divide-y divide-gray-300">
                Chi phí triển khai
              </td>
              <td className="px-3 py-2 divide-y divide-gray-300 text-right text-lg font-semibold text-gray-900">
                {quotation.summary.deploymentCost.toLocaleString("vi-VN")} VND
              </td>
            </tr>

            <tr>
              <td colSpan={2}>
                <hr className="border-t border-gray-300 my-2" />
              </td>
            </tr>

            <tr className="bg-blue-100 font-bold">
              <td className="px-3 py-2 divide-y divide-gray-300 text-[#0F4FAF] text-lg font-semibold">
                Tổng cộng
              </td>
              <td className="px-3 py-2 divide-y divide-gray-300 text-right text-[#0F4FAF] text-lg font-semibold">
                {quotation.summary.grandTotal.toLocaleString("vi-VN")} VND
              </td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            <IconExcel />
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}
