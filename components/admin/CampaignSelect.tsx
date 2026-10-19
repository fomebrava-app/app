"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui";
import type { Campaign } from "@/lib/types";

export function CampaignSelect({
  campaigns,
  selectedId,
}: {
  campaigns: Campaign[];
  selectedId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (campaigns.length === 0) return null;

  return (
    <Select
      aria-label="Campanha"
      value={selectedId}
      onChange={(e) => router.push(`${pathname}?campanha=${e.target.value}`)}
      className="w-full sm:w-64"
    >
      {campaigns.map((campaign) => (
        <option key={campaign.id} value={campaign.id}>
          {campaign.nome}
          {campaign.status === "encerrada" ? " (encerrada)" : ""}
        </option>
      ))}
    </Select>
  );
}
