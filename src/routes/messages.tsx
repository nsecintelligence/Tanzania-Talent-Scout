import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { useSession } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Tanzania Talent Scout" }] }),
  component: Messages,
});

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

async function fetchMessages(userId: string): Promise<Msg[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Msg[];
}

function Messages() {
  const session = useSession();
  const qc = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", session?.user.id],
    queryFn: () => fetchMessages(session!.user.id),
    enabled: !!session,
  });

  async function send() {
    if (!session) return;
    if (!recipient || !body) return toast.error("Recipient user ID and message required");
    const { error } = await supabase.from("messages").insert({
      sender_id: session.user.id,
      recipient_id: recipient,
      body,
    });
    if (error) toast.error(error.message);
    else {
      setBody("");
      toast.success("Message sent");
      qc.invalidateQueries({ queryKey: ["messages"] });
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <SiteNav />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">Sign in to view messages</h1>
          <Button asChild className="mt-6"><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Direct messages with coaches, scouts, players and clubs.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : messages.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                No messages yet. Start a conversation on the right.
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === session.user.id;
                return (
                  <div key={m.id} className={`rounded-xl border border-border/60 p-4 ${mine ? "bg-primary/10" : "bg-card"}`}>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{mine ? "You" : "From: " + m.sender_id.slice(0, 8)}</span>
                      <span>{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-sm">{m.body}</div>
                  </div>
                );
              })
            )}
          </div>

          <aside className="h-fit rounded-xl border border-border/60 bg-card p-5">
            <h3 className="font-display text-lg font-bold">New message</h3>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Recipient user ID</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="UUID of recipient" className="mt-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">Share user IDs from profile pages to start a conversation.</p>
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Hi, I saw your highlights…" className="mt-1.5" />
              </div>
              <Button onClick={send} className="w-full"><Send className="mr-1.5 h-4 w-4" />Send</Button>
            </div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
