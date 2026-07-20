import { createHmac, randomBytes } from "crypto";

import type { MembershipPlan } from "@/lib/payments/plans";

const defaultBaseUrl = "https://sandbox-api.iyzipay.com";

type IyzicoConfig = {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
};

type IyzicoBuyer = {
  id: string;
  name: string;
  surname: string;
  email: string;
  ip: string;
};

type InitializeCheckoutInput = {
  buyer: IyzicoBuyer;
  callbackUrl: string;
  conversationId: string;
  plan: MembershipPlan;
};

type RetrieveCheckoutInput = {
  token: string;
};

type IyzicoResult = {
  status?: string;
  errorMessage?: string;
  paymentStatus?: string;
  conversationId?: string;
  paymentPageUrl?: string;
  checkoutFormContent?: string;
  token?: string;
};

export function getIyzicoConfig(): IyzicoConfig | null {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!apiKey || !secretKey) return null;

  return {
    apiKey,
    secretKey,
    baseUrl: process.env.IYZICO_BASE_URL || defaultBaseUrl,
  };
}

function toPrice(value: number) {
  return value.toFixed(2);
}

function createAuthorization(config: IyzicoConfig, path: string, body: string) {
  const randomKey = `${Date.now()}${randomBytes(8).toString("hex")}`;
  const signature = createHmac("sha256", config.secretKey)
    .update(`${randomKey}${path}${body}`)
    .digest("hex");
  const authString = `apiKey:${config.apiKey}&randomKey:${randomKey}&signature:${signature}`;

  return `IYZWSv2 ${Buffer.from(authString).toString("base64")}`;
}

async function iyzicoPost(path: string, payload: Record<string, unknown>) {
  const config = getIyzicoConfig();
  if (!config) {
    return {
      status: "failure",
      errorMessage: "Iyzico API anahtarları Vercel ortam değişkenlerine tanımlanmadı.",
    } satisfies IyzicoResult;
  }

  const body = JSON.stringify(payload);
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: createAuthorization(config, path, body),
      "Content-Type": "application/json",
    },
    body,
  });

  const data = (await response.json().catch(() => ({}))) as IyzicoResult;
  if (!response.ok && !data.errorMessage) {
    data.errorMessage = "Iyzico ödeme isteği başarısız oldu.";
  }

  return data;
}

export async function initializeIyzicoCheckout({
  buyer,
  callbackUrl,
  conversationId,
  plan,
}: InitializeCheckoutInput) {
  const price = toPrice(plan.price);

  return iyzicoPost("/payment/iyzipos/checkoutform/initialize/auth/ecom", {
    locale: "tr",
    conversationId,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: conversationId,
    paymentGroup: "PRODUCT",
    callbackUrl,
    enabledInstallments: [1],
    buyer: {
      id: buyer.id,
      name: buyer.name,
      surname: buyer.surname,
      gsmNumber: "+905350000000",
      email: buyer.email,
      identityNumber: "11111111111",
      registrationAddress: "Online uyelik",
      ip: buyer.ip,
      city: "Istanbul",
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: `${buyer.name} ${buyer.surname}`,
      city: "Istanbul",
      country: "Turkey",
      address: "Online uyelik",
      zipCode: "34000",
    },
    billingAddress: {
      contactName: `${buyer.name} ${buyer.surname}`,
      city: "Istanbul",
      country: "Turkey",
      address: "Online uyelik",
      zipCode: "34000",
    },
    basketItems: [
      {
        id: plan.tier,
        name: `${plan.name} uyelik paketi`,
        category1: "Uyelik",
        itemType: "VIRTUAL",
        price,
      },
    ],
  });
}

export async function retrieveIyzicoCheckout({ token }: RetrieveCheckoutInput) {
  return iyzicoPost("/payment/iyzipos/checkoutform/auth/ecom/detail", {
    locale: "tr",
    token,
  });
}

