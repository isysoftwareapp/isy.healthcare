import { redirect } from "next/navigation";

export default function HomePage() {
  // Middleware will handle the redirect to /login or /dashboard
  redirect("/login");
}
