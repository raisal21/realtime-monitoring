import * as z from "zod";

const channelSchema = z.object({
  mnemonic: z.string(),
  unit: z.string(),
  dataType: z.enum(["float64", "int32", "int64"]),
});

type channel = z.infer<typeof channelSchema>;

export const handshakeSchema = z
  .object({
    messageType: z.string(),
    schemaId: z.number(),
    wellIdentity: z.object({
      wellName: z.string(),
      wellboreName: z.string(),
      uni: z.string(),
    }),
    channel: z.array(channelSchema),
    roles: z.object({
      timeIndex: z.string(),
      depthIndex: z.string(),
    }),
  })
  .refine(
    (d) => {
      const mnemonic = d.channel.map((c) => c.mnemonic);
      return mnemonic.includes(d.roles.timeIndex);
    },
    {
      message: "timeIndex must exist in channel array",
      path: ["roles", "timeIndex"],
    },
  );

export type handshake = z.infer<typeof handshakeSchema>;

const rigActivitySchema = z.object({
  messageType: z.string(),
  state: z.string(),
  timestamp: z.iso.time(),
});

type rigActivity = z.infer<typeof rigActivitySchema>;

const inclineSchema = z.object({
  messageType: z.string(),
  value: z.number(),
  timestamp: z.iso.time(),
});

type incline = z.infer<typeof inclineSchema>;
