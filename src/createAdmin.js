const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

async function createAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  try {
    // Check if an admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: adminEmail, isAdmin: true },
    });

    if (existingAdmin) {
      console.log("Admin user already exists. No new admin created.");
      return;
    }

    // Hash the admin password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create the admin user
    const newAdmin = await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
      },
    });

    console.log(
      `Admin user created successfully with username: ${newAdmin.username}`
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
