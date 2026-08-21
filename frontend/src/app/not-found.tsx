import Link from "next/link";
import { ArrowLeft, Compass, LayoutDashboard } from "lucide-react";
import { StatusPage } from "@/components/StatusPage";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      icon={Compass}
      variant="analytics"
      title="We couldn't find that page"
      description="The link may be out of date, or the module may have moved. Everything else is running normally."
      actions={
        <>
          <Button render={<Link href="/dashboard" />} size="lg">
            <LayoutDashboard />
            Go to dashboard
          </Button>

          <Button render={<Link href="/" />} variant="outline" size="lg">
            <ArrowLeft />
            Back to home
          </Button>
        </>
      }
    />
  );
}
