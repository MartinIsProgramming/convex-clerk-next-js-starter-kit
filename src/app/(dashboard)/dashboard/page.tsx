import { Suspense } from "react";

import {
  PageDescription,
  PageHeader,
  PageLayout,
  PageTitle,
} from "@/components/layout/page-layout";

export default function DashboardPage() {
  return (
    <PageLayout>
      <PageHeader>
        <PageTitle>Próximas Reservas</PageTitle>
        <PageDescription>Tus reservas confirmadas</PageDescription>
      </PageHeader>
      <Suspense fallback={<div>Loading...</div>}>some content</Suspense>
    </PageLayout>
  );
}
