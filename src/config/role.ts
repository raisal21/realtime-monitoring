import { StreamDef } from "@/domain/constants";
import type { Role } from "@/hooks/auth.types";

export const ROLE_STREAMS: Record<Role, Set<StreamDef>> = {
  driller: new Set<StreamDef>([StreamDef.DRILL, StreamDef.GEO]),
  geologist: new Set<StreamDef>([StreamDef.GEO]),
  "data-scientist": new Set<StreamDef>([StreamDef.DRILL, StreamDef.GEO]),
};

export interface RoleFeatures {
  gaugeSidebar: "full" | "geo" | "off";
  alarmSidebar: boolean;
  alarmSound: boolean;
  alarmTicker: boolean;
  ackModal: boolean;
}

export const ROLE_FEATURES: Record<Role, RoleFeatures> = {
  driller: {
    gaugeSidebar: "full",
    alarmSidebar: true,
    alarmSound: true,
    alarmTicker: true,
    ackModal: true,
  },
  geologist: {
    gaugeSidebar: "geo",
    alarmSidebar: true,
    alarmSound: true,
    alarmTicker: true,
    ackModal: true,
  },
  "data-scientist": {
    gaugeSidebar: "full",
    alarmSidebar: false,
    alarmSound: false,
    alarmTicker: false,
    ackModal: false,
  },
};
