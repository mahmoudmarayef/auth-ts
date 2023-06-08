import jwt, { Secret } from "jsonwebtoken";
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../utils/mongo";
import User, { IUser } from "../../models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  await connectToDatabase();
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        // Get the token from the cookie
        const token: string | undefined = req.cookies.token;

        // If token is not found, throw an error
        if (!token) {
          throw new Error("Not authorized");
        }

        // Verify the token
        const decoded: { userId: string } | null = jwt.verify(
          token,
          process.env.JWT_SECRET
            ? process.env.JWT_SECRET
            : ("defaultSecret" as Secret)
        ) as { userId: string } | null;

        // If the token is invalid or expired, throw an error
        if (!decoded) {
          throw new Error("Not authorized");
        }

        // Find the user by ID
        const user: IUser | null = await User.findById(decoded.userId).select(
          "-password"
        );

        // If user not found, throw an error
        if (!user) {
          throw new Error("Not authorized");
        }

        res.status(200).json({ success: true, user: user });
      } catch (error) {
        res.status(401).json({ success: false, error: error });
      }
      break;
    default:
      res.status(405).json({ success: false, error: "Method not allowed" });
      break;
  }
}
