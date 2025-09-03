import { Types } from "mongoose";

export interface ServiceOption {
  _id: string;
  name: string;
  iconKey: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
