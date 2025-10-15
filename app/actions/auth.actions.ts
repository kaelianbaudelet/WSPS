"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

export async function getAuth() {
    try {
        const user = await auth.api.getSession({
            headers: await headers(),
        });
        return !user ? null : user;
    } catch (error) {
        console.error("Error getting auth:", error);
        return null;
    }
}

export async function signOut() {
    await auth.api.signOut({
        headers: await headers(),
    });
}

export async function getSessions() {
    const sessions = await auth.api.listSessions({
        headers: await headers(),
    });
    return sessions;
}

export async function getUserAccounts() {
    const userAccounts = await auth.api.listUserAccounts({
        headers: await headers(),
    });
    return userAccounts;
}

export const authorizeThisAction = async () => {
    const auth = await getAuth();
    if (!auth) {
        notFound();
    }
    return auth;
};
