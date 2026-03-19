import { API_BASE_URL } from '../config/env';

export interface KhaltiInitiateRequest {
  amount: number;
  orderId: string;
  orderName?: string;
  returnUrl: string;
  customer?: { name?: string; email?: string; phone?: string };
}

export interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: string;
  amount: number;
  status: string;
}

export interface KhaltiVerifyResponse {
  pidx: string;
  status: string;
  transaction_id?: string;
  amount?: number;
  fee?: number;
}

export const initiateKhaltiPayment = async (
  payload: KhaltiInitiateRequest,
  token: string
): Promise<KhaltiInitiateResponse> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/khalti/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('travelBuddyToken');
      window.location.href = '/login';
    }
    throw new Error(data?.error || 'Payment failed');
  }
  return data;
};

export const verifyKhaltiPayment = async (pidx: string, token: string): Promise<KhaltiVerifyResponse> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/khalti/verify?pidx=${encodeURIComponent(pidx)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('travelBuddyToken');
      window.location.href = '/login';
    }
    throw new Error(data?.error || 'Verification failed');
  }
  return data;
};
