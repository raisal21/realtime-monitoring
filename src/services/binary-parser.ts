import { z } from "zod";
import { log } from "@/utils/logger";
import { DrillSchema, GeoSchema } from "@/domain/message.schema";
import type { DrillUpdate, GeoUpdate } from "@/domain/message.types";
import { PROTOCOL_VERSION } from "@/domain/constants";

export const readDrillBuff = (buffer: ArrayBuffer): DrillUpdate | null => {
  const view = new DataView(buffer);

  if (buffer.byteLength < 40) {
    log.error("Insufficient buffer length for Geo packet!");
    return null;
  }

  const protocol = view.getUint8(1);

  if (protocol !== PROTOCOL_VERSION) {
    log.warn(`[PARSER] Unsupported protocol version: ${protocol}`);
  }

  let rawData: DrillUpdate = {
    timestamp: Number(view.getBigUint64(8)),
    depth: view.getFloat32(16),
    sequence: view.getUint32(4),
    rpm: view.getFloat32(20),
    wob: view.getFloat32(24),
    torque: view.getFloat32(28),
    hkld: view.getFloat32(32),
    spp: view.getFloat32(36),
  };

  // Validasi menggunakan .partial() karena data yang masuk hanya sebagian dari RigState
  const validation = DrillSchema.safeParse(rawData);

  if (!validation.success) {
    log.error("Zod Validation Error:", z.prettifyError(validation.error));
    return null;
  }

  return validation.data;
};

export const readGeoBuff = (buffer: ArrayBuffer): GeoUpdate | null => {
  const view = new DataView(buffer);

  if (buffer.byteLength < 40) {
    log.error("Insufficient buffer length for Geo packet!");
    return null;
  }

  const streamId = view.getUint8(0);
  if (streamId !== 102) {
    log.warn(`[PARSER] Unexpected streamId: ${streamId}`);
  }

  const protocol = view.getUint8(1);
  if (protocol !== 1) {
    log.warn(`[PARSER] Unsupported protocol version: ${protocol}`);
  }

  const rawData: GeoUpdate = {
    sequence: view.getUint32(4),
    timestamp: Number(view.getBigUint64(8)),
    depth: view.getFloat32(16),
    gamma: view.getFloat32(20),
    rop: view.getFloat32(24),
    h2s: view.getFloat32(28),
    inc: view.getFloat32(32),
    azi: view.getFloat32(36),
  };

  const validation = GeoSchema.safeParse(rawData);

  if (!validation.success) {
    log.error("Zod Validation Error:", z.prettifyError(validation.error));
    return null;
  }

  return validation.data;
};
