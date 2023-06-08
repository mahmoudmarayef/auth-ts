import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import cookie from "cookie";
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
    case "POST":
      try {
        const { email, password } = req.body;

        // Find the user by email
        const user: IUser | null = await User.findOne({ email });

        // If user not found, throw an error
        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);

        // If passwords don't match, throw an error
        if (!isMatch) {
          throw new Error("Invalid email or password");
        }

        // Generate a JWT
        const token = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET
            ? process.env.JWT_SECRET
            : ("defaultSecret" as Secret),
          {
            expiresIn: "7d",
          }
        );

        // Set the JWT as a cookie
        res.setHeader(
          "Set-Cookie",
          cookie.serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "strict",
            maxAge: 604800,
            path: "/",
          })
        );

        res.status(200).json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false, error: error });
      }
      break;
    default:
      res.status(405).json({ success: false, error: "Method not allowed" });
      break;
  }
}
