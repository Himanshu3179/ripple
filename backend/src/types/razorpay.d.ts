declare module 'razorpay' {
  export interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  export interface OrderCreateRequest {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, unknown>;
  }

  export interface Order {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  }

  export interface PaymentVerificationPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    orders: {
      create(request: OrderCreateRequest): Promise<Order>;
    };
    payments: {
      fetch(paymentId: string): Promise<{
        id: string;
        status: string;
        amount: number;
        method: string;
        email?: string;
        contact?: string;
      }>;
    };
  }
}
