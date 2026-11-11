// Shared by the server and the browser (no React here).

/** Guests can send this many chat messages a day; a free account has no daily limit.
 *  Shown in the app; the real limit is enforced in the database (guest_limits), so keep the two in step. */
export const GUEST_DAILY_MESSAGES = 20;

/** Where "Create a free account" leads a guest. Their chats and settings stay. */
export const UPGRADE_PATH = "/upgrade";
