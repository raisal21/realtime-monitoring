"use client";

import * as React from "react";
import { Activity } from "lucide-react";
import { Button, Input } from "@/components/core";

export interface LoginFormProps {
  onSignIn?: () => void;
}

export default function LoginForm({ onSignIn }: LoginFormProps) {
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
    onSignIn?.();
  };

  return (
    <form id="login-form" onSubmit={submit}>
      {/* Email field */}
      <div className="mb-rt-pad-sm">
        <label className="field-label">Operator email</label>
        <Input
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
