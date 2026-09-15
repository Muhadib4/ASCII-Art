import { processImage } from "../features/ascii/processor";
import type { WorkerRequest, WorkerResponse } from "../features/ascii/useAsciiProcessor";

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse) => void;
};

scope.onmessage = (event) => {
  const { id, source, settings } = event.data;
  try { scope.postMessage({ id, result: processImage(source, settings) }); }
  catch (reason) { scope.postMessage({ id, error: reason instanceof Error ? reason.message : "The image could not be processed." }); }
};
