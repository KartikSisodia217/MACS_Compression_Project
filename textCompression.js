function validateFile(file, typeCheckFn = null, typeErrorMsg = "Invalid file type") {
  if (!file || file.size === 0) {
    throw new Error("File is empty or missing.");
  }

  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  if (file.size > MAX_SIZE) {
    throw new Error("File exceeds the 50 MB size limit.");
  }

  if (typeCheckFn && !typeCheckFn(file)) {
    throw new Error(typeErrorMsg);
  }
}

function buildResult(originalFile, compressedBlob, algorithm) {
  const originalSize = originalFile.size;
  const compressedSize = compressedBlob.size;

  return {
    compressedBlob,
    originalSize,
    compressedSize,
    algorithm,
    noGain: compressedSize >= originalSize,
  };
}

export async function compressText(file) {
  validateFile(
    file,
    (f) =>
      f.name.endsWith(".txt") ||
      f.name.endsWith(".csv") ||
      f.type === "text/plain" ||
      f.type === "text/csv",
    "Only .txt and .csv files are supported for text compression."
  );

  const arrayBuffer = await file.arrayBuffer();
  const u8Input = new Uint8Array(arrayBuffer);

  const compressedU8 = await new Promise((resolve, reject) => {
    fflate.gzip(u8Input, { level: 9 }, (err, data) => {
      if (err) reject(new Error("fflate compression failed: " + err.message));
      else resolve(data);
    });
  });

  const compressedBlob = new Blob([compressedU8], { type: "application/gzip" });
  return buildResult(file, compressedBlob, "GZIP (fflate, level 9)");
}
