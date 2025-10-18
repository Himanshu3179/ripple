declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler?: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
}

interface RazorpayInstance {
  open: () => void;
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

export const loadRazorpay = (): Promise<boolean> => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = async (options: RazorpayOptions) => {
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) {
    throw new Error('Unable to load Razorpay checkout');
  }

  const checkout = new window.Razorpay(options);
  checkout.open();
};
