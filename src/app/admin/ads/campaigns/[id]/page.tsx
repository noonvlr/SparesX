"use client";

import { use } from "react";
import { AdminPage } from "@/components/layout";
import { AdminPageHeader } from "@/components/admin/AdminPageChrome";
import AdsSubnav from "../../_components/AdsSubnav";
import CampaignWizard from "../_components/CampaignWizard";

export default function AdminAdsCampaignEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Edit campaign"
        description="Update details, creatives, schedule, then publish or save draft."
      />
      <AdsSubnav />
      <CampaignWizard campaignId={id} />
    </AdminPage>
  );
}
