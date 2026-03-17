import type { AcademicCourse } from '../store/useAcademicStore';
import type { Task } from '../store/useTaskStore';

// Google API Types
interface GapiClient {
  load(api: string, callback: () => void): void;
  client: {
    init(config: { discoveryDocs: string[] }): Promise<void>;
    getToken(): { access_token: string } | null;
    calendar: {
      calendarList: {
        list(): Promise<{ result: { items: { id: string; summary: string }[] } }>;
      };
      calendars: {
        insert(config: { resource: { summary: string } }): Promise<{ result: { id: string } }>;
      };
      events: {
        insert(config: { calendarId: string; resource: unknown }): Promise<void>;
      };
    };
  };
}

interface TokenClient {
  callback?: (resp: { error?: string }) => Promise<void>;
  requestAccessToken(config: { prompt: string }): void;
}

const CLIENT_ID = '816409399692-e448gkgt6u3pcedc1cg8maeed4kg2hnv.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let gapiInited = false;
let gsisInited = false;
let tokenClient: TokenClient | null = null;

/**
 * Initialize GAPI Client
 */
async function initializeGapiClient() {
  const gapi = (window as unknown as { gapi: GapiClient }).gapi;
  return new Promise<void>((resolve) => {
    gapi.load('client', async () => {
      await gapi.client.init({
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      });
      gapiInited = true;
      resolve();
    });
  });
}

let currentResolve: ((res: boolean) => void) | null = null;

/**
 * Initialize GSIS Client
 */
function initializeGsisClient() {
  const google = (window as unknown as { google: { accounts: { oauth2: { initTokenClient(config: unknown): TokenClient, hasGrantedAllScopes(resp: unknown, scope: string): boolean } } } }).google;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later in requestToken
    error_callback: (err: unknown) => {
      console.warn('Google Auth Error:', err);
      if (currentResolve) {
        currentResolve(false);
        currentResolve = null;
      }
    }
  });
  gsisInited = true;
}

/**
 * Request Access Token
 */
async function requestToken(): Promise<{ success: boolean; error?: string }> {
  if (!gsisInited) initializeGsisClient();
  if (!tokenClient) return { success: false, error: 'Auth client not initialized.' };
  
  const gapi = (window as unknown as { gapi: GapiClient }).gapi;
  const google = (window as unknown as { google: { accounts: { oauth2: { hasGrantedAllScopes(resp: unknown, scope: string): boolean } } } }).google;

  return new Promise((resolve) => {
    currentResolve = (res: boolean) => resolve({ success: res });

    tokenClient!.callback = async (resp: { error?: string }) => {
      if (resp.error !== undefined) {
        resolve({ success: false, error: 'Cancelled or auth error.' });
      } else {
        const hasScope = google.accounts.oauth2.hasGrantedAllScopes(resp, SCOPES);
        if (!hasScope) {
          resolve({ success: false, error: 'NO_SCOPE' });
        } else {
          resolve({ success: true });
        }
      }
      currentResolve = null;
    };

    try {
      if (gapi.client.getToken() === null) {
        tokenClient!.requestAccessToken({ prompt: 'consent' });
      } else {
        // Force consent to check scopes if things failed previously
        tokenClient!.requestAccessToken({ prompt: '' });
      }
    } catch {
      resolve({ success: false, error: 'Failed to request token.' });
      currentResolve = null;
    }
  });
}

/**
 * Sync Events from Current Time to End of Week
 */
export async function syncToGoogleCalendar(
  courses: AcademicCourse[], 
  tasks: Task[], 
  onProgress?: (step: number) => void
): Promise<{ success: boolean; error?: string }> {
  const gapi = (window as unknown as { gapi: GapiClient }).gapi;
  try {
    if (!gapiInited) await initializeGapiClient();
    
    if (onProgress) onProgress(0); // Authentication
    const authResult = await requestToken();
    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    if (onProgress) onProgress(1); // Fetching Data

    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    // 1. Get or Create "ontime! Academic" Calendar
    let calendarId = 'primary';
    try {
      const calendarsResp = await gapi.client.calendar.calendarList.list();
      const existing = calendarsResp.result.items.find((c) => c.summary === 'ontime! Academic');
      if (existing) {
        calendarId = existing.id;
      } else {
        const newCal = await gapi.client.calendar.calendars.insert({
          resource: { summary: 'ontime! Academic' }
        });
        calendarId = newCal.result.id;
      }
    } catch (err) {
      console.error('Error managing calendar:', err);
    }

    // 2. Prepare Events
    const events: unknown[] = [];

    // Add Courses
    courses.forEach(course => {
      course.schedules.forEach((sch) => {
        const eventDate = new Date(now);
        const targetDay = sch.day === 6 ? 0 : sch.day + 1;
        const daysToAdd = targetDay - now.getDay();
        if (daysToAdd < 0) return; // Only upcoming in current week

        eventDate.setDate(now.getDate() + daysToAdd);
        
        const start = new Date(eventDate);
        const [startH, startM] = sch.startTime.split(':');
        start.setHours(parseInt(startH), parseInt(startM), 0);

        const end = new Date(eventDate);
        const [endH, endM] = sch.endTime.split(':');
        end.setHours(parseInt(endH), parseInt(endM), 0);

        events.push({
          summary: `[OnTime] ${course.name}`,
          description: `Room: ${sch.room}\nLecturer: ${sch.lecturer}\nType: ${course.type}`,
          start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        });
      });
    });

    // Add Tasks
    tasks.forEach(task => {
      if (task.status === 'done') return;
      const deadline = new Date(task.deadline);
      if (deadline >= now && deadline <= endOfWeek) {
        const start = new Date(deadline);
        start.setHours(start.getHours() - 1);

        events.push({
          summary: `[OnTime] MISSION: ${task.title}`,
          description: `Priority: ${task.priority}\nType: ${task.type}`,
          start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: deadline.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        });
      }
    });

    if (onProgress) onProgress(2); // Uploading

    // 3. Push to Google Calendar
    for (const event of events) {
      await gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Google Calendar Sync Error:", error);
    let errorMsg = 'Unknown error occurred.';
    
    interface GapiError {
      result?: {
        error?: {
          message?: string;
        };
      };
    }

    if ((error as GapiError)?.result?.error?.message) {
      errorMsg = (error as GapiError).result!.error!.message!;
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    return { success: false, error: errorMsg };
  }
}

