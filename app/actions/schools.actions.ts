"use server";

import { db } from "@/lib/db";
import { authorizeThisAction } from "./auth.actions";

export async function getSchoolGroups() {
    const authSession = await authorizeThisAction();
    if (!authSession) return { success: false, message: "Authentication required" };

    try {
        const schoolGroups = await db.schoolGroup.findMany({
            include: {
                schools: {
                    distinct: ['id'], // Ensure unique schools
                },
            },
        });
        return { success: true, data: schoolGroups };
    } catch (error) {
        return { success: false, message: "Failed to fetch school groups" };
    }
}

export async function getSchoolGroupById(id: number) {
    const authSession = await authorizeThisAction();
    if (!authSession) return { success: false, message: "Authentication required" };

    try {
        const schoolGroup = await db.schoolGroup.findUnique({
            where: { id },
            include: {
                schools: {
                    distinct: ['id'], // Ensure unique schools
                },
            },
        });
        if (!schoolGroup) return { success: false, message: "School group not found" };
        return { success: true, data: schoolGroup };
    } catch (error) {
        return { success: false, message: "Failed to fetch school group" };
    }
}

export async function getSchools() {
    const authSession = await authorizeThisAction();
    if (!authSession) return { success: false, message: "Authentication required" };

    try {
        const schools = await db.school.findMany({
            include: { group: true },
            distinct: ['id'], // Ensure unique schools
        });
        return { success: true, data: schools };
    } catch (error) {
        return { success: false, message: "Failed to fetch schools" };
    }
}

export async function getSchoolById(id: number) {
    const authSession = await authorizeThisAction();
    if (!authSession) return { success: false, message: "Authentication required" };

    try {
        const school = await db.school.findUnique({
            where: { id },
            include: { group: true },
        });
        if (!school) return { success: false, message: "School not found" };
        return { success: true, data: school };
    } catch (error) {
        return { success: false, message: "Failed to fetch school" };
    }
}