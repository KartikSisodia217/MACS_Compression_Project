import * as fflate from "fflate";

function validateFile(file) {
  if (!file || file.size === 0) {
    throw new Error("File is empty or missing.");
  }

  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error("File exceeds 50 MB limit.");
  }

  const textExtensions = ['.txt', '.csv', '.json', '.html', '.xml'];
  const isTextFile = textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!file.type.includes("text") && !isTextFile) {
    throw new Error("Only text files (.txt, .csv, .json, .html, .xml) supported.");
  }
}

function buildResult(originalFile, compressedBlob, algorithm) {
  const originalSize = originalFile.size;
  const compressedSize = compressedBlob.size;
  const compressionRatio = (originalSize / compressedSize).toFixed(2);
  const spaceSavings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(2);

  return {
    compressedBlob,
    originalSize,
    compressedSize,
    algorithm,
    compressionRatio,
    spaceSavings,
    noGain: compressedSize >= originalSize
  };
}

export async function compressText(file) {
  validateFile(file);

  const u8Input = new Uint8Array(await file.arrayBuffer());

  const compressedU8 = await new Promise((resolve, reject) => {
    fflate.gzip(u8Input, { level: 9 }, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const blob = new Blob([compressedU8], {
    type: "application/gzip"
  });

  return buildResult(file, blob, "GZIP (fflate, level 9)");
}

export async function decompressText(compressedFile) {
  if (!compressedFile || compressedFile.size === 0) {
    throw new Error("Compressed file is empty or missing.");
  }

  const u8Input = new Uint8Array(await compressedFile.arrayBuffer());

  const decompressedU8 = await new Promise((resolve, reject) => {
    fflate.gunzip(u8Input, (err, data) => {
      if (err) reject(new Error("Invalid GZIP file"));
      else resolve(data);
    });
  });

  const originalText = new TextDecoder().decode(decompressedU8);
  return new Blob([originalText], { type: "text/plain" });
}
