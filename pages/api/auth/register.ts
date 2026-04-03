import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

type RegisterSuccessResponse = {
  id: string;
  name: string;
  createdAt: string;
};

type ErrorResponse = {
  error: string;
};

type RegisterResponse = RegisterSuccessResponse | ErrorResponse;

type RegisterBody = {
  name: string;
  password: string;
};

const MIN_NAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;
const NAME_PATTERN = /^[a-zA-Z0-9]+$/;

function isRegisterBody(value: unknown): value is RegisterBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return typeof candidate.name === "string" && typeof candidate.password === "string";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isRegisterBody(req.body)) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, password } = req.body;

  if (name.length < MIN_NAME_LENGTH) {
    res.status(400).json({ error: "Name must be at least 3 characters long" });
    return;
  }

  if (!NAME_PATTERN.test(name)) {
    res.status(400).json({ error: "Name must be alphanumeric" });
    return;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: "Password must be at least 8 characters long" });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { name }
    });

    if (existingUser) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt.toISOString()
    });
  } catch (error: unknown) {
    console.error("Registration failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
