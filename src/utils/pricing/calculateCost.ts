// import {
//   CostItem,
//   ItemInfo,
//   QuotationInput,
//   QuoteRepository,
// } from "../../repositories/Quote.repository";

// export class PricingCaculate {
//   private quoteRepository: QuoteRepository;

//   constructor() {
//     this.quoteRepository = new QuoteRepository();
//   }

//   async calculateCost(
//     input: QuotationInput
//   ): Promise<CostItem> {
//     // Giả lập đơn giá theo loại sản phẩm
//     const basePrice = Math.random() > 0.5 ? 5000000 : 3000000;

//     // Chiết khấu theo số lượng người dùng
//     const discountRate =
//       input.userCount > 100 ? 10 : input.userCount > 50 ? 5 : 0;
//     const discountAmount = basePrice * (discountRate / 100);

//     const subtotal = basePrice - discountAmount;

//     const vatRate = 10;
//     const vatAmount = subtotal * (vatRate / 100);

//     const total = subtotal + vatAmount;

//     return {
//       quantity,
//       unitPrice: basePrice,
//       discount: discountRate,
//       subtotal,
//       vatRate,
//       vatAmount,
//       total,
//       note: `Áp dụng cho triển khai ${input.deploymentType}, ${input.userCount} người dùng`,
//     };
//   }
// }
