import React, { useState } from "react";
import { base44 } from "@/api/foreform";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, Eye, Edit3, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PERMISSION_META = {
  editor: { label: "Editor", icon: Edit3, description: "Can edit questions & settings", color: "bg-primary/10 text-primary" },
  viewer: { label: "Viewer", icon: Eye, description: "Can view & export responses only", color: "bg-muted text-muted-foreground" },
};

export default function TeamAccessPanel({ formId, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("viewer");

  const { data: shares = [], isLoading } = useQuery({
    queryKey: ["form-shares", formId],
    queryFn: () => base44.entities.FormShare.filter({ form_id: formId }),
    enabled: !!formId,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.FormShare.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-shares", formId] });
      setEmail("");
      toast.success("Access granted");
    },
    onError: () => toast.error("Failed to add team member"),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.FormShare.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-shares", formId] });
      toast.success("Access revoked");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, permission }) => base44.entities.FormShare.update(id, { permission }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["form-shares", formId] }),
  });

  const handleAdd = () => {
    if (!email.trim()) return;
    if (email.trim() === currentUserEmail) { toast.error("You already own this form"); return; }
    if (shares.some((s) => s.shared_with_email === email.trim())) { toast.error("This user already has access"); return; }
    addMutation.mutate({
      form_id: formId,
      shared_with_email: email.trim().toLowerCase(),
      permission,
      shared_by: currentUserEmail,
    });
  };

  return (
    <div className="space-y-5">
      {/* Owner row */}
      <div className="flex items-center gap-3 p-3 bg-accent/40 rounded-xl">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Crown className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{currentUserEmail}</p>
          <p className="text-xs text-muted-foreground">Form Owner</p>
        </div>
        <Badge className="bg-primary/10 text-primary text-xs">Owner</Badge>
      </div>

      {/* Existing shares */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading team…
        </div>
      ) : shares.length > 0 ? (
        <div className="space-y-2">
          {shares.map((share) => {
            const meta = PERMISSION_META[share.permission] || PERMISSION_META.viewer;
            const Icon = meta.icon;
            return (
              <div key={share.id} className="flex items-center gap-3 p-3 border border-border rounded-xl bg-card">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{share.shared_with_email}</p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                <Select
                  value={share.permission}
                  onValueChange={(val) => updateMutation.mutate({ id: share.id, permission: val })}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={() => removeMutation.mutate(share.id)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No team members yet</p>
      )}

      {/* Add new */}
      <div className="border-t border-border pt-4 space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Plus className="w-4 h-4" /> Invite a team member
        </Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Select value={permission} onValueChange={setPermission}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">
                <span className="flex items-center gap-1.5"><Edit3 className="w-3 h-3" />Editor</span>
              </SelectItem>
              <SelectItem value="viewer">
                <span className="flex items-center gap-1.5"><Eye className="w-3 h-3" />Viewer</span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={addMutation.isPending || !email.trim()} className="gap-1.5">
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(PERMISSION_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <div key={key} className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${meta.color}`}>
                <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{meta.label}</p>
                  <p className="opacity-80">{meta.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}