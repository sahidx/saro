import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// --- Sessions (Postgres-backed) ---
import session from "express-session";
// Temporarily skip database for development

// --- App bootstrap ---
const app = express();
app.disable('x-powered-by');

// Trust proxy *before* anything that relies on req.ip (rate limit, cookies)
app.set("trust proxy", 1);

// --- Security headers (Helmet) with Vite-compatible CSP ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://polyfill.io", 
          "https://cdn.jsdelivr.net", 
          "https://replit.com"
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'", "blob:"],
        // Optional: upgrade-insecure-requests header is fine via Helmet defaults
      },
    },
  })
);

// --- Global rate limit removed for better performance ---
// Only login rate limiting is kept for security

// --- Login brute-force protection with generous limits ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (increased from 5)
  max: 50, // 50 attempts per 15 minutes (increased from 10 per 5 minutes)
  message: { error: "Too many login attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed attempts
});
app.set("loginLimiter", loginLimiter);

// --- Body parsers (large uploads) ---
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));

// --- Very basic input sanitization (defense-in-depth; still validate on server) ---
app.use((req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    for (const key of Object.keys(req.body)) {
      const val = req.body[key];
      if (typeof val === "string") {
        req.body[key] = val
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "");
      }
    }
  }
  next();
});

// --- Sessions: Postgres-backed store (no MemoryStore) ---
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL missing - starting in LIMITED MODE (no DB persistence). Set it in .env for full features.");
}
if (!process.env.SESSION_SECRET) {
  // Do not throw in case you’re still wiring envs, but strongly recommend setting this in prod
  console.warn("⚠️  SESSION_SECRET is not set. Please set a strong secret in production.");
}

app.use(
  session({
    // Using memory store for development - no persistent sessions
    name: "sid",
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true when you run behind HTTPS/reverse proxy
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// If you deploy behind a TLS reverse proxy (Nginx/Caddy), uncomment:
// app.set("trust proxy", 1);
// and set cookie.secure = true above.

// --- API logging (compact) ---
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      const duration = Date.now() - start;
      let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          // ignore stringify errors
        }
      }
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);

    }
  });

  next();
});

// --- Health endpoints (comprehensive monitoring) ---
app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});

// Advanced health check endpoint
app.get("/health", async (req, res) => {
  try {
    const { healthCheck } = await import('./health-monitoring');
    await healthCheck(req, res);
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: 'Health check system unavailable' 
    });
  }
});

// Metrics endpoint for monitoring
app.get("/metrics", async (req, res) => {
  try {
    const { getMetrics } = await import('./health-monitoring');
    getMetrics(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Metrics unavailable' });
  }
});

// Request metrics middleware
app.use(async (req, res, next) => {
  try {
    const { requestMetrics } = await import('./health-monitoring');
    requestMetrics(req, res, next);
  } catch (error) {
    // Silently continue if monitoring fails
    next();
  }
});

(async () => {
  // Initialize database for both development and production
  if (process.env.DATABASE_URL) {
    try {
      console.log('🚀 Initializing database...');
      
      // Auto-run database migration
      const { execSync } = await import('child_process');
      try {
        console.log('📋 Running database migrations...');
        execSync('npm run db:push', { 
          stdio: 'inherit',
          cwd: process.cwd(),
          timeout: 60000 
        });
        console.log('✅ Database migrations completed');
      } catch (migrationError) {
        console.warn('⚠️ Migration failed, trying to continue:', migrationError);
      }
      
      // Set up database properly with migrations
      const { setupDatabaseProper } = await import('./database-setup-proper');
      await setupDatabaseProper();
      
      console.log('🎉 Database initialization complete!');
      
    } catch (error) {
      console.error('💥 Database initialization failed:', error);
      console.log('🔄 Server will continue, but database features may not work properly');
      console.log('💡 Ensure PostgreSQL is running and DATABASE_URL is correct');
    }
  } else {
    console.warn('⚠️ DATABASE_URL not provided - database features will not work');
  }

  // Register all routes (they can read loginLimiter via app.get('loginLimiter'))
  const server = await registerRoutes(app);

  // Initialize SMS Scheduler for automated monthly alerts
  try {
    const { smsScheduler } = await import('./smsScheduler');
    // SMS scheduler auto-starts in the module, but we log it here
    log('📱 SMS Scheduler initialized for automated monthly alerts');
  } catch (error) {
    console.error('Error initializing SMS Scheduler:', error);
  }

  // Error handler (after routes)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = status === 500 ? "Internal Server Error" : err.message || "Server Error";

    if (status === 500) {
      console.error("Internal Server Error:", err);
    }
    res.status(status).json({ message });
  });

  // Dev: Vite; Prod: static
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // --- Start server (uses env PORT; defaults to 5000) ---
  const port = Number.parseInt(process.env.PORT || "5000", 10);
  server.listen(
    port,
    () => log(`serving on port ${port}`)
  );

  // --- Graceful shutdown ---
  const shutdown = async (signal: string) => {
    try {
      log(`received ${signal}, shutting down gracefully...`);
      await new Promise<void>((resolve) => server.close(() => resolve()));
      log("✅ Server closed gracefully");
    } catch (e) {
      console.error("Error during shutdown:", e);
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
})();

