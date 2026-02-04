import * as z from "zod"

const drillingSchema = z.object({
    timestapms: z.number(),
    depth: z.number().min(0),
    ROP: z.number().min(0),
    WOB: z.number().min(0)
});

type drillingSchema = z.infer<typeof drillingSchema>;

drillingSchema.parse({
    timestapms:1,
    depth:2,
})

const drillingLog = z.object({
    timestamp: z.iso.time(),
    depth: z.number(),
    pass: z.number(),   
    direction: z.enum(["up", "down", "steady"])
})

const chanelState = z.object({
    mnemonic: z.string(),
    uom: z.string(),
    value: z.number()
})

const depth = z.object({
    value: z.number(),
    pass: z.number(),
    direction: z.enum(["up", "down", "steady"])
})

const drillingLog2 = z.object({
    timestamp: z.iso.time(),
    depth: depth
})
