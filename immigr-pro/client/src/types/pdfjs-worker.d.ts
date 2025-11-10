declare module "pdfjs-dist/build/pdf.worker.mjs" {
  const workerSrc: string;
  export default workerSrc;
}

declare module "pdfjs-dist/build/pdf" {
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(src: string | { url: string }): {
    promise: Promise<any>;
  };
}
