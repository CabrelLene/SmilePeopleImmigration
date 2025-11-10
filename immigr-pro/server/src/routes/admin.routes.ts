// server/src/routes/admin.routes.ts
import { Router, type Request, type Response } from "express";
import Application from "../models/Application.js";

const router = Router();

// Si tu as un middleware d’admin, branche-le ici :
// import { adminRequired } from "../utils/adminRequired.js";
// router.use(adminRequired);

/** Helpers */
function buildFilter(q?: string, status?: string) {
  const f: Record<string, any> = {};
  if (status && status !== "all") f.status = status;
  if (q && q.trim()) {
    const rx = new RegExp(q.trim(), "i");
    // on filtre par programme ici ; le nom/email seront filtrés après populate user
    f.$or = [{ programSuggestion: rx }];
  }
  return f;
}

function audit(res: Response, action: string, details: Record<string, any> = {}) {
  // Remplace par une vraie collection "AdminAudit" si besoin
  const adminId = (res.locals?.user && (res.locals.user as any)._id) || "unknown-admin";
  // eslint-disable-next-line no-console
  console.log(`[AUDIT] ${new Date().toISOString()} | ${action} | by=${adminId}`, details);
}

/** GET /api/admin/apps — liste paginée + recherche + tri serveur */
router.get("/apps", async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const status = (req.query.status as string) || "all";
    const sortKey = (req.query.sort as string) || "createdAt";
    const dir = (req.query.dir as string) === "asc" ? 1 : -1;
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt((req.query.pageSize as string) || "8", 10)));

    const filter = buildFilter(q, status);

    // tri serveur sur champs de l'application
    const sortMap: Record<string, any> = {
      createdAt: { createdAt: dir },
      updatedAt: { updatedAt: dir },
      status: { status: dir },
      score: { score: dir, createdAt: -1 },
      budgetEstimate: { budgetEstimate: dir, createdAt: -1 },
      name: { createdAt: dir }, // tri par nom après populate
    };
    const sortObj = sortMap[sortKey] || { createdAt: -1 };

    const [items, total] = await Promise.all([
      Application.find(filter)
        .sort(sortObj)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate("user", "fullName email photoUrl")
        .lean(),
      Application.countDocuments(filter),
    ]);

    let out = items as any[];

    // filtre regexp sur nom/email si q présent
    if (q && q.trim()) {
      const rx = new RegExp(q.trim(), "i");
      out = out.filter(
        (a) =>
          rx.test(a.programSuggestion || "") ||
          rx.test(a?.user?.fullName || "") ||
          rx.test(a?.user?.email || "")
      );
    }

    // tri par nom si demandé (après populate)
    if (sortKey === "name") {
      out.sort((a, b) => {
        const va = (a?.user?.fullName || a?.user?.email || "").toLowerCase();
        const vb = (b?.user?.fullName || b?.user?.email || "").toLowerCase();
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }

    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    res.json({
      items: out.map((a) => ({
        _id: a._id,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        programSuggestion: a.programSuggestion,
        budgetEstimate: a.budgetEstimate,
        score: a.score,
        user: a.user
          ? {
              _id: a.user._id,
              fullName: a.user.fullName,
              email: a.user.email,
              photoUrl: a.user.photoUrl,
            }
          : undefined,
        answers: a.answers,
        // "files" est un tableau de sous-documents, pas besoin de populate
        files: (a.files || []).map((f: any) => ({
          id: f.id || f._id,
          url: f.url,
          name: f.name,
          size: f.size,
          mimeType: f.mimeType,
        })),
      })),
      total,
      page,
      pageSize,
      pageCount,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

/** PATCH /api/admin/apps/:id — maj admin (statut, programme, budget, counselor, score…) */
router.patch("/apps/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};

    const updated = await Application.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true }
    )
      .populate("user", "fullName email photoUrl")
      .lean();

    if (!updated) return res.status(404).json({ error: "Not found" });

    // Audit + temps réel
    audit(res, "admin.update", { id, payload });
    const io = req.app.get("io"); // défini dans index.ts => app.set("io", io);
    io?.emit("app:updated", { id });

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

/** POST /api/admin/apps/:id/notes — ajouter une note (placeholder) */
router.post("/apps/:id/notes", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { text } = req.body || {};
    audit(res, "admin.addNote", { id, text });

    const io = req.app.get("io");
    io?.emit("app:updated", { id });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

export default router;
