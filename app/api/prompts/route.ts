import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../app/(auth)/auth";

import {
  createPrompt,
  getUserPrompts,
  getPrompt,
  modifyPrompt,
  removePrompt,
} from "./service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const promptId = searchParams.get("id");

    if (promptId) {
      const prompt = await getPrompt(promptId);

      if (!prompt) {
        return NextResponse.json(
          { error: "Prompt not found" },
          { status: 404 }
        );
      }

      if (prompt.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json(prompt);
    }

    const prompts = await getUserPrompts(userId);
    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Error getting prompts:", error);
    return NextResponse.json(
      { error: "Failed to get prompts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, prompt } = await request.json();

    if (!name || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await createPrompt({ userId, name, prompt });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { id, name, prompt } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing prompt id" }, { status: 400 });
    }

    // Check if the prompt belongs to the user
    const existingPrompt = await getPrompt(id);

    if (!existingPrompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (existingPrompt.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedPrompt = await modifyPrompt({ id, name, prompt });
    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error("Error updating prompt:", error);
    return NextResponse.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing prompt id" }, { status: 400 });
    }

    // Check if the prompt belongs to the user
    const existingPrompt = await getPrompt(id);

    if (!existingPrompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    if (existingPrompt.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await removePrompt(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}
