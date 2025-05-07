import express from "express";
import prisma from "../prisma/client.js";
import { protect } from "../middleware/authMiddleware.js"; // For authentication

const router = express.Router();

// FR3.1 (Student Group - Leader): Initiate a project proposal
// POST /api/projects
router.post("/", protect, async (req, res) => {
  try {
    const { groupId, title, description, supervisorId } = req.body;
    const proposer = req.user; // Authenticated user

    // 1. Validate input
    if (!groupId || !title || !description || !supervisorId) {
      return res.status(400).json({
        message:
          "Group ID, title, description, and supervisor ID are required.",
      });
    }

    // 2. Verify the proposer is the leader of the specified group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { project: true }, // To check if a project already exists
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.leaderId !== proposer.id) {
      return res
        .status(403)
        .json({ message: "Only the group leader can propose a project." });
    }

    // 3. Ensure the proposer is a student (though leader check implies this if groups are student-only)
    if (proposer.role !== "STUDENT") {
      return res.status(403).json({
        message: "Only students (group leaders) can propose projects.",
      });
    }

    // 4. Check if the group already has an active or proposed project
    // A group can only have one project linked (via unique groupId on Project)
    // The `project` field on the `group` model is a direct link if such a project exists.
    if (group.project) {
      // You might want to check group.project.status to allow new proposal if old one was REJECTED
      // For now, if any project is linked, prevent new one.
      // Our schema has `groupId String @unique` on Project model, meaning a group can only be linked to one project.
      // So, if `group.project` exists, it means a project is already there.
      // The database constraint itself would prevent creating a new one with the same groupId.
      // Let's check the status of the existing project for better UX.
      const existingProject = await prisma.project.findFirst({
        // Re-fetch with status
        where: { groupId: groupId },
      });
      if (
        existingProject &&
        (existingProject.status === "PROPOSED" ||
          existingProject.status === "ACTIVE" ||
          existingProject.status === "APPROVED")
      ) {
        return res.status(409).json({
          message: `This group already has a project with status '${existingProject.status}'.`,
        });
      }
      // If existing project was REJECTED or COMPLETED, we might allow a new proposal.
      // This would mean the old project record needs to be disassociated or handled differently.
      // For MVP, let's assume if a project record exists for the group, no new proposals until it's resolved/deleted.
      return res.status(409).json({
        message: `A project already exists for this group (Status: ${existingProject.status}). Cannot create a new one.`,
      });
    }

    // 5. Verify the selected supervisor is a 'TEACHER'
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
    });

    if (!supervisor) {
      return res
        .status(404)
        .json({ message: "Selected supervisor not found." });
    }
    if (supervisor.role !== "TEACHER") {
      return res
        .status(400)
        .json({ message: "Selected supervisor must be a teacher." });
    }

    // 6. Create the project proposal
    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        groupId: groupId,
        proposedById: proposer.id, // The leader who proposed
        supervisorId: supervisorId, // Potential supervisor
        status: "PROPOSED", // Default, but explicit
      },
      include: {
        // Include relevant details in the response
        group: { select: { id: true, name: true } },
        proposedBy: { select: { id: true, name: true, email: true } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
    });

    // FR3.2: Teachers must receive notifications for new project proposals.
    // TODO: Implement notification logic here (e.g., create a Notification record, emit an event).

    res
      .status(201)
      .json({ message: "Project proposed successfully.", project: newProject });
  } catch (error) {
    console.error("Propose project error:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("groupId")) {
      // This error means a project for this group already exists,
      // which should ideally be caught by the `group.project` check above.
      return res
        .status(409)
        .json({ message: "A project for this group already exists." });
    }
    res.status(500).json({
      message: "Server error during project proposal.",
      error: error.message,
    });
  }
});

// FR3.3 (Teacher): View project proposals submitted to them
// GET /api/projects/proposals/my (or similar path)
router.get("/proposals/my", protect, async (req, res) => {
  try {
    const teacher = req.user;

    if (teacher.role !== "TEACHER") {
      return res
        .status(403)
        .json({ message: "Only teachers can view project proposals." });
    }

    const proposals = await prisma.project.findMany({
      where: {
        supervisorId: teacher.id,
        // status: 'PROPOSED' // Optionally filter only for PROPOSED, or let teacher see all they supervise
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            members: {
              // FR3.3: "group members"
              select: { id: true, name: true, email: true, rollNumber: true },
            },
            leader: {
              // Also good to see who the leader is
              select: { id: true, name: true, email: true },
            },
          },
        },
        proposedBy: {
          // The student who initiated the proposal (group leader)
          select: { id: true, name: true, email: true },
        },
        // We don't include supervisor here, as it's the teacher themselves
      },
      orderBy: {
        createdAt: "desc", // Show newest proposals first
      },
    });

    res.status(200).json(proposals);
  } catch (error) {
    console.error("Get my project proposals error:", error);
    res.status(500).json({
      message: "Server error while fetching project proposals.",
      error: error.message,
    });
  }
});

// FR3.4 (Teacher): Approve or Reject a project proposal
// PATCH /api/projects/:projectId/status
router.patch("/:projectId/status", protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, rejectionReason } = req.body; // Expected status: 'APPROVED' or 'REJECTED'
    const teacher = req.user;

    // 1. Validate input
    if (!status || (status !== "APPROVED" && status !== "REJECTED")) {
      return res
        .status(400)
        .json({ message: "Status must be 'APPROVED' or 'REJECTED'." });
    }
    if (
      status === "REJECTED" &&
      (rejectionReason === undefined || rejectionReason.trim() === "")
    ) {
      // Making rejectionReason optional as per spec "Rejection should allow for an optional reason."
      // If you want to make it mandatory for rejection, uncomment the line below:
      // return res.status(400).json({ message: 'Rejection reason is required when rejecting a project.' });
    }

    // 2. Verify user is a teacher
    if (teacher.role !== "TEACHER") {
      return res
        .status(403)
        .json({ message: "Only teachers can approve or reject projects." });
    }

    // 3. Find the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // 4. Verify the project is assigned to this teacher for supervision
    if (project.supervisorId !== teacher.id) {
      return res
        .status(403)
        .json({ message: "You are not assigned to supervise this project." });
    }

    // 5. Verify the project is currently in 'PROPOSED' state
    if (project.status !== "PROPOSED") {
      return res.status(400).json({
        message: `Project is not in 'PROPOSED' state (current status: ${project.status}). Cannot change status.`,
      });
    }

    // 6. Update the project status
    const updateData = {
      status: status,
      rejectionReason: status === "REJECTED" ? rejectionReason || null : null, // Clear reason if not rejecting or if no reason given
    };
    if (status === "APPROVED") {
      updateData.approvedAt = new Date(); // Record approval timestamp
      // FR3.6: "An approved proposal should transition into an active project..."
      // We can directly set status to 'ACTIVE' here, or have 'APPROVED' as an interim state
      // Let's assume 'APPROVED' also means it's active for now as per FR4.1
      // If 'ACTIVE' is a distinct status changed by students later, then just 'APPROVED' is fine here.
      // The current ProjectStatus enum has 'ACTIVE'. Let's use 'APPROVED' and the client can treat it as active for FR4.1.
      // Or, we can set to 'ACTIVE' right away if 'APPROVED' is just a sub-state of 'ACTIVE'.
      // For simplicity, let's set it to 'APPROVED'. The spec says "approved proposal should transition into an active project".
      // This implies 'APPROVED' makes it active.
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        // Include relevant details in the response
        group: { select: { id: true, name: true } },
        supervisor: { select: { id: true, name: true, email: true } },
      },
    });

    // FR3.5 (Student Group): The group must receive a notification regarding the status (approved/rejected) of their project proposal.
    // TODO: Implement notification logic here to inform the student group.

    res.status(200).json({
      message: `Project ${status.toLowerCase()} successfully.`,
      project: updatedProject,
    });
  } catch (error) {
    console.error("Approve/Reject project error:", error);
    res.status(500).json({
      message: "Server error while updating project status.",
      error: error.message,
    });
  }
});

// FR4.3 (Student Group): Group members must be able to collaboratively define project milestones
// POST /api/projects/:projectId/milestones
router.post("/:projectId/milestones", protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, dueDate } = req.body; // dueDate is optional
    const user = req.user; // Authenticated user

    // 1. Validate input
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Milestone title is required." });
    }

    // 2. Find the project and verify user is part of the project's group
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        group: {
          include: {
            members: true, // To check if user is a member
            leader: true, // To check if user is the leader
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // 3. Authorization: Check if user is a member or leader of the project's group
    const isMember = project.group.members.some(
      (member) => member.id === user.id
    );
    const isLeader = project.group.leaderId === user.id;

    if (!isMember && !isLeader) {
      return res.status(403).json({
        message: "You are not a member of the group that owns this project.",
      });
    }

    // 4. Ensure the project is approved/active
    // (FR4.3: "for their approved projects")
    if (project.status !== "APPROVED" && project.status !== "ACTIVE") {
      // Assuming 'APPROVED' transitions to 'ACTIVE' or is treated as such for work.
      // If you have a distinct 'ACTIVE' status that is set later, adjust this.
      return res.status(403).json({
        message: `Milestones can only be added to approved/active projects. Current status: ${project.status}`,
      });
    }

    // 5. Create the milestone
    const milestoneData = {
      title,
      description: description || null,
      projectId: projectId,
      // lastUpdatedBy: user.id, // We can add this if needed for FR4.4
    };

    if (dueDate) {
      // Basic validation for dueDate format (e.g., ISO string) can be added here if needed
      // For Prisma, it expects a DateTime compatible value.
      const parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          message: "Invalid due date format. Please use a valid date string.",
        });
      }
      milestoneData.dueDate = parsedDueDate;
    }

    const newMilestone = await prisma.milestone.create({
      data: milestoneData,
    });

    res.status(201).json({
      message: "Milestone added successfully.",
      milestone: newMilestone,
    });
  } catch (error) {
    console.error("Add milestone error:", error);
    res.status(500).json({
      message: "Server error while adding milestone.",
      error: error.message,
    });
  }
});

// GET /api/projects/:projectId/milestones (List all milestones for a project)
router.get("/:projectId/milestones", protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    // 1. Find the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        group: {
          include: {
            members: true,
            leader: true,
          },
        },
        // supervisor: true // Also include supervisor
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // 2. Authorization:
    // User must be a member of the project's group OR the project's supervisor
    const isMember = project.group.members.some(
      (member) => member.id === user.id
    );
    const isLeader = project.group.leaderId === user.id;
    const isSupervisor = project.supervisorId === user.id;

    if (!isMember && !isLeader && !isSupervisor) {
      return res.status(403).json({
        message: "You are not authorized to view milestones for this project.",
      });
    }

    // 3. Fetch milestones for the project
    const milestones = await prisma.milestone.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        createdAt: "asc", // Or 'dueDate' or 'title', depending on desired order
      },
    });

    res.status(200).json(milestones);
  } catch (error) {
    console.error("List milestones error:", error);
    res.status(500).json({
      message: "Server error while fetching milestones.",
      error: error.message,
    });
  }
});

// GET /api/projects/:projectId (Get single project details, its milestones, and progress)
router.get("/:projectId", protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            members: {
              select: { id: true, name: true, email: true, rollNumber: true },
            },
            leader: { select: { id: true, name: true, email: true } },
          },
        },
        supervisor: {
          select: { id: true, name: true, email: true, department: true },
        },
        proposedBy: { select: { id: true, name: true, email: true } },
        milestones: {
          // Include milestones to calculate progress and for viewing
          orderBy: { createdAt: "asc" },
        },
        // We could also include submissions and feedback here later
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Authorization: User must be a member of the project's group OR the project's supervisor
    const isMemberInProjectGroup = project.group.members.some(
      (member) => member.id === user.id
    );
    const isLeaderOfProjectGroup = project.group.leaderId === user.id;
    const isProjectSupervisor = project.supervisorId === user.id;

    if (
      !isMemberInProjectGroup &&
      !isLeaderOfProjectGroup &&
      !isProjectSupervisor
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this project." });
    }

    // Calculate progress
    let progress = 0;
    const totalMilestones = project.milestones.length;
    if (totalMilestones > 0) {
      const completedMilestones = project.milestones.filter(
        (m) => m.isCompleted
      ).length;
      progress = Math.round((completedMilestones / totalMilestones) * 100);
    }

    // Add progress to the project object
    const projectWithProgress = { ...project, progress };

    res.status(200).json(projectWithProgress);
  } catch (error) {
    console.error("Get project details error:", error);
    res.status(500).json({
      message: "Server error while fetching project details.",
      error: error.message,
    });
  }
});

export default router;
