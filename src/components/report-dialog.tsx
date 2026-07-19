import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth-store";
import { reportSchema, auditLog } from "@/lib/security";

type Props = {
  targetType: "player" | "video" | "message" | "user";
  targetId: string;
  label?: string;
};

export function ReportDialog({ targetType, targetId, label = "Report" }: Props) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!session) return toast.error("Sign in to report content");
    const parsed = reportSchema.safeParse({ reason, details: details || undefined, target_type: targetType, target_id: targetId });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const { error } = await supabase.from("content_reports").insert({
        reporter_id: session.user.id,
        target_type: targetType,
        target_id: targetId,
        reason: parsed.data.reason,
        details: parsed.data.details ?? null,
      });
      if (error) throw error;
      await auditLog("content.report", targetType, targetId, { reason: parsed.data.reason });
      toast.success("Report submitted — admins will review");
      setOpen(false); setReason(""); setDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Report failed");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Flag className="mr-1 h-3.5 w-3.5" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. spam, abuse, misinformation" maxLength={100} />
          </div>
          <div>
            <Label htmlFor="details">Details (optional)</Label>
            <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={4} />
            <div className="mt-1 text-right text-xs text-muted-foreground">{details.length}/1000</div>
          </div>
          <Button className="w-full" disabled={loading} onClick={submit}>Submit report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
