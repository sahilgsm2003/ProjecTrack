import express from "express";
import prisma from "../prisma/client.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// FR4.4 (Student Group): Update a milestone (title, description, dueDate, isCompleted)
// PATCH /api/milestones/:milestoneId
router.patch("/:milestoneId", protect, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { title, description, dueDate, isCompleted } = req.body;
    const user = req.user; // Authenticated user

    // 1. Find the milestone and its project to verify authorization
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          include: {
            group: {
              include: {
                members: true,
                leader: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found." });
    }

    // 2. Authorization: User must be a member of the project's group
    const projectGroup = milestone.project.group;
    const isMember = projectGroup.members.some(
      (member) => member.id === user.id
    );
    const isLeader = projectGroup.leaderId === user.id;

    if (!isMember && !isLeader) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this milestone." });
    }

    // 3. Ensure the project is still in a state where milestones can be updated (e.g., APPROVED/ACTIVE)
    if (
      milestone.project.status !== "APPROVED" &&
      milestone.project.status !== "ACTIVE"
    ) {
      return res
        .status(403)
        .json({
          message: `Milestones can only be updated for approved/active projects. Current project status: ${milestone.project.status}`,
        });
    }

    // 4. Prepare update data
    const updateData = {};
    if (title !== undefined)
      updateData.title = title.trim() === "" ? milestone.title : title; // Prevent empty title, keep old if empty string sent
    if (description !== undefined) updateData.description = description; // Allow empty description
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        // Allow clearing the due date
        updateData.dueDate = null;
      } else {
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          return res
            .status(400)
            .json({
              message:
                "Invalid due date format. Please use a valid date string or null.",
            });
        }
        updateData.dueDate = parsedDueDate;
      }
    }
    if (typeof isCompleted === "boolean") updateData.isCompleted = isCompleted;

    // FR4.4: "...track who made the last update."
    // We need a field in the Milestone model for this. Let's assume we add `lastUpdatedByUserId`.
    // If you haven't added it, this part will error or do nothing.
    // We'll add it to the schema next. For now, let's include it in logic.
    updateData.lastUpdatedByUserId = user.id;

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update." });
    }

    // Ensure lastUpdatedByUserId is set if any other field is being updated
    if (
      Object.keys(updateData).length > 1 ||
      (Object.keys(updateData).length === 1 &&
        !updateData.hasOwnProperty("lastUpdatedByUserId"))
    ) {
      updateData.lastUpdatedByUserId = user.id;
    }

    // 5. Update the milestone
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
      include: {
        // Optionally include the user who last updated, if relation is set up
        // lastUpdatedByUser: { select: { id: true, name: true }}
      },
    });

    res
      .status(200)
      .json({
        message: "Milestone updated successfully.",
        milestone: updatedMilestone,
      });
  } catch (error) {
    console.error("Update milestone error:", error);
    res
      .status(500)
      .json({
        message: "Server error while updating milestone.",
        error: error.message,
      });
  }
});

export default router;
