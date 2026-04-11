import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Note } from "@prisma/client";

import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type ErrorResponse = {
  error: string;
};

type NotesResponse = Note[] | Note | ErrorResponse;

type CreateNoteBody = {
  title?: unknown;
  content?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NotesResponse>
): Promise<void> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method === "GET") {
    try {
      const notes = await prisma.note.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      res.status(200).json(notes);
    } catch (error: unknown) {
      console.error("Failed to fetch notes:", error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  if (req.method === "POST") {
    const { title, content } = req.body as CreateNoteBody;

    if (typeof title !== "string" || !title.trim() || typeof content !== "string") {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    try {
      const note = await prisma.note.create({
        data: {
          title: title.trim(),
          content,
          userId: session.user.id
        }
      });

      res.status(201).json(note);
    } catch (error: unknown) {
      console.error("Failed to create note:", error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
