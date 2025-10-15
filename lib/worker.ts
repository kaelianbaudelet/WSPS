import { decryptToObject } from "@/lib/utils/crypto";
import type { AxiosInstance } from "axios";
import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import pLimit from "p-limit";
import { CookieJar } from "tough-cookie";

const FRENCH_MONTHS: Record<string, number> = {
    "Janvier": 1, "Février": 2, "Mars": 3, "Avril": 4, "Mai": 5, "Juin": 6,
    "Juillet": 7, "Août": 8, "Septembre": 9, "Octobre": 10, "Novembre": 11, "Décembre": 12
};

const FRENCH_DAYS: Record<string, number> = {
    "Lundi": 1, "Mardi": 2, "Mercredi": 3, "Jeudi": 4, "Vendredi": 5, "Samedi": 6, "Dimanche": 0
};

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface Event {
    title: string;
    instructor: string;
    program: string;
    startTime: string;
    endTime: string;
    duration: number;
    weekDay: string;
    classroom: string | null;
    campus: string | null;
    deliveryMode: string;
    color: string;
    classGroup: string;
}

interface Payload {
    iv: string;
    tag: string;
    data: string;
}

interface Credentials {
    username: string;
    password: string;
}

interface ScheduleResult {
    status: 'success' | 'error';
    data?: Event[];
    error?: string;
}

async function checkCasAvailability(loginServer: string): Promise<boolean> {
    try {
        const response = await axios.head(loginServer, {
            headers: { "User-Agent": "nodejs-client", Accept: "text/html" },
            validateStatus: (status) => status === 200,
        });
        return response.status === 200;
    } catch (err) {
        return false;
    }
}

async function extractHiddenFields(html: string): Promise<Record<string, string>> {
    const $ = cheerio.load(html);
    const fields: Record<string, string> = {};
    $('input[type="hidden"]').each((_, el) => {
        const name = $(el).attr("name");
        const value = $(el).attr("value") ?? "";
        if (name) {
            fields[name] = value;
        }
    });
    return fields;
}

async function createClient(loginServer: string, credentials: Credentials): Promise<AxiosInstance> {
    const { username, password } = credentials;
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));
    const getRes = await client.get(loginServer, {
        params: { service: "" },
        headers: { "User-Agent": "nodejs-client", Accept: "text/html" },
    });

    const hidden = await extractHiddenFields(getRes.data);

    const form = new URLSearchParams();
    form.append("username", username);
    form.append("password", password);
    for (const [k, v] of Object.entries(hidden)) {
        if (k !== "username" && k !== "password") form.append(k, v);
    }
    if (!form.get("_eventId")) form.append("_eventId", "submit");

    const postRes = await client.post(loginServer, form.toString(), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "nodejs-client",
            Accept: "text/html",
        },
        maxRedirects: 0,
        validateStatus: (s) => s >= 200 && s < 400,
    });

    return client;
}

function isErrorPage(html: string): boolean {
    const isError = html.includes('<title>Error 500</title>') || html.includes('<h1>500</h1>') || html.includes('Unexpected Error');
    return isError;
}

async function fetchEDTHtml(client: AxiosInstance, scheduleServer: string, query: Record<string, string>, maxRetries: number = parseInt(process.env.WORKER_MAX_RETRIES_PER_WEEK || '10')): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const params = new URLSearchParams(query).toString();
            const url = `${scheduleServer}?${params}`;
            const res = await client.get(url, {
                headers: { "User-Agent": "nodejs-client", Accept: "text/html" },
            });
            const html = res.data as string;
            if (!isErrorPage(html)) {
                return html;
            }
        } catch (err) {
        }
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.error(`[fetchEDTHtml] Failed after ${maxRetries} attempts`);
    throw new Error("Failed to fetch EDT");
}

function capitalizeName(name: string): string {
    const result = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    return result;
}

function parseFrenchDate(dayText: string, baseYear: number, queryDateObj: Date): string {
    const parts = dayText.trim().split(/\s+/);
    if (parts.length < 3) throw new Error("Invalid date format");

    const dayName = parts[0];
    if (!dayName || !(dayName in FRENCH_DAYS)) throw new Error("Invalid day name");

    const dayNumStr = parts[1];
    if (!dayNumStr) throw new Error("Missing day number");
    const dayNum = parseInt(dayNumStr, 10);
    if (isNaN(dayNum)) throw new Error("Invalid day number");

    const monthNameRaw = parts[2];
    if (!monthNameRaw) throw new Error("Missing month name");
    const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1).toLowerCase();
    const month = FRENCH_MONTHS[monthName];
    if (!month) throw new Error("Invalid month name");

    const weekday = FRENCH_DAYS[dayName];

    let bestDate: Date | null = null;
    let minDiff = Infinity;
    for (let y of [baseYear - 1, baseYear, baseYear + 1]) {
        const d = new Date(Date.UTC(y, month - 1, dayNum));
        if (d.getUTCDay() === weekday) {
            const diff = Math.abs(d.getTime() - queryDateObj.getTime());
            if (diff < minDiff) {
                minDiff = diff;
                bestDate = d;
            }
        }
    }

    if (!bestDate) throw new Error("No matching date found");
    const iso = bestDate.toISOString();
    const datePart = iso.split('T')[0];
    if (!datePart) throw new Error("Invalid ISO date format");
    return datePart;
}

function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    return d;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function calculateDuration(startTime: string, endTime: string, date: string): number {
    const start = new Date(`${date}T${startTime}:00Z`);
    const end = new Date(`${date}T${endTime}:00Z`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    return duration;
}

function parseEdtHtml(html: string, queryDate: string): Event[] {
    const $ = cheerio.load(html);
    const events: Event[] = [];
    const queryParts = queryDate.split('/');
    if (queryParts.length !== 3) throw new Error("Invalid query date format");

    const baseYearStr = queryParts[2];
    if (!baseYearStr) throw new Error("Missing year in query date");
    const baseYear = parseInt(baseYearStr, 10);
    if (isNaN(baseYear)) throw new Error("Invalid year in query date");

    const monthStr = queryParts[0];
    const dayStr = queryParts[1];
    if (!monthStr || !dayStr) throw new Error("Missing month or day in query date");
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    if (isNaN(month) || isNaN(day)) throw new Error("Invalid month or day in query date");

    const queryDateObj = new Date(Date.UTC(baseYear, month - 1, day));

    const dayMap: Map<number, string> = new Map();
    $('.Jour').each((_, el) => {
        const $el = $(el);
        const style = $el.attr('style') || '';
        const leftMatch = style.match(/left:([\d.]+)%/);
        if (!leftMatch || !leftMatch[1]) {
            return;
        }
        const left = parseFloat(leftMatch[1]);
        if (left < 100 || left >= 200) {
            return;
        }
        const dayText = $el.find('.TCJour').text().trim();
        try {
            const parsedDate = parseFrenchDate(dayText, baseYear, queryDateObj);
            dayMap.set(left, parsedDate);
        } catch (err) {
        }
    });

    const sortedDays = Array.from(dayMap.keys()).sort((a, b) => a - b);

    $('.Case').each((_, element) => {
        const $case = $(element);
        const style = $case.attr('style') || '';
        const leftMatch = style.match(/left:([\d.]+)%/);
        if (!leftMatch || !leftMatch[1]) {
            return;
        }
        const caseLeft = parseFloat(leftMatch[1]);
        if (caseLeft < 100 || caseLeft >= 200) {
            return;
        }

        const dayLeft = sortedDays.filter(l => l <= caseLeft).pop();
        if (dayLeft === undefined) {
            return;
        }
        const eventDate = dayMap.get(dayLeft);
        if (!eventDate) {
            return;
        }

        const time = $case.find('.TChdeb').text().trim().split(' - ');
        if (time.length !== 2 || !time[0] || !time[1]) {
            return;
        }

        const profContents = $case.find('.TCProf').contents()
            .filter(function () { return this.type === 'text' && $(this).text().trim() !== ''; })
            .map(function () { return $(this).text().trim(); }).get();

        const classroomInfo = $case.find('.TCSalle').text().trim();

        const courseName = $case.find('td.TCase').contents()
            .filter(function () { return this.type === 'text' && $(this).text().trim() !== ''; })
            .text().trim();

        const borderColor = $case.find('.innerCase').attr('style')?.match(/border:3px solid\s*([^;]+)/)?.[1] || '';

        if (!courseName) {
            return;
        }

        const specParts = profContents[1] ? profContents[1].split(' - ') : [];

        let classroom: string | null = classroomInfo.replace('Salle:', '').split('(')[0]?.trim() || null;
        let campus: string | null = classroomInfo.match(/\(([^)]+)\)/)?.[1] || null;
        let session_type: string = "in_person";

        if (classroomInfo.includes('(DISTANCIEL)') || classroomInfo.includes('Aucune')) {
            classroom = null;
            campus = null;
            if (classroomInfo.includes('(DISTANCIEL)')) session_type = "remote";
        }

        const dateObj = new Date(eventDate);
        if (isNaN(dateObj.getTime())) throw new Error("Invalid event date");

        const weekDay = WEEK_DAYS[dateObj.getUTCDay()];
        if (!weekDay) throw new Error("Invalid weekday");

        const event = {
            title: courseName.replace(/(\n|\t|\s\s+)/g, ' ').trim(),
            instructor: profContents[0] ? capitalizeName(profContents[0]) : '',
            program: specParts[1]?.trim() || '',
            startTime: `${eventDate}T${time[0]}:00`,
            endTime: `${eventDate}T${time[1]}:00`,
            duration: calculateDuration(time[0], time[1], eventDate),
            weekDay,
            classroom,
            campus: campus || 'Arras',
            deliveryMode: session_type,
            color: borderColor || '#808080',
            classGroup: specParts[0]?.trim() || '',
        };
        events.push(event);
    });

    return events;
}

function areEventsValid(events: Event[]): boolean {
    const valid = events.every(event => {
        const isValid = event.title && event.title.trim() !== '' &&
            event.instructor && event.instructor.trim() !== '' &&
            event.startTime && event.startTime.trim() !== '' &&
            event.endTime && event.endTime.trim() !== '' &&
            event.weekDay && event.weekDay.trim() !== '';
        return isValid;
    });
    return valid;
}

async function scrapeWeek(loginServer: string, credentials: Credentials, scheduleServer: string, query: Record<string, string>, mondayStr: string, maxRetries: number = 3): Promise<Event[]> {
    const client = await createClient(loginServer, credentials);
    let valid = false;
    let events: Event[] = [];
    for (let attempt = 1; attempt <= maxRetries && !valid; attempt++) {
        try {
            const html = await fetchEDTHtml(client, scheduleServer, { ...query, date: mondayStr }, maxRetries);
            events = parseEdtHtml(html, mondayStr);
            valid = areEventsValid(events);
        } catch (err) {
        }
    }
    return valid ? events : [];
}

export async function spawnScheduleWorker(
    loginServer: string,
    scheduleServer: string,
    payload: Payload,
    startDate?: Date,
    endDate?: Date
): Promise<ScheduleResult> {
    try {

        console.log('Worker Spawned')

        const isCasAvailable = await checkCasAvailability(loginServer);
        if (!isCasAvailable) {
            return { status: 'error', error: 'CAS server unavailable' };
        }

        const credentials = decryptToObject<Credentials>(payload);

        const query = {
            action: "posEDTLMS",
            serverID: "C",
            hashURL: "3771E093EFD5A0DB1204B280BBC7F09097D3A41521007FAEB9EAC5AD8905F07DBB230E9FFE9D3A6BF40B157D22E842F91708A3D7950855E83F70CF9A8A4A1CF8",
            Tel: credentials.username,
        };

        const limit = pLimit(parseInt(process.env.WORKER_MAX_CONCURRENT_TASKS || '20'));
        const allEvents: Event[] = [];

        const currentYear = new Date().getFullYear();
        const defaultStart = new Date(
            process.env.WORKER_SCHEDULE_START_DATE || Date.UTC(currentYear, 8, 1) // 1er septembre
        );
        const defaultEnd = new Date(
            process.env.WORKER_SCHEDULE_END_DATE || Date.UTC(currentYear + 1, 7, 30) // 30 août de l'année suivante
        );

        const effectiveStart = startDate ?? defaultStart;
        const effectiveEnd = endDate ?? defaultEnd;

        let currentMonday = getMonday(effectiveStart);
        const endDateObj = effectiveEnd;
        const endFriday = addDays(getMonday(endDateObj), 4);

        const weeks: string[] = [];
        while (currentMonday <= endFriday) {
            const mondayStr = `${(currentMonday.getUTCMonth() + 1).toString().padStart(2, '0')}/${currentMonday.getUTCDate().toString().padStart(2, '0')}/${currentMonday.getUTCFullYear()}`;
            weeks.push(mondayStr);
            currentMonday = addDays(currentMonday, 7);
        }

        const promises = weeks.map(mondayStr =>
            limit(() => {
                return scrapeWeek(loginServer, credentials, scheduleServer, query, mondayStr);
            })
        );

        const results = await Promise.allSettled(promises);
        for (const result of results) {
            if (result.status === 'fulfilled') {
                allEvents.push(...result.value);
            }
        }

        allEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        return { status: 'success', data: allEvents };
    } catch (err) {
        return { status: 'error', error: (err as any).message || 'Unknown error' };
    }
}

export async function testConnection(
    loginServer: string,
    payload: Payload
): Promise<{ status: 'success' | 'error'; message: string }> {
    try {
        const isCasAvailable = await checkCasAvailability(loginServer);
        if (!isCasAvailable) {
            return { status: 'error', message: 'CAS server unavailable' };
        }

        const credentials = decryptToObject<Credentials>(payload);


        const jar = new CookieJar();
        const client = wrapper(axios.create({ jar, withCredentials: true }));

        const getRes = await client.get(loginServer, {
            params: { service: "" },
            headers: { "User-Agent": "nodejs-client", Accept: "text/html" },
        });

        const hidden = await extractHiddenFields(getRes.data);

        const form = new URLSearchParams();
        form.append("username", credentials.username);
        form.append("password", credentials.password);
        for (const [k, v] of Object.entries(hidden)) {
            if (k !== "username" && k !== "password") form.append(k, v);
        }
        if (!form.get("_eventId")) form.append("_eventId", "submit");

        const postRes = await client.post(loginServer, form.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "nodejs-client",
                Accept: "text/html",
            },
            maxRedirects: 0,
            validateStatus: () => true,
        });

        if (postRes.status === 200) {
            return { status: 'success', message: 'Credentials are valid' };
        }

        if (postRes.status === 401 || postRes.data.includes("mot de passe incorrect") || postRes.data.includes("erreur d'authentification")) {
            return { status: 'error', message: 'Invalid credentials' };
        }

        if (isErrorPage(postRes.data)) {
            return { status: 'error', message: 'CAS error page detected' };
        }

        return { status: 'error', message: `Unexpected response (${postRes.status})` };
    } catch (err) {
        return { status: 'error', message: (err as any).message || 'Unknown error' };
    }
}