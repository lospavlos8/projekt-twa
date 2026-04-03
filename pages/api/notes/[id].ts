import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { Note } from "@prisma/client";

import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";

type ErrorResponse = {
  error: string;
};

type NoteResponse = Note | ErrorResponse;

type UpdateNoteBody = {
  title?: unknown;
  content?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NoteResponse | null>
): Promise<void> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.query;

  if (typeof id !== "string") {
    res.status(400).json({ error: "Invalid note id" });
    return;
  }

  if (req.method !== "PUT" && req.method !== "PATCH" && req.method !== "DELETE") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let note: Note | null;

  try {
    note = await prisma.note.findUnique({
      where: { id }
    });
  } catch (error: unknown) {
    console.error("Failed to load note:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  if (note.userId !== session.user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (req.method === "DELETE") {
    try {
      await prisma.note.delete({
        where: { id }
      });

      res.status(204).end();
    } catch (error: unknown) {
      console.error("Failed to delete note:", error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  }

  const { title, content } = req.body as UpdateNoteBody;
  const data: { title?: string; content?: string } = {};

  if (typeof title === "string") {
    data.title = title;
  }

  if (typeof content === "string") {
    data.content = content;
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: "Title or content is required" });
    return;
  }

  try {
    const updatedNote = await prisma.note.update({
      where: { id },
      data
    });

    res.status(200).json(updatedNote);
  } catch (error: unknown) {
    console.error("Failed to update note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
