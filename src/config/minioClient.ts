import { Client } from "minio";

export const minioClient = new Client({
  endPoint: "localhost",
  port: 29000,
  useSSL: false,
  accessKey: "minioadmin",
  secretKey: "minioadmin123",
});
