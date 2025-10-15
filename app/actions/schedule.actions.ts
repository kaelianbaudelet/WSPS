"use server";

import { db } from "@/lib/db";
import { intervalToCron, scheduleQueue } from "@/lib/queues";
import { encryptObject } from "@/lib/utils/crypto";
import type { Event } from "@/lib/worker"; // Assume type import if needed
import { spawnScheduleWorker, testConnection } from "@/lib/worker";
import { SyncInterval } from "@prisma/client";
import crypto from "crypto";
import { authorizeThisAction } from "./auth.actions";

// Modified createSchedule in your file
export async function createSchedule(data: {
    name: string;
    schoolId: number;
    username: string;
    password: string;
    syncInterval: SyncInterval;
}) {
    const authSession = await authorizeThisAction();
    if (!authSession) return { success: false, message: 'Authentication required' };

    const userId = authSession.user.id;

    try {
        const school = await db.school.findUnique({ where: { id: data.schoolId } });
        if (!school) return { success: false, message: 'School not found' };

        const credentials = { username: data.username, password: data.password };
        const payloadObj = encryptObject(credentials);

        const testResult = await testConnection(school.loginServer, payloadObj);
        if (testResult.status !== 'success') return { success: false, message: testResult.message };

        // Initial sync
        const scrapeResult = await spawnScheduleWorker(school.loginServer, school.scheduleServer, payloadObj);
        if (scrapeResult.status !== 'success') return { success: false, message: scrapeResult.error };

        const events = scrapeResult.data!;

        const createdEvents = [];
        for (const ev of events) {
            const hash = computeEventHash(ev);
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

        const newSchedule = await db.schedule.create({
            data: {
                name: data.name,
                payload: JSON.stringify(payloadObj),
                userId,
                schoolId: data.schoolId,
                syncInterval: data.syncInterval,
            },
        });

        const version = await db.scheduleVersion.create({
            data: {
                versionNumber: 1,
                scheduleId: newSchedule.id,
                notes: 'Initial version',
            },
        });

        for (const eventDb of createdEvents) {
            await db.eventVersion.create({
                data: {
                    versionId: version.id,
                    eventId: eventDb.id,
                    changeType: 'Added',
                },
            });
        }

        // Add scheduler
        const cronPattern = intervalToCron[data.syncInterval];
        await scheduleQueue.upsertJobScheduler(`schedule-${newSchedule.id}`, {
            pattern: cronPattern,
        }, {
            name: 'sync-schedule',
            data: { scheduleId: newSchedule.id },
            opts: { attempts: 3 },
        });

        return { success: true, data: newSchedule };
    } catch (error) {
        return { success: false, message: 'Failed to create schedule' };
    }
}

function computeEventHash(event: Omit<Event, "">): string { // Adjust type if needed
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
    const str = JSON.stringify(canonical);
    return crypto.createHash("sha256").update(str).digest("hex");
}


export async function deleteScheduleById(scheduleId: string): Promise<{ success: boolean; message?: string }> {
    try {
        // Start a transaction to ensure atomicity
        await db.$transaction(async (tx) => {
            // Find all ScheduleVersions and their EventVersions for the schedule
            const scheduleVersions = await tx.scheduleVersion.findMany({
                where: { scheduleId },
                include: { eventVersions: true },
            });

            // Collect all event IDs linked to this schedule's versions
            const eventIds = scheduleVersions
                .flatMap((version) => version.eventVersions.map((ev) => ev.eventId))
                .filter((value, index, self) => self.indexOf(value) === index); // Deduplicate

            // Delete the schedule (cascades to ScheduleVersion and EventVersion due to onDelete: Cascade)
            await tx.schedule.delete({
                where: { id: scheduleId },
            });

            // Check for orphaned events (events not linked to any other ScheduleVersion)
            for (const eventId of eventIds) {
                const remainingEventVersions = await tx.eventVersion.count({
                    where: { eventId },
                });

                // If no other EventVersion references this event, delete it
                if (remainingEventVersions === 0) {
                    await tx.event.delete({
                        where: { id: eventId },
                    });
                }
            }
        });

        await scheduleQueue.remove(`schedule-${scheduleId}`);

        return { success: true, message: "Schedule and related data deleted successfully" };
    } catch (error) {
        return { success: false, message: "Failed to delete schedule" };
    }
}


export async function updateScheduleById(scheduleId: string, data: { name?: string; syncInterval?: SyncInterval }): Promise<{ success: boolean; message?: string }> {
    try {
        const existingSchedule = await db.schedule.findUnique({ where: { id: scheduleId } });
        if (!existingSchedule) return { success: false, message: "Schedule not found" };

        await db.schedule.update({
            where: { id: scheduleId },
            data: {
                name: data.name || existingSchedule.name,
                syncInterval: data.syncInterval || existingSchedule.syncInterval,
            },
        });

        if (data.syncInterval && data.syncInterval !== existingSchedule.syncInterval) {
            await scheduleQueue.remove(`schedule-${scheduleId}`);
            const cronPattern = intervalToCron[data.syncInterval];
            await scheduleQueue.upsertJobScheduler(`schedule-${scheduleId}`, {
                pattern: cronPattern,
            }, {
                name: 'sync-schedule',
                data: { scheduleId },
                opts: { attempts: 3 },
            });
        }

        return { success: true, message: "Schedule updated successfully" };
    } catch (error) {
        return { success: false, message: "Failed to update schedule" };
    }
}




// Start of Selection
export async function getScheduleById(scheduleId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const schedule = await db.schedule.findUnique({
            where: { id: scheduleId },
            select: {
                id: true,
                name: true,
                syncInterval: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                schoolId: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        eventVersions: {
                            include: {
                                event: true,
                            },
                        },
                    },
                },
            },
        });

        if (!schedule) return { success: false, message: "Schedule not found" };

        const latestVersion = schedule.versions[0];
        if (!latestVersion) return { success: false, message: "Latest version not found" };

        const latestEvents = latestVersion.eventVersions.map((ev) => ev.event);

        return { success: true, data: { schedule, events: latestEvents } };
    } catch (error) {
        return { success: false, message: "Failed to retrieve schedule" };
    }
}

export async function getAllSchedules(): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const authSession = await authorizeThisAction();
        if (!authSession) return { success: false, message: 'Authentication required' };

        const userId = authSession.user.id;

        const schedules = await db.schedule.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                syncInterval: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                schoolId: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        eventVersions: {
                            orderBy: { event: { startTime: 'desc' } },
                            include: {
                                event: true,
                            },
                        },
                    },
                },
            },
        });

        const schedulesWithLatestEvent = schedules.map((schedule) => {
            const latestVersion = schedule.versions[0];
            const latestEvent = latestVersion ? latestVersion.eventVersions[0]?.event : null;
            return { ...schedule, events: latestEvent ? [latestEvent] : [] };
        });

        return { success: true, data: schedulesWithLatestEvent };
    } catch (error) {
        return { success: false, message: "Failed to retrieve schedules" };
    }
}

export async function getAllSchedulesByUserId(userId: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const schedules = await db.schedule.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                syncInterval: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                schoolId: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        eventVersions: {
                            orderBy: { event: { startTime: 'asc' } },
                            include: {
                                event: true,
                            },
                        },
                    },
                },
            },
        });

        const schedulesWithLatestEvent = schedules.map((schedule) => ({
            id: schedule.id,
            name: schedule.name,
            syncInterval: schedule.syncInterval,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
            userId: schedule.userId,
            schoolId: schedule.schoolId,
            version: [{
                id: schedule.versions[0]?.id,
                versionNumber: schedule.versions[0]?.versionNumber,
                notes: schedule.versions[0]?.notes,
                createdAt: schedule.versions[0]?.createdAt,
            }],
            events: schedule.versions[0]?.eventVersions.map((ev) => ({
                id: ev.event.id,
                hash: ev.event.hash,
                title: ev.event.title,
                instructor: ev.event.instructor,
                program: ev.event.program,
                startTime: ev.event.startTime,
                endTime: ev.event.endTime,
                duration: ev.event.duration,
                weekDay: ev.event.weekDay,
                classroom: ev.event.classroom,
                campus: ev.event.campus,
                deliveryMode: ev.event.deliveryMode,
                color: ev.event.color,
                classGroup: ev.event.classGroup,
            })),
        }));

        return { success: true, data: schedulesWithLatestEvent };
    } catch (error) {
        return { success: false, message: "Failed to retrieve schedules" };
    }
}

export async function getScheduleByIdAndByUserId(scheduleId: string, userId: string, version?: number): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
        const schedule = await db.schedule.findUnique({
            where: { id: scheduleId, userId },
            select: {
                id: true,
                name: true,
                syncInterval: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                schoolId: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    ...(version !== undefined ? { where: { versionNumber: version } } : { take: 1 }),
                    include: {
                        eventVersions: {
                            orderBy: { event: { startTime: 'asc' } },
                            include: {
                                event: true,
                            },
                        },
                    },
                },
            },
        });

        if (!schedule) return { success: false, message: "Schedule not found" };

        if (version !== undefined && schedule.versions.length === 0) {
            return { success: false, message: "Version not found" };
        }

        const formattedSchedule = {
            id: schedule.id,
            name: schedule.name,
            syncInterval: schedule.syncInterval,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
            userId: schedule.userId,
            schoolId: schedule.schoolId,
            version: [{
                id: schedule.versions[0]?.id,
                versionNumber: schedule.versions[0]?.versionNumber,
                notes: schedule.versions[0]?.notes,
                createdAt: schedule.versions[0]?.createdAt,
            }],
            events: schedule.versions[0]?.eventVersions.map((ev) => ({
                id: ev.event.id,
                hash: ev.event.hash,
                title: ev.event.title,
                instructor: ev.event.instructor,
                program: ev.event.program,
                startTime: ev.event.startTime,
                endTime: ev.event.endTime,
                duration: ev.event.duration,
                weekDay: ev.event.weekDay,
                classroom: ev.event.classroom,
                campus: ev.event.campus,
                deliveryMode: ev.event.deliveryMode,
                color: ev.event.color,
                classGroup: ev.event.classGroup,
            })),
        };

        return { success: true, data: formattedSchedule };
    } catch (error) {
        return { success: false, message: "Failed to retrieve schedule" };
    }
}