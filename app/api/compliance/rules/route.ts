import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  try {
    const authObj = await auth();
    if (!authObj.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const jurisdictionId = url.searchParams.get("jurisdictionId") as Id<"jurisdictions"> | null;
    const status = url.searchParams.get("status") as "draft" | "in_review" | "published" | "archived" | null;
    const category = url.searchParams.get("category") as any;
    const searchTerm = url.searchParams.get("search");

    const rules = await convex.query(api.compliance.searchRules, {
      jurisdictionId: jurisdictionId || undefined,
      status: status || undefined,
      category: category || undefined,
      searchTerm: searchTerm || undefined,
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}
