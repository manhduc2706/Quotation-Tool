import { model, Schema, Types } from "mongoose";

export interface ICostServer {
  _id: Types.ObjectId;
  name: string;
  unitPrice: number;
  vatRate: number;
  quantity?: number;
  totalAmount: number;
}

const CostServerSchema = new Schema<ICostServer>({
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  vatRate: { type: Number, required: true },
  quantity: { type: Number, required: false },
  totalAmount: { type: Number, required: true },
});

export const CostServerModel = model<ICostServer>(
  "CostServer",
  CostServerSchema
);
