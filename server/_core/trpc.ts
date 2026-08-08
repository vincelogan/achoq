import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ADMIN_COOKIE, verifyAdminToken } from "./adminAuth";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * Admin tem DUAS portas de entrada independentes:
 * 1) Usuário Manus OAuth com role='admin' na tabela users;
 * 2) Sessão de senha do painel /admin (cookie ADMIN_COOKIE, ver adminAuth.ts) —
 *    é o fluxo que o dono do site realmente usa (login por senha em /admin,
 *    sem precisar de conta Manus). Sem checar essa segunda via aqui, todo o
 *    router `admin.*` fica inacessível para quem loga só pela senha.
 */
async function isPasswordAdminRequest(req: TrpcContext["req"]): Promise<boolean> {
  const token = (req as any)?.cookies?.[ADMIN_COOKIE];
  if (!token) return false;
  return verifyAdminToken(token);
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const isOAuthAdmin = ctx.user?.role === 'admin';
    const isPasswordAdmin = isOAuthAdmin ? false : await isPasswordAdminRequest(ctx.req);

    if (!isOAuthAdmin && !isPasswordAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
