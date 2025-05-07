import express from "express";
import multer from "multer";
import path from "path"; // Node.js path module
import fs from "fs"; // Node.js file system module
import prisma from "../prisma/client.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Multer Configuration ---
const UPLOADS_DIR = "./backend/uploads/project_documents"; // Define your uploads directory

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR); // Save files to the UPLOADS_DIR
  },
  filename: function (req, file, cb) {
    // Create a unique filename: timestamp-projectid-originalname
    // Note: req.params might not be available here directly in multer's filename if route is not fully processed.
    // We'll use a simple unique name for now and associate projectId in the DB record.
    // A more robust way might involve getting projectId from a custom field in the form-data or a different multer setup.
    // For now, let's keep it simple with timestamp + original name.
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname.replace(/\s+/g, "_")); // Replace spaces in filename
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only PDF files (FR5.1)
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit (adjust as needed)
  },
  fileFilter: fileFilter,
});

// FR5.1 (Student Group): Any group member must be able to upload project-related work documents (PDF format).
// FR5.2 (Student Group): The uploading member must be able to add a description/comment...
// POST /api/submissions/project/:projectId
router.post(
  "/project/:projectId",
  protect,
  upload.single("projectDocument"),
  async (req, res) => {
    // 'projectDocument' is the field name in the form-data for the file
    try {
      const { projectId } = req.params;
      const { description } = req.body; // Description from form-data
      const user = req.user; // Authenticated user

      if (!req.file) {
        return res
          .status(400)
          .json({ message: "No file uploaded or file type not allowed." });
      }

      // 1. Find the project and verify user is part of the project's group
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          group: { include: { members: true, leader: true } },
        },
      });

      if (!project) {
        // If project not found, potentially delete the orphaned uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting orphaned file:", err);
        });
        return res.status(404).json({ message: "Project not found." });
      }

      // 2. Authorization: Check if user is a member or leader of the project's group
      const isMember = project.group.members.some(
        (member) => member.id === user.id
      );
      const isLeader = project.group.leaderId === user.id;
      if (!isMember && !isLeader) {
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error("Error deleting orphaned file on auth fail:", err);
        });
        return res.status(403).json({
          message: "You are not a member of the group that owns this project.",
        });
      }

      // 3. Ensure the project is in a state where submissions are allowed (e.g., APPROVED/ACTIVE)
      if (project.status !== "APPROVED" && project.status !== "ACTIVE") {
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error("Error deleting orphaned file on status fail:", err);
        });
        return res.status(403).json({
          message: `Documents can only be submitted to approved/active projects. Current status: ${project.status}`,
        });
      }

      // 4. Create submission record in the database
      const newSubmission = await prisma.submission.create({
        data: {
          fileName: req.file.originalname,
          filePath: req.file.path, // Store the path where the file is saved
          fileType: req.file.mimetype, // Should be 'application/pdf'
          description: description || null,
          uploaderId: user.id,
          projectId: projectId,
        },
      });

      res.status(201).json({
        message: "File uploaded and submission recorded successfully.",
        submission: newSubmission,
      });
    } catch (error) {
      console.error("File upload error:", error);
      // If multer throws an error (e.g., file type, size limit), it might be caught here.
      // req.file might exist even if multer errored, clean up if so.
      if (req.file && req.file.path) {
        // Check if file still exists before trying to delete
        if (fs.existsSync(req.file.path)) {
          fs.unlink(req.file.path, (err) => {
            if (err)
              console.error("Error deleting file after main error:", err);
          });
        }
      }
      if (error.message === "Only PDF files are allowed!") {
        // Custom error from fileFilter
        return res.status(400).json({ message: error.message });
      }
      if (error instanceof multer.MulterError) {
        // Multer specific errors (e.g. file too large)
        return res
          .status(400)
          .json({ message: `Multer error: ${error.message}` });
      }
      res.status(500).json({
        message: "Server error during file upload.",
        error: error.message,
      });
    }
  }
);

// FR5.3 (Student Group): Group members must be able to view a history of document submissions for their project.
// FR5.4 (Teacher): Teachers must be able to view documents submitted by groups they supervise.
// GET /api/submissions/project/:projectId
router.get("/project/:projectId", protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    // 1. Find the project to verify its existence and for authorization checks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        group: { include: { members: true, leader: true } },
        // supervisor: true // Already fetched in the project object if needed
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // 2. Authorization: User must be a member of the project's group OR the project's supervisor
    const isMember = project.group.members.some(
      (member) => member.id === user.id
    );
    const isLeader = project.group.leaderId === user.id;
    const isSupervisor = project.supervisorId === user.id;

    if (!isMember && !isLeader && !isSupervisor) {
      return res.status(403).json({
        message: "You are not authorized to view submissions for this project.",
      });
    }

    // 3. Fetch submissions for the project
    const submissions = await prisma.submission.findMany({
      where: {
        projectId: projectId,
      },
      include: {
        uploader: {
          // Include uploader's basic info (FR5.2: "...system tracking which member uploaded")
          select: { id: true, name: true, email: true },
        },
        // Optionally include feedback later if feedback is directly on submissions
      },
      orderBy: {
        createdAt: "desc", // Show newest submissions first
      },
    });

    res.status(200).json(submissions);
  } catch (error) {
    console.error("List submissions error:", error);
    res.status(500).json({
      message: "Server error while fetching submissions.",
      error: error.message,
    });
  }
});

// We might also need an endpoint to download a specific file later, e.g., GET /api/submissions/:submissionId/download

export default router;
