/* eslint-disable @typescript-eslint/no-explicit-any */
export type EnvelopeV1<TPayload = any> = {
  v: 1;
  type: string;
  ts: number;
  source?: string;
  payload?: TPayload;
  correlationId?: string;
};

