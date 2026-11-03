import { notFound } from "next/navigation";
import { UiKit } from "@/components/ui-kit";

export const metadata = { title: "Дизайн-система", robots: { index: false, follow: false } };
export default function UiKitPage() {
  // Build-mode gate only. No secret or public environment opt-in can enable this in production.
  if (process.env.NODE_ENV !== "development") notFound();
  return <UiKit />;
}
