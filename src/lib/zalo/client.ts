type ZnsPayload = {
  phone: string;
  template_id: string;
  template_data: Record<string, string | number>;
  tracking_id?: string;
};

type OaTextPayload = {
  recipient: {
    user_id: string;
  };
  message: {
    text: string;
  };
};

type ZaloApiResponse = {
  error?: number;
  message?: string;
  data?: {
    msg_id?: string;
    sent_time?: string;
  };
};

export type ZaloSendResult =
  | { ok: true; messageId: string | null; raw: ZaloApiResponse }
  | { ok: false; errorCode: string; errorMessage: string; raw?: ZaloApiResponse };

const ZNS_TEMPLATE_ENDPOINT = "https://business.openapi.zalo.me/message/template";
const OA_MESSAGE_ENDPOINT = "https://openapi.zalo.me/v3.0/oa/message/cs";

export async function sendZnsTemplate(accessToken: string, payload: ZnsPayload): Promise<ZaloSendResult> {
  const response = await fetch(ZNS_TEMPLATE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": accessToken,
    },
    body: JSON.stringify(payload),
  });
  const raw = await response.json().catch(() => null) as ZaloApiResponse | null;
  if (!response.ok || !raw || raw.error) {
    return {
      ok: false,
      errorCode: raw?.error != null ? String(raw.error) : `http.${response.status}`,
      errorMessage: raw?.message || response.statusText || "zalo.send_failed",
      raw: raw ?? undefined,
    };
  }
  return {
    ok: true,
    messageId: raw.data?.msg_id ?? null,
    raw,
  };
}

export async function sendOaTextMessage(accessToken: string, payload: OaTextPayload): Promise<ZaloSendResult> {
  const response = await fetch(OA_MESSAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "access_token": accessToken,
    },
    body: JSON.stringify(payload),
  });
  const raw = await response.json().catch(() => null) as ZaloApiResponse | null;
  if (!response.ok || !raw || raw.error) {
    return {
      ok: false,
      errorCode: raw?.error != null ? String(raw.error) : `http.${response.status}`,
      errorMessage: raw?.message || response.statusText || "zalo.send_failed",
      raw: raw ?? undefined,
    };
  }
  return {
    ok: true,
    messageId: raw.data?.msg_id ?? null,
    raw,
  };
}
