"use client";

import { Radio } from "lucide-react";
import { TopbarButton } from "@/components/ui/navigation";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";
import { RadioCard, RadioCardGroup } from "@/components/ui/form";
import type { Role } from "@/hooks/auth.types";

interface ControlRoomPopoverProps {
  value: Role;
  onChange: (role: Role) => void;
}

const ROLE_OPTIONS: ReadonlyArray<{
  value: Role;
  title: string;
  subtitle: string;
}> = [
  { value: "driller", title: "Driller", subtitle: "Drill + geo · alarms · ack" },
  { value: "geologist", title: "Geologist", subtitle: "Geo only · alarms · ack" },
  { value: "data-scientist", title: "Data Scientist", subtitle: "Drill + geo · read-only" },
];

const ROLE_LABEL: Record<Role, string> = {
  driller: "Driller",
  geologist: "Geologist",
  "data-scientist": "Data Scientist",
};

export default function ControlRoomPopover({
  value,
  onChange,
}: ControlRoomPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <TopbarButton size="sm" title="Select operator role">
          <Radio size={14} strokeWidth={2} />
          <span className="ml-1">Role: {ROLE_LABEL[value]}</span>
        </TopbarButton>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[260px]">
        <PopoverHeader>
          <PopoverTitle>Control Room</PopoverTitle>
          <PopoverDescription>
            Select operator role before signing in
          </PopoverDescription>
        </PopoverHeader>

        <div className="p-rt-pad">
          <RadioCardGroup
            value={value}
            onValueChange={(v) => v && onChange(v as Role)}
            className="flex flex-col gap-1.5"
          >
            {ROLE_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.value}
                value={opt.value}
                size="sm"
                title={opt.title}
                subtitle={opt.subtitle}
              />
            ))}
          </RadioCardGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
