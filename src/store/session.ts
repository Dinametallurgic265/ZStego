import { create } from 'zustand';
import type { CarrierInfo, EncodeResult, DecodeResult, HeaderPeek, FilePreview } from '../lib/tauri';

type JobStatus = 'idle' | 'loading' | 'running' | 'done' | 'error';

interface SessionStore {

  carrierPath: string | null;
  carrierInfo: CarrierInfo | null;
  jobStatus: JobStatus;
  jobError: string | null;
  jobStep: string;
  jobProgress: number;


  payloadPath: string | null;
  payloadSize: number | null;
  textPayload: string;
  encodeResult: EncodeResult | null;


  decodeResult: DecodeResult | null;
  headerPeek: HeaderPeek | null;
  decodePreview: FilePreview | null;


  setCarrier: (path: string, info: CarrierInfo) => void;
  setPayload: (path: string, size: number) => void;
  setTextPayload: (text: string) => void;
  setHeaderPeek: (peek: HeaderPeek | null) => void;
  setDecodePreview: (preview: FilePreview | null) => void;
  startJob: () => void;
  setStep: (step: string, progress: number) => void;
  finishEncodeJob: (result: EncodeResult) => void;
  finishDecodeJob: (result: DecodeResult) => void;
  failJob: (error: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  carrierPath: null,
  carrierInfo: null,
  jobStatus: 'idle',
  jobError: null,
  jobStep: '',
  jobProgress: 0,
  payloadPath: null,
  payloadSize: null,
  textPayload: '',
  encodeResult: null,
  decodeResult: null,
  headerPeek: null,
  decodePreview: null,

  setCarrier: (path, info) => set({ carrierPath: path, carrierInfo: info }),
  setPayload: (path, size) => set({ payloadPath: path, payloadSize: size }),
  setTextPayload: (text) => set({ textPayload: text }),
  setHeaderPeek: (peek) => set({ headerPeek: peek }),
  setDecodePreview: (preview) => set({ decodePreview: preview }),

  startJob: () => set({ jobStatus: 'running', jobError: null, jobProgress: 0, jobStep: 'Starting…' }),

  setStep: (step, progress) => set({ jobStep: step, jobProgress: progress }),

  finishEncodeJob: (result) =>
    set({ jobStatus: 'done', encodeResult: result, jobProgress: 100, jobStep: 'Complete' }),

  finishDecodeJob: (result) =>
    set({ jobStatus: 'done', decodeResult: result, jobProgress: 100, jobStep: 'Complete' }),

  failJob: (error) => set({ jobStatus: 'error', jobError: error }),

  reset: () =>
    set({
      carrierPath: null,
      carrierInfo: null,
      jobStatus: 'idle',
      jobError: null,
      jobStep: '',
      jobProgress: 0,
      payloadPath: null,
      payloadSize: null,
      textPayload: '',
      encodeResult: null,
      decodeResult: null,
      headerPeek: null,
      decodePreview: null,
    }),
}));
