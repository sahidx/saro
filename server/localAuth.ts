import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { db } from "./db";
import { users, teacherProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Local authentication implementation for the coach management system.
 *
 * This module replicates much of the session handling logic from the
 * Replit‐specific OIDC implementation but removes the external dependency
 * on Replit. Instead of delegating authentication to an identity provider,
 * it verifies credentials against the database and maintains user identity
 * via an HTTP session. The goal is to mirror the high‑level behaviour
 * (session persistence, user lookup, and logout) of the original
 * `replitAuth.ts` while operating entirely within your own infrastructure.
 */

// Helper to construct a PostgreSQL‐backed session store. The TTL (time to
// live) matches the original implementation – sessions will persist for
// seven days unless explicitly terminated.
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "development-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    // Mirror the original session behaviour: set rolling to true so
    // expiration is refreshed on each request and use the same cookie name.
    rolling: true,
    name: "coaching.sid",
    cookie: {
      httpOnly: true,
      secure: false, // Set to true behind HTTPS in production
      maxAge: sessionTtl,
    },
  });
}

/**
 * Establishes local session–based authentication routes on the provided
 * Express application. This function registers session middleware and adds
 * handlers for login and logout. Successful logins populate
 * `req.session.user` with a minimal user object; logouts destroy the
 * session and clear the session cookie.
 *
 * @param app Express application instance
 */
export async function setupLocalAuth(app: Express) {
  // Trust the reverse proxy when behind one (consistent with the original code)
  app.set("trust proxy", 1);
  app.use(getSession());

  /**
   * Handler function for authenticating a user via phone number and
   * password. This function encapsulates the core login logic so it can
   * be reused whether or not a rate‑limiting middleware is present.
   */
  const loginHandler = async (req: any, res: any) => {
    try {
      const { phoneNumber, password } = req.body || {};
      if (!phoneNumber || !password) {
        return res.status(400).json({ message: "Phone number and password required" });
      }

      // Log the incoming login attempt for debugging and parity with the
      // original implementation in routes.ts.
      console.log(`🔐 Login attempt for phone: ${phoneNumber}`);
      const usersFound = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
      if (!usersFound || usersFound.length === 0) {
        console.log(`❌ User not found for phone: ${phoneNumber}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const user = usersFound.find(u => u.role === "teacher") || usersFound[0];
      let isValidPassword = false;
      if (user.role === "teacher") {
        try {
          const bcrypt = await import("bcrypt");
          isValidPassword = await bcrypt.compare(password, (user as any).password);
        } catch (bcryptError) {
          isValidPassword = (user as any).password === password;
        }
      } else if (user.role === "student") {
        isValidPassword = (user as any).studentPassword === password;
      } else if (user.role === "super_user") {
        isValidPassword = (user as any).password === password;
      }
      if (!isValidPassword) {
        console.log(`❌ Invalid password for user: ${phoneNumber}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log(`✅ Login successful for user: ${user.firstName} ${user.lastName} (${user.role})`);

      await storage.upsertUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: (user as any).profileImageUrl || undefined,
      });
      // Derive the teacher's avatar URL if available. When the database
      // endpoint is disabled, fall back to undefined. This mirrors the
      // behaviour of the original login route, which references
      // `tempTeacherProfile.avatarUrl` for teachers.
      let avatarUrl: string | undefined = undefined;
      if (user.role === "teacher") {
        try {
          const profile = await db
            .select({ avatarUrl: teacherProfiles.avatarUrl })
            .from(teacherProfiles)
            .where(eq(teacherProfiles.userId, user.id))
            .limit(1);
          avatarUrl = profile[0]?.avatarUrl;
        } catch {
          // If the query fails, leave avatarUrl undefined.
        }
      }
      // Compose a session user object consistent with routes.ts. Include
      // `name` and `avatarUrl` fields for feature parity.
      const sessionUser = {
        id: user.id,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        smsCredits: (user as any).smsCredits || 0,
        avatarUrl: avatarUrl,
      };
      req.session.user = sessionUser;
      return res.json({ success: true, user: sessionUser });
    } catch (error) {
      console.error("Local login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  };

  // Expose the login route. If the application has attached a rate limiter
  // under the key `loginLimiter`, use it. Otherwise, register the handler
  // directly.
  const loginLimiter = (app as any).get && (app as any).get("loginLimiter");
  if (loginLimiter) {
    app.post("/api/auth/login", loginLimiter, loginHandler);
  } else {
    app.post("/api/auth/login", loginHandler);
  }

  // Register the logout route under the `/api/auth/logout` path. This mirrors
  // the existing `/api/auth/login` prefix used throughout the project.
  app.get("/api/auth/logout", (req: any, res: any) => {
    if (!req.session) {
      return res.redirect("/");
    }
    req.session.destroy((destroyErr: any) => {
      if (destroyErr) {
        console.error("Session destroy error:", destroyErr);
      }
      res.clearCookie("connect.sid", { path: "/" });
      return res.redirect("/");
    });
  });
}

/**
 * Middleware to ensure that a user is authenticated. If `req.session.user`
 * exists, the request proceeds; otherwise, a 401 Unauthorized response is
 * returned. This is a pared‑down analogue of the `isAuthenticated`
 * function from the OIDC flow, without token refreshing.
 */
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const sessionUser = (req as any).session?.user;
  if (!sessionUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};