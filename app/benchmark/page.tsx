import { Benchmark } from "../../components/benchmark";
import { auth } from "../(auth)/auth";
import { redirect } from "next/navigation";

export default async function BenchmarkIndexPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <Benchmark initialPromptId={null} />;
}