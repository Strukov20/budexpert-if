import express from "express";
import requireAdmin from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAdmin, async (_req, res) => {
  // For now promos are configured statically in code.
  // If needed later, we can move this to MongoDB.
  res.json([
    {
      code: "SOCIAL5",
      percent: 5,
      scope: "all_products",
      oneTime: "per_phone",
      source: "social",
    },
  ]);
});

export default router;
