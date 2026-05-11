"use client";

import * as React from "react";
import { Activity } from "lucide-react";
import { Button, Input } from "@/components/ui/core";

export interface LoginFormProps {
  onSignIn?: (email: string) => void;
  formRef?: React.Ref<HTMLFormElement>;
  firstInputRef?: React.Ref<HTMLInputElement>;
}

export default function LoginForm({ onSignIn, formRef, firstInputRef }: LoginFormProps) {
  const [email, setEmail] = React.useState("alpha-1@field.ops");
  const [pass, setPass] = React.useState("xxxxxxxxxxxx");
  const [err, setErr] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) {
      setErr("Both fields required");
      return;
    }
    setErr(null);
    onSignIn?.(email);
  };

  return (
    <form ref={formRef} onSubmit={submit}>
      {/* Email field */}
      <div className="mb-rt-pad-sm">
        <label className="field-label">Operator email</label>
        <Input
          ref={firstInputRef}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="rig.ops@example.com"
        />
      </div>

      {/* Password field */}
      <div className="mb-rt-gap-sm">
        <label className="field-label">Passphrase</label>
        <Input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {err && (
        <div className="font-['Barlow',sans-serif] text-fs-12 text-(--theme-critical) mb-rt-gap-sm">
          {err}
        </div>
      )}

      {/* Submit */}
      <Button intent="primary" size="xl" fullWidth type="submit" className="mt-rt-gap-sm">
        Enter Control Room
        <Activity size={14} strokeWidth={2} />
      </Button>
    </form>
  );
}
