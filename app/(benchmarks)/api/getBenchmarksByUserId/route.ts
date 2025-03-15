import { NextResponse } from "next/server";

import { getBenchmarksByUserId } from "../../../../lib/db/queries";
import { auth } from "../../../../app/(auth)/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const benchmarks = await getBenchmarksByUserId({
      userId: session.user.id,
    });
    return NextResponse.json(benchmarks);
  } catch (error) {
    console.error("Error fetching benchmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks" },
      { status: 500 }
    );
  }
}
