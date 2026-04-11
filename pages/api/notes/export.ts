import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Note } from "@prisma/client";

import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Note[] | ErrorResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="moje_poznamky.json"');
    res.status(200).json(notes);
  } catch (error: unknown) {
    console.error("Failed to export notes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
