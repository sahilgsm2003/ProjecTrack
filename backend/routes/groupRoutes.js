import express from "express";
import prisma from "../prisma/client.js";
import { protect } from "../middleware/authMiddleware.js"; // For authentication

const router = express.Router();

// FR2.1 (Student): A student must be able to create a new group, becoming its initial leader.
// POST /api/groups
router.post("/", protect, async (req, res) => {
  try {
    const { name: groupName } = req.body;
    const user = req.user; // Authenticated user from 'protect' middleware

    // Ensure the user is a student
    if (user.role !== "STUDENT") {
      return res
        .status(403)
        .json({ message: "Only students can create groups." });
    }

    // Basic validation
    if (!groupName || groupName.trim() === "") {
      return res.status(400).json({ message: "Group name is required." });
    }

    // Check if a group with the same name already exists (optional, based on your schema's unique constraint)
    // My suggested schema had 'name @unique' on Group model.
    const existingGroup = await prisma.group.findUnique({
      where: { name: groupName },
    });
    if (existingGroup) {
      return res.status(409).json({
        message: `A group with the name '${groupName}' already exists.`,
      });
    }

    // Create the group
    const newGroup = await prisma.group.create({
      data: {
        name: groupName,
        leaderId: user.id, // The creator becomes the leader
        members: {
          // Add the leader as the first member
          connect: { id: user.id },
        },
      },
      include: {
        // Include leader and members in the response
        leader: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res
      .status(201)
      .json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    console.error("Create group error:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return res.status(409).json({
        message: `A group with the name '${groupName}' already exists.`,
      });
    }
    res.status(500).json({
      message: "Server error during group creation.",
      error: error.message,
    });
  }
});

// FR2.6 (Student): Students must be able to see a list of groups they are members of.
// GET /api/groups (Lists groups the authenticated user is a member OR leader of)
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { leaderId: userId }, // User is the leader
          { members: { some: { id: userId } } }, // User is one of the members
        ],
      },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        _count: {
          // Optionally count members
          select: { members: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Deduplicate in case a user is both leader and in members list explicitly (shouldn't happen with current create logic)
    // The OR condition naturally handles this; Prisma is smart enough.
    // If groups had both leaderId and members: { connect: {id: leaderId} }, then a Set might be needed if results were combined manually.
    // But here, Prisma's OR is fine.

    res.status(200).json(groups);
  } catch (error) {
    console.error("Get user groups error:", error);
    res.status(500).json({
      message: "Server error while fetching groups.",
      error: error.message,
    });
  }
});

// FR2.2 (Student Leader): Invite another registered student to the group.
// POST /api/groups/:groupId/invitations
router.post("/:groupId/invitations", protect, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { invitedUserEmail } = req.body; // User to invite
    const inviter = req.user; // Authenticated user (group leader)

    if (!invitedUserEmail) {
      return res
        .status(400)
        .json({ message: "Email of the user to invite is required." });
    }

    // 1. Find the group and verify the inviter is the leader
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }, // Include members to check if already part of the group
    });

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.leaderId !== inviter.id) {
      return res
        .status(403)
        .json({ message: "Only the group leader can send invitations." });
    }

    // 2. Find the user to be invited
    const userToInvite = await prisma.user.findUnique({
      where: { email: invitedUserEmail },
    });

    if (!userToInvite) {
      return res
        .status(404)
        .json({ message: `User with email '${invitedUserEmail}' not found.` });
    }

    // 3. Ensure the invited user is a student
    if (userToInvite.role !== "STUDENT") {
      return res
        .status(400)
        .json({ message: "Only students can be invited to groups." });
    }

    // 4. Ensure inviter is not inviting themselves
    if (userToInvite.id === inviter.id) {
      return res
        .status(400)
        .json({ message: "You cannot invite yourself to the group." });
    }

    // 5. Check if the user is already a member of the group
    const isAlreadyMember = group.members.some(
      (member) => member.id === userToInvite.id
    );
    if (isAlreadyMember) {
      return res.status(409).json({
        message: `User '${invitedUserEmail}' is already a member of this group.`,
      });
    }

    // 6. Check if there's an existing pending invitation for this user to this group
    const existingInvitation = await prisma.groupInvitation.findFirst({
      where: {
        groupId: groupId,
        invitedUserId: userToInvite.id,
        // status: 'PENDING' // The unique constraint on schema already handles this, but explicit check is fine
      },
    });

    if (existingInvitation) {
      if (existingInvitation.status === "PENDING") {
        return res.status(409).json({
          message: `An invitation is already pending for '${invitedUserEmail}' to this group.`,
        });
      } else if (existingInvitation.status === "ACCEPTED") {
        // This case should ideally be caught by "isAlreadyMember" check if group members are updated upon acceptance.
        // If not, this is a good fallback.
        return res.status(409).json({
          message: `User '${invitedUserEmail}' has already accepted an invitation to this group.`,
        });
      }
      // If REJECTED, you might allow re-inviting by deleting the old one or creating a new one.
      // For now, the unique constraint `@@unique([groupId, invitedUserId])` on GroupInvitation
      // means we can't create another one. So, if it was rejected, they can't be re-invited without deleting the old record.
      // Let's assume for now, if an invitation exists (any status), we don't create a new one to keep it simple.
      return res.status(409).json({
        message: `An invitation for '${invitedUserEmail}' to this group already exists with status: ${existingInvitation.status}.`,
      });
    }

    // 7. Create the invitation
    const newInvitation = await prisma.groupInvitation.create({
      data: {
        groupId: groupId,
        invitedUserId: userToInvite.id,
        inviterId: inviter.id,
        status: "PENDING", // Default, but explicit
      },
      include: {
        invitedUser: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
      },
    });

    // FR8.1: "Receive notifications for group invitations."
    // Actual notification logic (e.g., push, in-app) would go here or be triggered by an event.
    // For now, the invitation is created.

    res.status(201).json({
      message: "Invitation sent successfully.",
      invitation: newInvitation,
    });
  } catch (error) {
    console.error("Send invitation error:", error);
    if (error.code === "P2002") {
      // Handles unique constraint violation if not caught by earlier checks
      return res.status(409).json({
        message: "This invitation already exists or conflicts with another.",
      });
    }
    res.status(500).json({
      message: "Server error while sending invitation.",
      error: error.message,
    });
  }
});

// FR2.3 (Student): Get pending invitations for the authenticated user
// GET /api/groups/invitations/pending
router.get("/invitations/pending", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingInvitations = await prisma.groupInvitation.findMany({
      where: {
        invitedUserId: userId,
        status: "PENDING",
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            leader: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!pendingInvitations) {
      return res.status(200).json([]);
    }
    res.status(200).json(pendingInvitations);
  } catch (error) {
    console.error("Get pending invitations error:", error);
    res.status(500).json({
      message: "Server error while fetching pending invitations.",
      error: error.message,
    });
  }
});

// FR2.3 (Student): Accept or Reject a group invitation
// PATCH /api/groups/invitations/:invitationId/respond
router.patch(
  "/invitations/:invitationId/respond",
  protect,
  async (req, res) => {
    try {
      const { invitationId } = req.params;
      const { action } = req.body; // Expected 'ACCEPT' or 'REJECT'
      const userId = req.user.id; // Authenticated user (the invited one)

      if (!action || (action !== "ACCEPT" && action !== "REJECT")) {
        return res
          .status(400)
          .json({ message: "Action must be 'ACCEPT' or 'REJECT'." });
      }

      // 1. Find the invitation
      const invitation = await prisma.groupInvitation.findUnique({
        where: { id: invitationId },
        include: { group: true }, // Include group for adding member if accepted
      });

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found." });
      }

      // 2. Verify the invitation is for the authenticated user
      if (invitation.invitedUserId !== userId) {
        return res.status(403).json({
          message: "You are not authorized to respond to this invitation.",
        });
      }

      // 3. Check if the invitation is still pending
      if (invitation.status !== "PENDING") {
        return res.status(400).json({
          message: `This invitation is no longer pending (current status: ${invitation.status}).`,
        });
      }

      // 4. Perform the action
      let updatedInvitation;
      if (action === "ACCEPT") {
        // Use a transaction to ensure both happen or neither
        updatedInvitation = await prisma.$transaction(async (tx) => {
          // Update invitation status
          const acceptedInvite = await tx.groupInvitation.update({
            where: { id: invitationId },
            data: { status: "ACCEPTED" },
          });

          // Add user to the group's members list
          await tx.group.update({
            where: { id: invitation.groupId },
            data: {
              members: {
                connect: { id: userId }, // Add the invited user to the group
              },
            },
          });
          return acceptedInvite;
        });
        // FR8.2 (Student Group): "Receive notifications for project proposal status updates." (This is for projects, but a similar notification for group join could be FR8.x)
        // TODO: Notify group leader/members that a new member joined.
        res.status(200).json({
          message:
            "Invitation accepted successfully. You have joined the group.",
          invitation: updatedInvitation,
        });
      } else {
        // action === 'REJECT'
        updatedInvitation = await prisma.groupInvitation.update({
          where: { id: invitationId },
          data: { status: "REJECTED" },
        });
        // TODO: Notify group leader that the invitation was rejected.
        res.status(200).json({
          message: "Invitation rejected successfully.",
          invitation: updatedInvitation,
        });
      }
    } catch (error) {
      console.error("Respond to invitation error:", error);
      // Check for potential errors during transaction for ACCEPT
      if (error.code === "P2025" && action === "ACCEPT") {
        // P2025: Record to update not found (e.g., group deleted mid-transaction)
        return res.status(404).json({
          message:
            "Failed to accept invitation. The group may no longer exist.",
        });
      }
      res.status(500).json({
        message: "Server error while responding to invitation.",
        error: error.message,
      });
    }
  }
);

export default router;
