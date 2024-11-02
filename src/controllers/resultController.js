const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getResults = async (req, res) => {
  const user = req.user;

  if (user.isAdmin) {
    const results = await prisma.result.findMany();
    return res.json(results);
  }

  if (user.role === "Teacher") {
    const subjects = await prisma.teacher.findUnique({
      where: { id: user.id },
      include: { subjects: true },
    });

    const subjectIds = subjects.map((subject) => subject.id);
    const results = await prisma.result.findMany({
      where: { exam: { subjectId: { in: subjectIds } } },
    });
    return res.json(results);
  }

  if (user.role === "Student") {
    const results = await prisma.result.findMany({
      where: { studentId: user.id },
    });
    return res.json(results);
  }

  res.status(403).send("Forbidden");
};

exports.createResult = async (req, res) => {
  const { studentId, examId, score } = req.body;
  const user = req.user;

  // Validate required fields
  if (!studentId || !examId || !score) {
    return res
      .status(400)
      .json({ error: "All fields (studentId, examId, score) are required" });
  }

  try {
    // Retrieve the exam with its associated subject
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { subject: true },
    });

    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Check if user is an admin
    if (user.isAdmin) {
      // Admin can create results for any subject
      await prisma.result.create({
        data: {
          studentId,
          examId,
          score,
        },
      });
      return res
        .status(201)
        .json({ message: "Result created successfully by admin" });
    }

    // Check if user is a teacher and allowed to create results for the exam's subject
    if (user.teacher) {
      // Find teacher's subjects
      const teacher = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { subjects: true },
      });

      // Check if teacher is associated with the subject of the exam
      const authorizedSubject = teacher.subjects.some(
        (subject) => subject.id === exam.subjectId
      );
      if (!authorizedSubject) {
        return res
          .status(403)
          .json({
            error: "You are not authorized to post results for this subject",
          });
      }

      // Create the result if the teacher is authorized
      await prisma.result.create({
        data: {
          studentId,
          examId,
          score,
        },
      });
      return res
        .status(201)
        .json({ message: "Result created successfully by teacher" });
    }

    return res.status(403).json({ error: "Unauthorized action" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
