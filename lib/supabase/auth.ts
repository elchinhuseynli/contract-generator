import { redirect } from "next/navigation";
import { createClient } from "./server";

/** Current authenticated user, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require a session in a Server Component / action; redirect to login otherwise. */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
