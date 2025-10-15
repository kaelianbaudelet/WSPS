

export const register = async () => {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import('@/lib/queues')
            .then(() => console.log("\x1b[32m ✓\x1b[0m Queues and Worker initialized via instrumentation"))
            .catch(console.error);
    }
};