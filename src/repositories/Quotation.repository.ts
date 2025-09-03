import { Types } from "mongoose";
import { QuotationModel, IQuotation } from "../models/Quotation.model";
import {
  AdminSelectedFeature,
  DeviceModel,
  IDevice,
} from "../models/Device.model";
import {
  CloudUserLimit,
  ILicense,
  LicenseModel,
} from "../models/License.model";
import { IItemDetail, ItemDetail } from "../models/ItemDetail";
import { CostServerModel } from "../models/CostServer.model";

// Interface cho quotation (có pointCount)
export interface SelectedFeature {
  feature: string;
  pointCount: number;
}

export interface CreateQuotationData {
  deploymentType: "Cloud" | "OnPremise";
  categoryId: Types.ObjectId;
  userCount?: number;
  pointCount?: number;
  cameraCount?: number;
  selectedFeatures?: SelectedFeature[]; // Cập nhật type
  iconKey: string;
}

export interface QuotationItemResponse {
  itemDetailId: Types.ObjectId;
  name: string;
  selectedFeatures?: SelectedFeature[];
  unitPrice: number;
  quantity: number;
  vatRate: number;
  totalAmount: number;
  category?: string;
  description: string;
}

export interface CostServerResponse {
  name: string;
  unitPrice: number;
  quantity: number;
  vatRate: number;
  totalAmount: number;
  description: string;
}

export interface OutPutQuotationData {
  quotationId: Types.ObjectId;
  deploymentType: "Cloud" | "OnPremise";
  userCount: number | null;
  pointCount: number | null;
  cameraCount: number | null;
  iconKey: string;
  costServers: CostServerResponse[];
  devices: QuotationItemResponse[];
  licenses: QuotationItemResponse[];
  selectedFeatures?: SelectedFeature[];
  summary: {
    deviceTotal: number;
    licenseTotal: number;
    costServerTotal: number;
    deploymentCost: number;
    grandTotal: number;
  };
  // createdAt: Date;
}

export class QuotationRepository {
  private getUserTier(
    userCount: number,
    deploymentType: "Cloud" | "OnPremise"
  ): { userLimit: number | CloudUserLimit } {
    if (deploymentType === "OnPremise") {
      // OnPremise: trả về số user cố định
      return { userLimit: userCount };
    } else {
      // Cloud: trả về khoảng user
      if (userCount <= 100) return { userLimit: { min: 1, max: 100 } };
      if (userCount <= 300) return { userLimit: { min: 101, max: 300 } };
      if (userCount <= 500) return { userLimit: { min: 301, max: 500 } };
      if (userCount <= 1000) return { userLimit: { min: 501, max: 1000 } };
      if (userCount <= 1500) return { userLimit: { min: 1001, max: 1500 } };
      if (userCount <= 2000) return { userLimit: { min: 1501, max: 2000 } };
      return { userLimit: { min: 2001, max: 999999 } };
    }
  }
  async create(data: CreateQuotationData): Promise<OutPutQuotationData> {
    // 1) Validate cơ bản
    if (!data.pointCount) {
      throw new Error("Số điểm triển khai là bắt buộc");
    }

    // Chỉ yêu cầu userCount nếu KHÔNG phải securityAlert
    const isSecurity = data.iconKey === "securityAlert";
    if (
      !isSecurity &&
      (data.userCount == null || Number.isNaN(data.userCount))
    ) {
      throw new Error("Số lượng user là bắt buộc (trừ dịch vụ securityAlert)");
    }

    // 2) Tính userTier (chỉ khi không phải securityAlert)
    const userTierInfo =
      !isSecurity && data.userCount != null
        ? this.getUserTier(data.userCount, data.deploymentType)
        : null;

    //Lọc deploymentType
    const itemDetails = await ItemDetail.find({
      developmentType: data.deploymentType,
    });
    const itemDetailIds = itemDetails.map((item) => item._id);

    // 3) Lấy devices theo category
    const devices: IDevice[] = await DeviceModel.find({
      categoryId: data.categoryId,
      itemDetailId: { $in: itemDetailIds },
    })
      .populate("itemDetailId")
      .populate("categoryId");

    // Helper đảm bảo số:
    const num = (v: any) =>
      typeof v === "number" && !Number.isNaN(v) ? v : Number(v) || 0;

    // 4) Tìm licenses: Ưu tiên deploymentType trước, securityAlert xử lý bên trong
    let licenses: ILicense[] = [];

    if (data.deploymentType === "Cloud") {
      if (
        isSecurity &&
        data.selectedFeatures &&
        data.selectedFeatures.length > 0
      ) {
        // Cloud + securityAlert: lọc theo selectedFeatures
        const featureNames = data.selectedFeatures.map((sf) => sf.feature);
        licenses = await LicenseModel.find({
          categoryId: data.categoryId,
          itemDetailId: { $in: itemDetailIds },
          "selectedFeatures.feature": { $in: featureNames }, // Query theo feature name trong object
        })
          .populate("itemDetailId")
          .populate("categoryId");
      } else {
        // Cloud thường: theo khoảng userLimit
        licenses = await LicenseModel.find({
          categoryId: data.categoryId,
          itemDetailId: { $in: itemDetailIds },
          "userLimit.min": { $lte: data.userCount },
          "userLimit.max": { $gte: data.userCount },
        })
          .populate("itemDetailId")
          .populate("categoryId");
      }
    } else {
      // OnPremise
      if (
        isSecurity &&
        data.selectedFeatures &&
        data.selectedFeatures.length > 0
      ) {
        // OnPremise + securityAlert: lọc theo selectedFeatures
        const featureNames = data.selectedFeatures.map((sf) => sf.feature);
        licenses = await LicenseModel.find({
          categoryId: data.categoryId,
          itemDetailId: { $in: itemDetailIds },
          "selectedFeatures.feature": { $in: featureNames }, // Query theo feature name trong object
        })
          .populate("itemDetailId")
          .populate("categoryId");
      } else {
        // OnPremise thường: userLimit exact
        licenses = await LicenseModel.find({
          categoryId: data.categoryId,
          itemDetailId: { $in: itemDetailIds },
          userLimit: data.userCount,
        })
          .populate("itemDetailId")
          .populate("categoryId");
      }
    }

    const costServerIds = licenses
      .map((license) => license.costServerId)
      .filter((id) => id); // loại bỏ undefined/null nếu có

    const costServers = await CostServerModel.find({
      _id: { $in: costServerIds },
    });

    const costServer = costServers[0];

    // 5) Tính tổng
    let licenseTotal = 0;
    let deviceTotal = 0;
    if (data.deploymentType === "Cloud") {
      if (isSecurity && data.selectedFeatures) {
        // Cloud + securityAlert: KHÔNG nhân userCount
        const cameraCount = data.cameraCount;
        if (cameraCount == null) {
          throw new Error("cameraCount không được để trống khi chọn Cloud");
        }

        deviceTotal = devices.reduce(
          (acc: number, d: any) => acc + num(d.totalAmount) * num(cameraCount),
          0
        );

        data.selectedFeatures.forEach((sf) => {
          const matchingLicenses = licenses.filter(
            (l: any) =>
              l.selectedFeatures &&
              l.selectedFeatures.some((lsf: any) => lsf.feature === sf.feature)
          );

          matchingLicenses.forEach((license: any) => {
            const id = license.itemDetailId || {};
            const base =
              num(id.unitPrice) +
              num(costServer.unitPrice) * (1 + num(id.vatRate / 100));
            licenseTotal += base * sf.pointCount;
          });
        });
      } else {
        // Cloud thường: nhân theo userCount
        if (data.userCount == null) {
          throw new Error("userCount không được để trống khi chọn Cloud");
        }
        const pointCount = data.pointCount;
        if (pointCount == null) {
          throw new Error("pointCount không được để trống khi chọn Cloud");
        }

        deviceTotal = devices.reduce(
          (acc: number, d: any) => acc + num(d.totalAmount) * num(pointCount),
          0
        );

        licenseTotal = licenses.reduce((acc: number, l: any) => {
          const id = l.itemDetailId || {};
          const perUser =
            num(id.unitPrice) +
            num(costServer.unitPrice) * (1 + num(id.vatRate / 100));
          return acc + perUser * num(data.userCount) * num(pointCount);
        }, 0);
      }
    } else {
      //Nếu là OnPremise và chọn securityAlert
      if (isSecurity && data.selectedFeatures) {
        // Tìm kiếm device và license theo features
        const cameraCount = data.cameraCount;
        if (cameraCount == null) {
          throw new Error("cameraCount không được để trống khi chọn OnPremise");
        }

        deviceTotal = devices.reduce(
          (acc: number, d: any) => acc + num(d.totalAmount) * num(cameraCount),
          0
        );

        data.selectedFeatures.forEach((sf) => {
          const matchingLicenses = licenses.filter(
            (l: any) =>
              l.selectedFeatures &&
              l.selectedFeatures.some((lsf: any) => lsf.feature === sf.feature)
          );

          matchingLicenses.forEach((license: any) => {
            const id = license.itemDetailId || {};
            const base =
              num(id.unitPrice) +
              num(costServer.unitPrice) * (1 + num(id.vatRate / 100));
            licenseTotal += base * sf.pointCount;
          });
        });
      } else {
        // Onpremise và không chọn securityAlert
        if (data.userCount == null) {
          throw new Error("userCount không được để trống khi chọn OnPremise");
        }
        const pointCount = data.pointCount;
        if (pointCount == null) {
          throw new Error("pointCount không được để trống khi chọn OnPremise");
        }

        deviceTotal = devices.reduce(
          (acc: number, d: any) => acc + num(d.totalAmount) * num(pointCount),
          0
        );

        licenseTotal = licenses.reduce((acc: number, l: any) => {
          const id = l.itemDetailId || {};
          const perUser =
            num(id.unitPrice) +
            num(costServer.unitPrice) * (1 + num(costServer.vatRate / 100));
          return acc + perUser * num(pointCount);
        }, 0);
      }
    }

    const deploymentCost =
      num(data.pointCount) *
      (data.iconKey === "securityAlert" ? 1_000_000 : 5_000_000);

    const costServerTotal = costServer.unitPrice * (1 + costServer.vatRate);

    const grandTotal = deviceTotal + licenseTotal + deploymentCost;

    // 6) Lưu Quotation
    const newQuotation = new QuotationModel({
      deploymentType: data.deploymentType,
      categoryId: data.categoryId,
      userCount: data.userCount,
      iconKey: data.iconKey,
      pointCount: data.pointCount,
      cameraCount: data.cameraCount,
      items: [
        {
          categoryId: data.categoryId,
          devices: devices.map((device: any) => ({
            itemDetailId: device.itemDetailId,
            categoryId: device.categoryId,
            itemType: device.itemType,
            totalAmount: num(device.totalAmount),
            description: device.description,
          })),
          licenses: licenses.map((license: any) => ({
            itemDetailId: license.itemDetailId,
            categoryId: license.categoryId,
            itemType: license.itemType,
            userLimit: license.userLimit,
            costServer: num(license.costServer),
            totalAmount: num(license.totalAmount),
            description: license.description,
          })),
          costServers: costServers.map((costServer: any) => ({
            name: costServer.name,
            unitPrice: num(costServer.unitPrice),
            vatRate: num(costServer.vatRate),
            totalAmount: num(costServer.totalAmount),
            description: costServer.description,
          })),
          categoryTotal: grandTotal,
        },
      ],
      totalAmount: grandTotal,
    });

    const savedQuotation = await newQuotation.save();

    // 7) Format response
    const deviceResponses: QuotationItemResponse[] = devices.map(
      (device: any) => {
        const matchedFeature = data.selectedFeatures?.find((sf) =>
          device.selectedFeatures?.some(
            (dsf: any) => dsf.feature === sf.feature
          )
        );
        return {
          itemDetailId: device.itemDetailId._id,
          name: device.itemDetailId?.name,
          selectedFeatures: device.selectedFeatures ?? [],
          pointCount: matchedFeature
            ? matchedFeature.pointCount
            : data.pointCount ?? 0,
          unitPrice: num(device.itemDetailId?.unitPrice),
          quantity: num(device.itemDetailId?.quantity),
          vatRate: num(device.itemDetailId?.vatRate),
          totalAmount: num(device.totalAmount),
          category: device.categoryId?.name,
          description: device.itemDetailId?.description,
        };
      }
    );

    const costServerResponses: CostServerResponse[] = costServers.map(
      (costServer: any) => ({
        name: costServer.name,
        unitPrice: num(costServer.unitPrice),
        vatRate: num(costServer.vatRate),
        quantity: num(costServer.quantity),
        totalAmount: num(costServer.totalAmount),
        description: costServer.description,
      })
    );

    const licenseResponses: QuotationItemResponse[] = licenses.map(
      (license: any) => {
        const matchedFeature = data.selectedFeatures?.find((sf) =>
          license.selectedFeatures?.some(
            (dsf: any) => dsf.feature === sf.feature
          )
        );
        return {
          itemDetailId: license.itemDetailId._id,
          name: license.itemDetailId?.name,
          selectedFeatures: license.selectedFeatures ?? [],
          unitPrice: num(license.itemDetailId?.unitPrice),
          pointCount: matchedFeature
            ? matchedFeature.pointCount
            : data.pointCount ?? 0,
          quantity: num(license.itemDetailId?.quantity),
          vatRate: num(license.itemDetailId?.vatRate),
          totalAmount: num(license.totalAmount),
          category: license.categoryId?.name,
          description: license.itemDetailId?.description,
        };
      }
    );

    return {
      quotationId: savedQuotation._id,
      deploymentType: data.deploymentType,
      iconKey: data.iconKey,
      userCount: data.userCount as number,
      pointCount: data.pointCount as number,
      cameraCount: data.cameraCount as number,
      devices: deviceResponses,
      licenses: licenseResponses,
      costServers: costServerResponses,
      selectedFeatures: data.selectedFeatures ?? [],
      summary: {
        deviceTotal,
        licenseTotal,
        costServerTotal,
        deploymentCost,
        grandTotal,
      },
    };
  }
}
