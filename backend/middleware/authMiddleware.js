import jwt from "jsonwebtoken";
import prisma from "../prisma/client.js";

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header (e.g., "Bearer eyJhbGciOiJ...")
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error("JWT_SECRET is not defined in .env file for middleware");
        // Do not send detailed error to client for security
        return res
          .status(401)
          .json({ message: "Not authorized, server configuration issue." });
      }
      const decoded = jwt.verify(token, jwtSecret);

      // Get user from the token payload (excluding password)
      // The payload was { userId, email, role, name }
      // We need to ensure the user still exists in the DB
      const currentUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          // Select only necessary fields, exclude password
          id: true,
          email: true,
          name: true,
          role: true,
          rollNumber: true,
          program: true,
          year: true,
          department: true,
          areasOfExpertise: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!currentUser) {
        return res
          .status(401)
          .json({ message: "Not authorized, user not found." });
      }

      req.user = currentUser; // Attach user object to request

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error("Token verification error:", error.message);
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Not authorized, token expired." });
      }
      return res.status(401).json({ message: "Not authorized, token failed." });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token provided." });
  }
};

export { protect };
