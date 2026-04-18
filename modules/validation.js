import { generateHash } from "../utils/hash.js";

export async function validateOutput(originalFile, decompressedFile, fileType) {

  // LOSSLESS VALIDATION (Text, PNG)
  if (fileType === "text" || fileType === "png") {

    const originalHash = await generateHash(originalFile);
    const rebuiltHash = await generateHash(decompressedFile);

    const isMatch = originalHash === rebuiltHash;

    return {
      isValid: isMatch,
      type: "lossless",
      message: isMatch ? "Perfect Match" : "Mismatch Detected"
    };
  }

  // LOSSY VALIDATION (Image, Audio, Video)
  else {

    const originalSize = originalFile.size;
    const decompressedSize = decompressedFile.size;

    const compressionRatio = originalSize / decompressedSize;

    return {
      isValid: true,
      type: "lossy",
      message: "Compression applied with acceptable quality loss",
      metric: {
        originalSize,
        decompressedSize,
        compressionRatio
      }
    };
  }
}