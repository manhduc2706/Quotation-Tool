import { SelectedFeature } from "../pages/Home";
import api from "./api";

export const quotationApi = {
  createQuotation: async (data: {
    deploymentType: "Cloud" | "OnPremise";
    _id: string;
    userCount: number | null;
    pointCount: number; 
    cameraCount: number | null;
    selectedFeatures?: SelectedFeature[];
    iconKey?: string;
  }) => {
    try {
      const requestData = {
        ...data,
        selectedFeatures: data.selectedFeatures ?? null,
      };

      const response = await api.post("/quotations", requestData);
      return response.data.data;
    } catch (error) {
      console.error("Error creating quotation:", error);
      throw error;
    }
  },
};
