import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, ApprovalStatus } from "@shared/schema";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const MemoryStoreSession = MemoryStore(session);
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fitness-pos-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // 24시간마다 만료된 세션 정리
    }),
    cookie: {
      maxAge: 8 * 60 * 60 * 1000, // 8시간
      httpOnly: true,
      sameSite: "lax"
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
        
        // 사용자가 없거나 비밀번호가 일치하지 않는 경우
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "아이디 또는 비밀번호가 올바르지 않습니다." });
        }
        
        // 승인되지 않은 계정인 경우
        if (user.approvalStatus !== ApprovalStatus.APPROVED) {
          return done(null, false, { message: "계정이 아직 승인되지 않았습니다. 관리자 승인을 기다려주세요." });
        }
        
        // 로그인 성공 시 마지막 로그인 시간 업데이트
        await storage.updateUser(user.id, { lastLogin: new Date() });
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
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
      done(error);
    }
  });

  // 사용자 로그인 API
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "로그인에 실패했습니다." });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // 보안을 위해 비밀번호와 토큰 정보는 제외하고 반환
        const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
        return res.json(safeUser);
      });
    })(req, res, next);
  });

  // 로그아웃 API
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다." });
      }
      
      res.json({ message: "로그아웃 되었습니다." });
    });
  });

  // 현재 로그인된 사용자 정보 확인 API
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    // 보안을 위해 비밀번호와 토큰 정보는 제외하고 반환
    const { password, resetToken, resetTokenExpiry, ...safeUser } = req.user;
    res.json(safeUser);
  });

  // 인증 미들웨어
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 인증이 필요한 API 경로에 대한 처리
    if (req.path.startsWith('/api/') && 
        !req.path.startsWith('/api/login') && 
        !req.path.startsWith('/api/register') && 
        !req.path.startsWith('/api/reset-password') && 
        !req.path.startsWith('/api/change-password') && 
        !req.path.startsWith('/api/categories') && 
        !req.path.startsWith('/api/products') && 
        !req.isAuthenticated()) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }
    
    next();
  });
}

// 인증 필요 미들웨어
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "로그인이 필요합니다." });
}

// 관리자 권한 필요 미들웨어
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  
  res.status(403).json({ message: "관리자 권한이 필요합니다." });
}