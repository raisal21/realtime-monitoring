// --- 1. DEFINISI TIPE (INTERFACE) ---
// Agar TypeScript paham struktur object state kita
interface RigState {
  timestamp: bigint;
  depth: number;
  targetRpm: number;
  currentRpm: number;
  targetWob: number;
  currentWob: number;
  activity: "DRILLING" | "CONNECTION" | "TRIPPING"; // Union Type (Lebih aman dr string biasa)
  vibrationPhase: number;
}

interface MockDataBatch {
  timeBuf: BigUint64Array;
  depthBuf: Float32Array;
  rpmBuf: Float32Array;
  wobBuf: Float32Array;
  trqBuf: Float32Array;
  sppBuf: Float32Array;
  hkldBuf: Float32Array;
}

// --- 2. KONFIGURASI ---
const CONFIG = {
  SAMPLE_RATE: 50,
  BATCH_SIZE: 50,
  STRING_WEIGHT: 250.0,
  BLOCK_WEIGHT: 40.0,
  BIT_FRICTION: 0.35,
  NOISE_LEVEL: {
    RPM: 0.5,
    WOB: 2.5,
    TRQ: 1.2,
    SPP: 5.0,
    HKLD: 1.5,
  },
};

// --- 3. STATE INITIALIZATION ---
let rigState: RigState = {
  timestamp: BigInt(Date.now()),
  depth: 1500.0,
  targetRpm: 120.0,
  currentRpm: 0.0,
  targetWob: 20.0,
  currentWob: 0.0,
  activity: "DRILLING",
  vibrationPhase: 0.0,
};

// --- 4. HELPER FUNCTIONS (TYPED) ---

function gaussianNoise(mean: number, stdDev: number): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * stdDev;
}

function lag(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

// --- 5. GENERATOR UTAMA ---

export function generatePhysicsBatch(): MockDataBatch {
  const timeBuf = new BigUint64Array(CONFIG.BATCH_SIZE);
  const depthBuf = new Float32Array(CONFIG.BATCH_SIZE);
  const rpmBuf = new Float32Array(CONFIG.BATCH_SIZE);
  const wobBuf = new Float32Array(CONFIG.BATCH_SIZE);
  const trqBuf = new Float32Array(CONFIG.BATCH_SIZE);
  const sppBuf = new Float32Array(CONFIG.BATCH_SIZE);
  const hkldBuf = new Float32Array(CONFIG.BATCH_SIZE);

  const dt = 1000 / CONFIG.SAMPLE_RATE;

  for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
    rigState.timestamp += BigInt(dt);
    rigState.vibrationPhase += 0.2;

    // Logika State Machine
    if (Math.random() < 0.001) {
      if (rigState.activity === "DRILLING") {
        rigState.activity = "CONNECTION";
        rigState.targetRpm = 0;
        rigState.targetWob = 0;
      } else {
        rigState.activity = "DRILLING";
        rigState.targetRpm = 120;
        rigState.targetWob = 25;
      }
    }

    // --- PHYSICS ENGINE UPDATE ---

    // A. RPM
    rigState.currentRpm = lag(rigState.currentRpm, rigState.targetRpm, 0.05);
    let finalRpm = gaussianNoise(rigState.currentRpm, CONFIG.NOISE_LEVEL.RPM);

    // B. WOB
    rigState.currentWob = lag(rigState.currentWob, rigState.targetWob, 0.1);
    let finalWob = Math.max(
      0,
      gaussianNoise(rigState.currentWob, CONFIG.NOISE_LEVEL.WOB),
    );

    // C. Torque (Coupled)
    let baseTorque = finalWob * CONFIG.BIT_FRICTION;
    let stickSlip =
      finalWob > 5 && finalRpm > 10
        ? Math.sin(rigState.vibrationPhase) * 1.5
        : 0;
    let finalTrq = Math.max(
      0,
      gaussianNoise(baseTorque + stickSlip, CONFIG.NOISE_LEVEL.TRQ),
    );

    // D. SPP
    let pumpFactor = rigState.currentRpm > 10 ? 1 : 0;
    let baseSpp = rigState.currentRpm * 20 * pumpFactor;
    let finalSpp = Math.max(0, gaussianNoise(baseSpp, CONFIG.NOISE_LEVEL.SPP));

    // E. Hook Load (Physics Coupling)
    let staticWeight = CONFIG.STRING_WEIGHT + CONFIG.BLOCK_WEIGHT;
    let baseHkld = staticWeight - finalWob;
    let finalHkld = gaussianNoise(baseHkld, CONFIG.NOISE_LEVEL.HKLD);

    // F. Depth
    if (rigState.activity === "DRILLING" && finalWob > 5 && finalRpm > 10) {
      rigState.depth += 0.002;
    }

    // Assign ke Buffer
    timeBuf[i] = rigState.timestamp;
    depthBuf[i] = rigState.depth;
    rpmBuf[i] = finalRpm;
    wobBuf[i] = finalWob;
    trqBuf[i] = finalTrq;
    sppBuf[i] = finalSpp;
    hkldBuf[i] = finalHkld;
  }

  return { timeBuf, depthBuf, rpmBuf, wobBuf, trqBuf, sppBuf, hkldBuf };
}
