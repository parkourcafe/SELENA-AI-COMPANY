import { redirect } from "next/navigation";

/** Legacy services route; AI Systems is the single canonical service entry. */
export default function ServicesPage(): never {
  redirect("/ai-systems");
}
