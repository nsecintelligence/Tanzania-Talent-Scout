import { createFileRoute } from "@tanstack/react-router";

// Runs daily. Two-stage account hygiene:
//   1) Profiles inactive for 30+ days are flagged (inactivity_alerted_at set).
//   2) Profiles already alerted 30+ days ago (i.e. ~60 days total inactivity)
//      get their auth user deleted, which cascades to profile rows.
export const Route = createFileRoute("/api/public/hooks/inactivity-check")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const now = Date.now();
        const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();

        // Stage 1: alert newly inactive accounts.
        const { data: toAlert } = await supabaseAdmin
          .from("profiles")
          .select("id, display_name")
          .lt("last_active_at", thirtyDaysAgo)
          .is("inactivity_alerted_at", null);

        let alerted = 0;
        for (const p of toAlert ?? []) {
          await supabaseAdmin
            .from("profiles")
            .update({ inactivity_alerted_at: new Date().toISOString() })
            .eq("id", p.id);
          alerted++;
        }

        // Stage 2: delete accounts that were alerted 30+ days ago and never returned.
        const { data: toDelete } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .lt("last_active_at", thirtyDaysAgo)
          .lt("inactivity_alerted_at", thirtyDaysAgo);

        let deleted = 0;
        for (const p of toDelete ?? []) {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(p.id);
          if (!error) deleted++;
        }

        return new Response(
          JSON.stringify({ ok: true, alerted, deleted, ranAt: new Date().toISOString() }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
