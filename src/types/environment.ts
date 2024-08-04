import { z } from "zod";

export const EnvironmentSchema = z.object({
    FA_DOTENV_KEY: z.string().optional(),
    FA_DATABASE_URL_CONNECTION: z.string().min(1),
    FA_DISCORD_BOT_TOKEN: z.string().min(1),

    // Nodemon specific variables
    NODE_ENV: z.enum(["development", "production"])
});

try {
    EnvironmentSchema.parse(process.env);
} catch (err) {
    if (err instanceof z.ZodError) {
        console.error("The environment variables are invalid, values doesn't match schema", err.issues);
    } else {
        console.error("An error occurred while validating environment variables", err);
    }
    process.exit(1);
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface ProcessEnv extends z.infer<typeof EnvironmentSchema> { }
    }
}
