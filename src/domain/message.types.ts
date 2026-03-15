// message.types.ts

import * as z from "zod";
import { WelcomePayload, SubsAckPayload, ServerSchema } from "./message.schema";

export type WelcomeMessage = z.infer<typeof WelcomePayload>;
export type SubsAckMessage = z.infer<typeof SubsAckPayload>;
export type ServerMessage = z.infer<typeof ServerSchema>;
