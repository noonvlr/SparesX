"use client";

import { AdminPage } from "@/components/layout";
import { AdminPageHeader } from "@/components/admin/AdminPageChrome";
import AdsSubnav from "../../_components/AdsSubnav";
import CampaignWizard from "../_components/CampaignWizard";

export default function AdminAdsCampaignNewPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="New campaign"
        description="Draft is created as soon as details are valid so uploads and progress survive refresh."
      />
      <AdsSubnav />
      <CampaignWizard />
    </AdminPage>
  );
}
