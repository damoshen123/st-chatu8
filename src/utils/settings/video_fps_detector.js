// 还原自打包产物 — 原始模块: utils/settings/video_fps_detector.js
async function detectVideoFps(file, videoEl2) {
  if (file && (file.type.includes("mp4") || file.name.match(/\.(mp4|mov|m4v)$/i))) {
    try {
      const parsedFps = await parseMp4ContainerFps(file);
      if (parsedFps && parsedFps >= 1 && parsedFps <= 240) {
        const normalized = normalizeFps(parsedFps);
        console.log(`[VideoFpsDetector] \u5F15\u64CE\u4E00\u6210\u529F\u8BC6\u522B MP4 \u5E27\u7387: \u539F\u751F\u503C=${parsedFps}, \u89C4\u6574\u503C=${normalized.fps}`);
        return {
          fps: normalized.fps,
          rawFps: parsedFps,
          method: "binary_mp4",
          isStandard: normalized.isStandard
        };
      }
    } catch (err) {
      console.warn("[VideoFpsDetector] \u5F15\u64CE\u4E00\u4E8C\u8FDB\u5236\u89E3\u6790\u5931\u8D25, \u5C1D\u8BD5\u540E\u5907\u5F15\u64CE:", err);
    }
  }
  if (videoEl2 && typeof videoEl2.requestVideoFrameCallback === "function") {
    try {
      const probeResult = await probeFpsWithVideoCallback(videoEl2);
      if (probeResult && probeResult >= 1 && probeResult <= 240) {
        const normalized = normalizeFps(probeResult);
        console.log(`[VideoFpsDetector] \u5F15\u64CE\u4E8C\u56DE\u8C03\u6D4B\u5F97\u5E27\u7387: \u539F\u751F\u503C=${probeResult}, \u89C4\u6574\u503C=${normalized.fps}`);
        return {
          fps: normalized.fps,
          rawFps: probeResult,
          method: "rvfc_probe",
          isStandard: normalized.isStandard
        };
      }
    } catch (err) {
      console.warn("[VideoFpsDetector] \u5F15\u64CE\u4E8C\u52A8\u6001\u6D4B\u901F\u5931\u8D25:", err);
    }
  }
  return {
    fps: 30,
    rawFps: 30,
    method: "fallback_default",
    isStandard: true
  };
}

async function parseMp4ContainerFps(file) {
  const fileSize = file.size;
  let moovBuffer = null;
  let offset = 0;
  let hops = 0;
  while (offset + 8 <= fileSize && hops < 50) {
    hops++;
    const headerChunk = await readSliceAsArrayBuffer(file, offset, Math.min(fileSize, offset + 16));
    if (headerChunk.byteLength < 8) break;
    const view = new DataView(headerChunk);
    let size = view.getUint32(0);
    const type = getString(view, 4, 4);
    if (size === 1) {
      if (headerChunk.byteLength < 16) break;
      const high = view.getUint32(8);
      const low = view.getUint32(12);
      size = high * 4294967296 + low;
    } else if (size === 0) {
      size = fileSize - offset;
    }
    if (type === "moov") {
      const readLen = Math.min(size, 32 * 1024 * 1024);
      moovBuffer = await readSliceAsArrayBuffer(file, offset, offset + readLen);
      break;
    }
    if (size <= 0) break;
    offset += size;
  }
  if (!moovBuffer) {
    moovBuffer = await scanForMoovFallback(file);
  }
  if (!moovBuffer) return null;
  return parseMoovForFps(moovBuffer);
}

async function scanForMoovFallback(file) {
  const fileSize = file.size;
  const headLen = Math.min(fileSize, 1024 * 1024);
  const headBuf = await readSliceAsArrayBuffer(file, 0, headLen);
  let found = findMoovSignature(headBuf);
  if (found !== -1) {
    const view = new DataView(headBuf);
    const boxSize = view.getUint32(found);
    if (boxSize > 8 && boxSize <= 32 * 1024 * 1024) {
      return await readSliceAsArrayBuffer(file, found, found + boxSize);
    }
  }
  if (fileSize > headLen) {
    const tailLen = Math.min(fileSize, 4 * 1024 * 1024);
    const tailOffset = fileSize - tailLen;
    const tailBuf = await readSliceAsArrayBuffer(file, tailOffset, fileSize);
    found = findMoovSignature(tailBuf);
    if (found !== -1) {
      const view = new DataView(tailBuf);
      const boxSize = view.getUint32(found);
      const absolutePos = tailOffset + found;
      const readLen = boxSize > 8 && boxSize <= 32 * 1024 * 1024 ? boxSize : fileSize - absolutePos;
      return await readSliceAsArrayBuffer(file, absolutePos, absolutePos + readLen);
    }
  }
  return null;
}

function findMoovSignature(buffer) {
  const u8 = new Uint8Array(buffer);
  for (let i = 4; i < u8.length - 4; i++) {
    if (u8[i] === 109 && u8[i + 1] === 111 && u8[i + 2] === 111 && u8[i + 3] === 118) {
      return i - 4;
    }
  }
  return -1;
}

function parseMoovForFps(buffer) {
  const view = new DataView(buffer);
  const moovLen = buffer.byteLength;
  const traks = findBoxes(view, 8, moovLen, "trak");
  for (const trak of traks) {
    const mdias = findBoxes(view, trak.payloadStart, trak.payloadEnd, "mdia");
    if (mdias.length === 0) continue;
    const mdia = mdias[0];
    const hdlrs = findBoxes(view, mdia.payloadStart, mdia.payloadEnd, "hdlr");
    if (hdlrs.length > 0) {
      const hdlr = hdlrs[0];
      if (hdlr.payloadStart + 12 <= buffer.byteLength) {
        const handlerType = getString(view, hdlr.payloadStart + 8, 4);
        if (handlerType !== "vide") {
          continue;
        }
      }
    }
    let timescale = 0;
    let mdhdDuration = 0;
    const mdhds = findBoxes(view, mdia.payloadStart, mdia.payloadEnd, "mdhd");
    if (mdhds.length > 0) {
      const mdhd = mdhds[0];
      const version = view.getUint8(mdhd.payloadStart);
      if (version === 0) {
        timescale = view.getUint32(mdhd.payloadStart + 12);
        mdhdDuration = view.getUint32(mdhd.payloadStart + 16);
      } else if (version === 1) {
        timescale = view.getUint32(mdhd.payloadStart + 20);
        const high = view.getUint32(mdhd.payloadStart + 24);
        const low = view.getUint32(mdhd.payloadStart + 28);
        mdhdDuration = high * 4294967296 + low;
      }
    }
    const minfs = findBoxes(view, mdia.payloadStart, mdia.payloadEnd, "minf");
    if (minfs.length === 0) continue;
    const minf = minfs[0];
    const stbls = findBoxes(view, minf.payloadStart, minf.payloadEnd, "stbl");
    if (stbls.length === 0) continue;
    const stbl = stbls[0];
    const sttss = findBoxes(view, stbl.payloadStart, stbl.payloadEnd, "stts");
    if (sttss.length > 0) {
      const stts = sttss[0];
      const entryCount = view.getUint32(stts.payloadStart + 4);
      if (entryCount > 0 && timescale > 0) {
        let totalSamples = 0;
        let totalDurationTicks = 0;
        const maxEntries = Math.min(entryCount, 256);
        for (let i = 0; i < maxEntries; i++) {
          const offset = stts.payloadStart + 8 + i * 8;
          if (offset + 8 > stts.payloadEnd) break;
          const sampleCount = view.getUint32(offset);
          const sampleDelta = view.getUint32(offset + 4);
          totalSamples += sampleCount;
          totalDurationTicks += sampleCount * sampleDelta;
        }
        if (totalDurationTicks > 0) {
          const calculatedFps = timescale * totalSamples / totalDurationTicks;
          if (calculatedFps >= 1 && calculatedFps <= 240) {
            return calculatedFps;
          }
        }
      }
    }
    const stszs = findBoxes(view, stbl.payloadStart, stbl.payloadEnd, "stsz");
    if (stszs.length > 0 && timescale > 0 && mdhdDuration > 0) {
      const stsz = stszs[0];
      const sampleCount = view.getUint32(stsz.payloadStart + 8);
      const durationSec = mdhdDuration / timescale;
      if (sampleCount > 0 && durationSec > 0) {
        const calculatedFps = sampleCount / durationSec;
        if (calculatedFps >= 1 && calculatedFps <= 240) {
          return calculatedFps;
        }
      }
    }
  }
  return null;
}

function findBoxes(view, startOffset, endOffset, targetType) {
  const results = [];
  let pos = startOffset;
  const maxBound = Math.min(endOffset, view.byteLength);
  while (pos + 8 <= maxBound) {
    let size = view.getUint32(pos);
    const type = getString(view, pos + 4, 4);
    let headerSize = 8;
    if (size === 1) {
      if (pos + 16 > maxBound) break;
      const high = view.getUint32(pos + 8);
      const low = view.getUint32(pos + 12);
      size = high * 4294967296 + low;
      headerSize = 16;
    } else if (size === 0) {
      size = maxBound - pos;
    }
    if (type === targetType) {
      results.push({
        start: pos,
        headerSize,
        payloadStart: pos + headerSize,
        size,
        payloadEnd: size > 0 ? pos + size : maxBound
      });
    }
    if (size <= 0) break;
    pos += size;
  }
  return results;
}

function getString(view, offset, length) {
  let str = "";
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(view.getUint8(offset + i));
  }
  return str;
}

function readSliceAsArrayBuffer(file, start, end) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    const slice = file.slice(start, end);
    reader.readAsArrayBuffer(slice);
  });
}

function probeFpsWithVideoCallback(videoEl2) {
  return new Promise((resolve) => {
    let frameTimes = [];
    let handle = null;
    let isDone = false;
    const timeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        resolve(null);
      }
    }, 600);
    const onFrame = (now, metadata) => {
      if (isDone) return;
      frameTimes.push(metadata.mediaTime);
      if (frameTimes.length >= 4) {
        isDone = true;
        clearTimeout(timeout);
        let diffs = [];
        for (let i = 1; i < frameTimes.length; i++) {
          const diff = frameTimes[i] - frameTimes[i - 1];
          if (diff > 5e-3 && diff < 0.2) {
            diffs.push(diff);
          }
        }
        if (diffs.length > 0) {
          const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
          const estimatedFps = 1 / avgDiff;
          resolve(estimatedFps);
        } else {
          resolve(null);
        }
      } else {
        handle = videoEl2.requestVideoFrameCallback(onFrame);
      }
    };
    handle = videoEl2.requestVideoFrameCallback(onFrame);
  });
}

function normalizeFps(rawFps) {
  if (!rawFps || isNaN(rawFps)) return { fps: 30, isStandard: true };
  if (Math.abs(rawFps - 23.976) < 0.015) {
    return { fps: 23.98, isStandard: true };
  }
  if (Math.abs(rawFps - 24) < 0.015) {
    return { fps: 24, isStandard: true };
  }
  if (Math.abs(rawFps - 25) < 0.02) {
    return { fps: 25, isStandard: true };
  }
  if (Math.abs(rawFps - 29.97) < 0.015) {
    return { fps: 29.97, isStandard: true };
  }
  if (Math.abs(rawFps - 30) < 0.015) {
    return { fps: 30, isStandard: true };
  }
  if (Math.abs(rawFps - 50) < 0.03) {
    return { fps: 50, isStandard: true };
  }
  if (Math.abs(rawFps - 59.94) < 0.02) {
    return { fps: 59.94, isStandard: true };
  }
  if (Math.abs(rawFps - 60) < 0.02) {
    return { fps: 60, isStandard: true };
  }
  if (Math.abs(rawFps - 120) < 0.05) {
    return { fps: 120, isStandard: true };
  }
  return { fps: Math.round(rawFps * 100) / 100, isStandard: false };
}

export { detectVideoFps };
