import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import cookie from "cookie";
import { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "../../utils/mongo";
import User, { IUser } from "../../models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await connectToDatabase();
  const { method } = req;

  switch (method) {
    case "POST":
      try {
        const { email, password, role } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user: IUser = new User({
          email,
          password: hashedPassword,
          role,
        });

        // Save the user to the database
        await user.save();

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

        res.status(201).json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false, error: error });
      }
      break;
    default:
      res.status(405).json({ success: false, error: "Method not allowed" });
      break;
  }
}
