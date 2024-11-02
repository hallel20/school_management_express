const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  const { username, email, password, role, grade, subject } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the User
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // Create either a Student or Teacher profile based on the role
    if (role === "student") {
      await prisma.student.create({
        data: {
          userId: newUser.id,
          grade: grade || "", // assuming grade is required for a student
        },
      });
    } else if (role === "teacher") {
      await prisma.teacher.create({
        data: {
          userId: newUser.id,
          subject: subject || "", // assuming subject is required for a teacher
        },
      });
    }

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "User already exists or invalid data" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res
      .status(401)
      .json({ error: "Email and Password must not be empty!" });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
    });

    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });

    let token;

    if (student) {
      token = jwt.sign(
        {
          id: user.id,
          isAdmin: user.isAdmin,
          name: student.name,
          email: user.email,
        },
        JWT_SECRET,
        {
          expiresIn: "6h",
        }
      );
    } else if (teacher) {
      token = jwt.sign(
        {
          id: user.id,
          isAdmin: user.isAdmin,
          name: teacher.name,
          email: user.email,
        },
        JWT_SECRET,
        {
          expiresIn: "6h",
        }
      );
    } else {
      token = jwt.sign(
        {
          id: user.id,
          isAdmin: user.isAdmin,
          name: user.username,
          email: user.email,
        },
        JWT_SECRET,
        {
          expiresIn: "6h",
        }
      );
    }

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
