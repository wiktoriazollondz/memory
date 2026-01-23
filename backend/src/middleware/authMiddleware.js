const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).send("Brak dostępu");

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send("Sesja wygasła");
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
