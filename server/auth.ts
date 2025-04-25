import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'onsight-app-secret',
    resave: false,
    saveUninitialized: false,
    name: 'onsight.sid',
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      path: '/'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // For development purposes - support both hashed and unhashed passwords
        // This allows existing accounts with plaintext passwords to still work
        let isValidPassword = false;
        
        if (user.password.includes('.')) {
          // Hashed password
          isValidPassword = await comparePasswords(password, user.password);
        } else {
          // Plain text password for development/testing
          isValidPassword = user.password === password;
        }
        
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      try {
        // Validate the user input using insertUserSchema
        const userData = insertUserSchema.parse(req.body);
        
        // Additional validation for business hours format
        const businessHours = JSON.parse(userData.businessHours);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: error.errors });
        }
        throw error;
      }
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password for security
      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Explicitly set the userId in the session
        req.session.userId = user.id;
        
        // Save the session to ensure it's properly stored
        req.session.save(saveErr => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Failed to save session" });
          }
          
          // Don't send the password back
          const { password, ...userWithoutPassword } = user;
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message?: string } | undefined) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ message: "Internal server error during login" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return res.status(500).json({ message: "Failed to establish login session" });
        }
        
        // Explicitly set the userId in the session
        req.session.userId = user.id;
        
        // Save the session to ensure it's properly stored
        req.session.save(err => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Failed to save session" });
          }
          
          // Don't send the password back
          const { password, ...userWithoutPassword } = user;
          console.log("Login successful:", userWithoutPassword);
          return res.status(200).json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    // Clear the session userId
    if (req.session) {
      req.session.userId = undefined;
    }
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      
      // Destroy the session
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
          return res.status(500).json({ message: "Failed to destroy session" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Support both /api/me and /api/user endpoints for compatibility
  const getCurrentUser = (req: Request, res: Response) => {
    console.log("Request for current user, authenticated:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Don't send the password back
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    console.log("Current user:", userWithoutPassword);
    res.json(userWithoutPassword);
  };

  app.get("/api/me", getCurrentUser);
  app.get("/api/user", getCurrentUser);
}