let lameLoaded = false;

// Load lamejs dynamically
async function loadLame() {
    if (lameLoaded) return;

    await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./lib/lame.min.js";
        script.onload = () => {
            lameLoaded = true;
            resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Convert Float32 → Int16 (IMPORTANT FIX)
function floatTo16BitPCM(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
}

export async function compressAudio(file) {
    try {
        await loadLame();

        const arrayBuffer = await file.arrayBuffer();

        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // 🎧 Keep original sample rate (better quality)
        const sampleRate = audioBuffer.sampleRate;

        // 🎯 Balanced compression setting
        const bitrate = 96; // kbps

        // 🎵 Get channel data (no forced mono)
        const samples = audioBuffer.getChannelData(0);

        // 🔁 Convert format
        const int16Samples = floatTo16BitPCM(samples);

        const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, bitrate);

        const blockSize = 1152;
        let mp3Data = [];

        for (let i = 0; i < int16Samples.length; i += blockSize) {
            const chunk = int16Samples.subarray(i, i + blockSize);
            const mp3buf = mp3encoder.encodeBuffer(chunk);

            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        const end = mp3encoder.flush();
        if (end.length > 0) {
            mp3Data.push(end);
        }

        const compressedBlob = new Blob(mp3Data, { type: "audio/mp3" });

        // 📊 Metrics (as required by your project)
        const originalSize = file.size;
        const compressedSize = compressedBlob.size;

        const ratio = (originalSize / compressedSize).toFixed(2);
        const savings = (
            ((originalSize - compressedSize) / originalSize) * 100
        ).toFixed(2);

        return {
            file: compressedBlob,
            originalSize,
            compressedSize,
            ratio,
            savings,
            note:
                savings > 50
                    ? "High compression with noticeable quality loss"
                    : "Balanced compression with acceptable quality"
        };

    } catch (error) {
        console.error("Audio Compression Error:", error);
        throw error;
    }
}

































