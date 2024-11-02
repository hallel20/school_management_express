const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) return res.sendStatus(403);
    const DBUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { teacher: true, student: true },
    });
    req.user = DBUser;
    next();
  });
};

const checkIsAdmin = async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user && user.isAdmin) {
    next();
  } else {
    res.status(403).send("Admin access required");
  }
};

module.exports = { authenticateToken, checkIsAdmin };
