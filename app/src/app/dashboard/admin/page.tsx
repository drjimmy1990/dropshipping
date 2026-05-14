import { redirect } from "next/navigation";

/* Old admin route — redirects to the new SuperAdmin panel */
export default function OldAdminPage() {
  redirect("/admin");
}
