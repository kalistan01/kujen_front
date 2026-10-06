import type { PDFPageProxy } from "pdfjs-dist";

export const MAX_DOCUMENT_BYTES = 100 * 1024;

export type CompressedFile = {
  name: string;
  mimeType: "image/jpeg" | "application/pdf";
  data: string;
  size: number;
};

function stem(name: string) {
  const base = String(name || "file")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base || "file";
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(blob);
  });
}

function canvasToJpeg(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  quality: number
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

async function fitJpeg(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number
) {
  let edge = Math.min(1600, Math.max(sourceWidth, sourceHeight));
  let quality = 0.82;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const scale = edge / Math.max(sourceWidth, sourceHeight, 1);
    const width = Math.max(1, Math.round(sourceWidth * Math.min(scale, 1)));
    const height = Math.max(1, Math.round(sourceHeight * Math.min(scale, 1)));
    const blob = await canvasToJpeg(
      source,
      sourceWidth,
      sourceHeight,
      width,
      height,
      quality
    );
    if (blob && blob.size > 0 && blob.size <= MAX_DOCUMENT_BYTES) return blob;
    if (quality > 0.45) quality = Math.round((quality - 0.12) * 100) / 100;
    else edge = Math.round(edge * 0.72);
    if (edge < 160) break;
  }
  throw new Error("Could not compress this image under 100KB.");
}

async function compressImage(file: File): Promise<CompressedFile> {
  const bitmap = await createImageBitmap(file);
  try {
    const blob = await fitJpeg(bitmap, bitmap.width, bitmap.height);
    return {
      name: `${stem(file.name)}.jpg`,
      mimeType: "image/jpeg",
      data: await blobToBase64(blob),
      size: blob.size,
    };
  } finally {
    bitmap.close();
  }
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  }
  return pdfjs;
}

async function renderPdfPage(page: PDFPageProxy) {
  const base = page.getViewport({ scale: 1 });
  const longest = Math.max(base.width, base.height, 1);
  const scale = Math.min(1.25, 1600 / longest);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read this PDF.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

function combinePages(pages: HTMLCanvasElement[]) {
  if (pages.length === 1) return pages[0];
  const width = Math.max(...pages.map((page) => page.width));
  const height = pages.reduce((sum, page) => sum + page.height, 0);
  const scale = Math.min(1, 4096 / Math.max(width, height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read this PDF.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let top = 0;
  for (const page of pages) {
    const pageHeight = page.height * scale;
    ctx.drawImage(page, 0, top, page.width * scale, pageHeight);
    top += pageHeight;
  }
  return canvas;
}

async function compressPdf(file: File): Promise<CompressedFile> {
  if (file.size > 0 && file.size <= MAX_DOCUMENT_BYTES) {
    return {
      name: file.name.toLowerCase().endsWith(".pdf") ? file.name : `${stem(file.name)}.pdf`,
      mimeType: "application/pdf",
      data: await blobToBase64(file),
      size: file.size,
    };
  }

  const pdfjs = await loadPdfjs();
  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    pdf = await pdfjs
      .getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
      .promise;
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "PasswordException") {
      throw new Error("This PDF is password protected.");
    }
    throw new Error("Could not read this PDF.");
  }
  try {
    const pages: HTMLCanvasElement[] = [];
    for (let index = 1; index <= pdf.numPages; index += 1) {
      pages.push(await renderPdfPage(await pdf.getPage(index)));
    }
    const canvas = combinePages(pages);
    let blob: Blob;
    try {
      blob = await fitJpeg(canvas, canvas.width, canvas.height);
    } catch {
      throw new Error("Could not compress this PDF under 100KB.");
    }
    return {
      name: `${stem(file.name)}.jpg`,
      mimeType: "image/jpeg",
      data: await blobToBase64(blob),
      size: blob.size,
    };
  } finally {
    await pdf.destroy();
  }
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export async function compressUpload(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("Choose an image or a PDF.");
  }
  if (isPdf(file)) return compressPdf(file);
  if (!file.type.startsWith("image/")) {
    throw new Error("Upload an image or a PDF.");
  }
  try {
    return await compressImage(file);
  } catch (error) {
    if (error instanceof Error && error.message.includes("100KB")) throw error;
    throw new Error("Could not read this image.");
  }
}
