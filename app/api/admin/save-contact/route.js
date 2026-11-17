import { getAdmin, adminCanAccess, getUserById, db, save, emitToAdmins, invalidateUserSessions } from "@/lib/db";
import { remote, remoteOn } from "@/lib/remote";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const admin = await getAdmin();
  if (!admin) return Response.json({ success: false }, { status: 401 });
  let b = {};
  try { b = await req.json(); } catch {}
  const userId = Number(b.userId);
  const name = String(b.name || "").trim().slice(0, 80);
  const user = await getUserById(userId);
  if (!user || !name) return Response.json({ success: false, error: "Bad request" }, { status: 400 });
  if (!adminCanAccess(admin, user)) return Response.json({ success: false, error: "Not your user" }, { status: 403 });
  if (remoteOn) await remote.patchUser(userId, { display_name: name });
  else {
    db.users[userId].display_name = name;
    save();
  }
  invalidateUserSessions(userId);
  const u = { ...user, display_name: name };
  emitToAdmins(u, "user", { userId, user: { id: userId, display_name: name } });
  return Response.json({ success: true, user: { id: userId, display_name: name } });
}
