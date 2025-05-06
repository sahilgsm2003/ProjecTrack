import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Make sure this is imported
import prisma from "../prisma/client.js"; // Adjust path if needed based on your client.js location
import { protect } from "../middleware/authMiddleware.js"; // Import the middleware

const router = express.Router();
const SALT_ROUNDS = 10; // For bcrypt hashing

// FR1.1 (Both): Users must be able to register using an email and password.
// Signup Endpoint: POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      rollNumber,
      program,
      year,
      department,
      areasOfExpertise,
    } = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password, and role are required." });
    }
    // Validate role
    if (role !== "STUDENT" && role !== "TEACHER") {
      return res.status(400).json({
        message: "Invalid role specified. Must be STUDENT or TEACHER.",
      });
    }
    if (
      role === "STUDENT" &&
      (!rollNumber || !program || year === undefined || year === null)
    ) {
      return res.status(400).json({
        message: "Roll number, program, and year are required for students.",
      });
    }
    if (role === "TEACHER" && (!department || !areasOfExpertise)) {
      // areasOfExpertise can be an empty array but should be provided
      return res.status(400).json({
        message: "Department and areas of expertise are required for teachers.",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    // Check for unique rollNumber if student
    if (role === "STUDENT") {
      const existingStudentWithRollNumber = await prisma.user.findUnique({
        where: { rollNumber },
      });
      if (existingStudentWithRollNumber) {
        return res
          .status(409)
          .json({ message: "This roll number is already registered." });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Prepare user data for creation
    const userData = {
      email,
      password: hashedPassword,
      name,
      role, // Prisma schema expects the enum 'STUDENT' or 'TEACHER'
    };

    if (role === "STUDENT") {
      userData.rollNumber = rollNumber;
      userData.program = program;
      userData.year = parseInt(year); // Ensure year is an integer
    } else {
      // role === 'TEACHER'
      userData.department = department;
      userData.areasOfExpertise = Array.isArray(areasOfExpertise)
        ? areasOfExpertise
        : areasOfExpertise
        ? [areasOfExpertise]
        : [];
    }

    // Create the user in the database
    const newUser = await prisma.user.create({
      data: userData,
    });

    // Exclude password from the response
    const { password: _, ...userWithoutPassword } = newUser;

    // Respond with the created user (excluding password)
    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Signup error:", error);
    // Prisma unique constraint violation (e.g., if email or rollNumber check somehow missed and DB caught it)
    if (error.code === "P2002" && error.meta?.target) {
      const field = error.meta.target.join(", "); // e.g., "email" or "rollNumber"
      return res
        .status(409)
        .json({ message: `The ${field} is already in use.` });
    }
    // Handle other errors
    res
      .status(500)
      .json({ message: "Server error during signup.", error: error.message });
  }
});

// FR1.2 (Both): Users must be able to log in using their registered credentials.
// Login Endpoint: POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." }); // Generic message for security
    }

    // Compare submitted password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." }); // Generic message
    }

    // User is authenticated, generate JWT
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name, // Include name for convenience on the frontend
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not defined in .env file");
      return res.status(500).json({ message: "Server configuration error." });
    }

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "1h" }); // Token expires in 1 hour

    // Exclude password from the user object sent in response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// FR1.3 (Both): Get current user's profile
// GET /api/auth/profile
router.get("/profile", protect, async (req, res) => {
  // req.user is populated by the 'protect' middleware
  // The user object in req.user already excludes the password
  res.status(200).json(req.user);
});

// FR1.3, FR1.4, FR1.5: Update current user's profile
// PUT /api/auth/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const {
      name,
      email,
      /* student fields */ rollNumber,
      program,
      year,
      /* teacher fields */ department,
      areasOfExpertise,
    } = req.body;
    const userId = req.user.id; // Get user ID from the token (via protect middleware)

    const updateData = {};

    // Fields common to both roles
    if (name !== undefined) updateData.name = name;

    // FR1.3 allows managing Email.
    // IMPORTANT: Changing email if it's the primary login identifier can be complex.
    // It's also a unique field.
    // For MVP, consider if changing email should require re-verification or if it has other implications.
    // Here, we'll allow it but ensure it remains unique if changed.
    if (email !== undefined && email !== req.user.email) {
      const existingUserWithNewEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUserWithNewEmail && existingUserWithNewEmail.id !== userId) {
        return res.status(409).json({
          message: "This email address is already in use by another account.",
        });
      }
      updateData.email = email;
    }

    // Role-specific fields
    if (req.user.role === "STUDENT") {
      if (rollNumber !== undefined) {
        // If rollNumber is being changed, check for uniqueness among other users
        if (rollNumber !== req.user.rollNumber) {
          const existingStudentWithRollNumber = await prisma.user.findFirst({
            where: {
              rollNumber,
              id: { not: userId }, // Exclude current user from the check
            },
          });
          if (existingStudentWithRollNumber) {
            return res.status(409).json({
              message:
                "This roll number is already registered by another student.",
            });
          }
        }
        updateData.rollNumber = rollNumber;
      }
      if (program !== undefined) updateData.program = program;
      if (year !== undefined) updateData.year = year ? parseInt(year) : null;
    } else if (req.user.role === "TEACHER") {
      if (department !== undefined) updateData.department = department;
      if (areasOfExpertise !== undefined) {
        // Allow updating to empty array
        updateData.areasOfExpertise = Array.isArray(areasOfExpertise)
          ? areasOfExpertise
          : areasOfExpertise
          ? [areasOfExpertise]
          : [];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No fields provided for update." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        // Return updated user, excluding password
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

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    if (error.code === "P2002" && error.meta?.target) {
      // Handles unique constraint violations not caught by pre-checks
      const field = error.meta.target.join(", ");
      return res
        .status(409)
        .json({ message: `The ${field} is already in use.` });
    }
    res.status(500).json({
      message: "Server error during profile update.",
      error: error.message,
    });
  }
});

// Make sure this line is present and correct:
export default router;
