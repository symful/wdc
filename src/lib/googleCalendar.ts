/**
 * Google Calendar API Implementation for ontime!
 * This module handles OAuth2 authentication and calendar synchronization.
 */

// Placeholder for Client ID - User must replace this in Google Cloud Console
const CLIENT_ID = '816409399692-e448gkgt6u3pcedc1cg8maeed4kg2hnv.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

let gapiInited = false;
let gsisInited = false;
let tokenClient: any = null;

/**
 * Initialize GAPI Client
 */
async function initializeGapiClient() {
  return new Promise<void>((resolve) => {
    (window as any).gapi.load('client', async () => {
      await (window as any).gapi.client.init({
        // apiKey: 'YOUR_API_KEY', // Optional if only using OAuth
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
  tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later in requestToken
    error_callback: (err: any) => {
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
  
  return new Promise((resolve) => {
    currentResolve = (res: any) => resolve({ success: res }); // Fallback old cast

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        resolve({ success: false, error: 'Cancelled or auth error.' });
      } else {
        const hasScope = (window as any).google.accounts.oauth2.hasGrantedAllScopes(resp, SCOPES);
        if (!hasScope) {
          resolve({ success: false, error: 'NO_SCOPE' });
        } else {
          resolve({ success: true });
        }
      }
      currentResolve = null;
    };

    try {
      if ((window as any).gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // Force consent to check scopes if things failed previously
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (e) {
      resolve({ success: false, error: 'Failed to request token.' });
      currentResolve = null;
    }
  });
}

/**
 * Sync Events from Current Time to End of Week
 */
export async function syncToGoogleCalendar(
  courses: any[], 
  tasks: any[], 
  onProgress?: (step: number) => void
): Promise<{ success: boolean; error?: string }> {
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
      const calendarsResp = await (window as any).gapi.client.calendar.calendarList.list();
      const existing = calendarsResp.result.items.find((c: any) => c.summary === 'ontime! Academic');
      if (existing) {
        calendarId = existing.id;
      } else {
        const newCal = await (window as any).gapi.client.calendar.calendars.insert({
          resource: { summary: 'ontime! Academic' }
        });
        calendarId = newCal.result.id;
      }
    } catch (err) {
      console.error('Error managing calendar:', err);
    }

    // 2. Prepare Events
    const events: any[] = [];

    // Add Courses
    courses.forEach(course => {
      course.schedules.forEach((sch: any) => {
        const eventDate = new Date(now);
        const targetDay = sch.day === 6 ? 0 : sch.day + 1;
        let daysToAdd = targetDay - now.getDay();
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
      await (window as any).gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Google Calendar Sync Error:", error);
    let errorMsg = 'Unknown error occurred.';
    if (error?.result?.error?.message) {
      errorMsg = error.result.error.message;
    } else if (error instanceof Error) {
      errorMsg = error.message;
    }
    return { success: false, error: errorMsg };
  }
}
