import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import request from "supertest";

// Stub env before importing the module under test
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.JWT_SECRET = "test-jwt-secret-for-vitest-only";

// JWT helpers reais (extraídos de _core/adminAuth) — o app Express abaixo
// recria apenas as rotas, que ainda vivem inline em _core/index.ts.
import { SignJWT } from "jose";
import { ADMIN_COOKIE, signAdminToken, verifyAdminToken } from "./_core/adminAuth";

// Build a minimal Express app with the same admin routes
function buildTestApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body as { password?: string };
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      res.status(500).json({ error: "ADMIN_PASSWORD não configurado" });
      return;
    }
    const trimmedEnvPassword = adminPassword.trim();
    if (!password || password !== trimmedEnvPassword) {
      res.status(401).json({ error: "Senha incorreta" });
      return;
    }
    const token = await signAdminToken();
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ success: true });
  });

  app.post("/api/admin/logout", (_req, res) => {
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/admin/me", async (req, res) => {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token) {
      res.json({ authenticated: false });
      return;
    }
    const valid = await verifyAdminToken(token);
    res.json({ authenticated: valid });
  });

  return app;
}

describe("Admin Auth Endpoints", () => {
  let app: express.Application;

  beforeAll(() => {
    app = buildTestApp();
  });

  it("GET /api/admin/me returns authenticated: false when no cookie", async () => {
    const res = await request(app).get("/api/admin/me");
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  it("POST /api/admin/login returns 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Senha incorreta");
  });

  it("POST /api/admin/login returns 401 for empty password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "" });
    expect(res.status).toBe(401);
  });

  it("POST /api/admin/login sets cookie and returns success for correct password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "test-admin-password" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(Array.isArray(setCookie) ? setCookie[0] : setCookie).toContain("admin_session=");
  });

  it("GET /api/admin/me returns authenticated: true after login", async () => {
    // Login first
    const loginRes = await request(app)
      .post("/api/admin/login")
      .send({ password: "test-admin-password" });
    const cookie = loginRes.headers["set-cookie"];

    // Check auth
    const meRes = await request(app)
      .get("/api/admin/me")
      .set("Cookie", Array.isArray(cookie) ? cookie[0] : cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.authenticated).toBe(true);
  });

  it("POST /api/admin/logout clears the cookie", async () => {
    // Login first
    const loginRes = await request(app)
      .post("/api/admin/login")
      .send({ password: "test-admin-password" });
    const cookie = loginRes.headers["set-cookie"];

    // Logout
    const logoutRes = await request(app)
      .post("/api/admin/logout")
      .set("Cookie", Array.isArray(cookie) ? cookie[0] : cookie);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    const clearedCookie = logoutRes.headers["set-cookie"];
    // Cookie should be cleared (expires in the past or empty value)
    expect(Array.isArray(clearedCookie) ? clearedCookie[0] : clearedCookie).toContain("admin_session=");
  });

  it("JWT token verification works correctly", async () => {
    const token = await signAdminToken();
    const valid = await verifyAdminToken(token);
    expect(valid).toBe(true);
  });

  it("JWT token with wrong secret fails verification", async () => {
    // Create token with different secret
    const wrongSecret = new TextEncoder().encode("wrong-secret");
    const badToken = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(wrongSecret);
    const valid = await verifyAdminToken(badToken);
    expect(valid).toBe(false);
  });
});
