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
