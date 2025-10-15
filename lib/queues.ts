import { db } from "@/lib/db";
import { redisUrl } from "@/lib/redis";
import { spawnScheduleWorker } from "@/lib/worker";
import type { SyncInterval } from "@prisma/client";
import { JobScheduler, Queue, Worker } from "bullmq";
import crypto from "crypto";

// --- QUEUE UNIQUE ---
export const scheduleQueue = new Queue("schedule-sync", {
    connection: { url: redisUrl },
});

// --- JOB SCHEDULER ---
if (!(global as any).__SCHEDULE_JOB_SCHEDULER__) {
    (global as any).__SCHEDULE_JOB_SCHEDULER__ = new JobScheduler("schedule-sync", {
        connection: { url: redisUrl },
    });
}

// --- WORKER UNIQUE ---
if (!(global as any).__SCHEDULE_WORKER__) {
    (global as any).__SCHEDULE_WORKER__ = new Worker(
        "schedule-sync",
        async (job) => {
            const { scheduleId } = job.data;
            await syncSchedule(scheduleId);
        },
        { connection: { url: redisUrl } }
    );
}

export const intervalToCron: Record<SyncInterval, string> = {
    min15: "*/15 * * * *",
    min30: "*/30 * * * *",
    hour1: "0 * * * *",
    hour3: "0 */3 * * *",
    hour6: "0 */6 * * *",
    hour12: "0 */12 * * *",
    daily: "0 0 * * *",
    weekly: "0 0 * * 0",
    biweekly: "0 0 1,15 * *",
    monthly: "0 0 1 * *",
};

// --- SYNC FUNCTION ---
async function syncSchedule(scheduleId: string) {
    const schedule = await db.schedule.findUnique({
        where: { id: scheduleId },
        include: {
            school: true,
            versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
                include: { eventVersions: { include: { event: true } } },
            },
        },
    });

    if (!schedule) return;

    const payloadObj = JSON.parse(schedule.payload);
    const scrapeResult = await spawnScheduleWorker(
        schedule.school.loginServer,
        schedule.school.scheduleServer,
        payloadObj
    );
    if (scrapeResult.status !== "success") return;

    const events = scrapeResult.data!;
    const newEventHashes: string[] = [];
    const createdEvents = [];

    for (const ev of events) {
        const hash = computeEventHash(ev);
        newEventHashes.push(hash);
        const eventDb = await db.event.upsert({
            where: { hash },
            update: {},
            create: {
                hash,
                title: ev.title,
                instructor: ev.instructor || undefined,
                program: ev.program || undefined,
                startTime: new Date(ev.startTime),
                endTime: new Date(ev.endTime),
                duration: ev.duration || undefined,
                weekDay: ev.weekDay || undefined,
                classroom: ev.classroom || undefined,
                campus: ev.campus || undefined,
                deliveryMode: ev.deliveryMode as any,
                color: ev.color || undefined,
                classGroup: ev.classGroup || undefined,
            },
        });
        createdEvents.push(eventDb);
    }

    const latestVersion = schedule.versions[0];

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;
    const newVersion = await db.scheduleVersion.create({
        data: {
            versionNumber: newVersionNumber,
            scheduleId,
            notes: "Auto sync",

        },
    });

    const oldEventVersions = latestVersion?.eventVersions || [];
    const oldHashes = new Set(oldEventVersions.map((ev) => ev.event.hash));
    const newSet = new Set(newEventHashes);

    for (const eventDb of createdEvents) {
        const changeType = oldHashes.has(eventDb.hash) ? "Unchanged" : "Added";
        await db.eventVersion.create({
            data: { versionId: newVersion.id, eventId: eventDb.id, changeType },
        });
    }

    for (const oldEV of oldEventVersions) {
        if (!newSet.has(oldEV.event.hash)) {
            await db.eventVersion.create({
                data: { versionId: newVersion.id, eventId: oldEV.eventId, changeType: "Removed" },
            });
        }
    }
}

function computeEventHash(event: any): string {
    const canonical = {
        title: event.title,
        instructor: event.instructor || null,
        program: event.program || null,
        startTime: event.startTime,
        endTime: event.endTime,
        duration: event.duration,
        weekDay: event.weekDay,
        classroom: event.classroom,
        campus: event.campus,
        deliveryMode: event.deliveryMode,
        color: event.color,
        classGroup: event.classGroup,
    };
    return crypto.createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}