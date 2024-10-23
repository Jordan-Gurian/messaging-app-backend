const jwt = require("jsonwebtoken");

// FORMAT OF TOKEN
// Authorization: Bearer <access_token>

// Verify Token
function verifyToken(req, res, next) {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } 

    if (!token) {
      return res.status(401).json({ error: 'token missing' })
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET, function(error, decoded) {
        if (error) {
          console.log(error)
          return error.json()
        }
      });
      req.user = decoded;
      next();
    } catch (ex) {
      return res.status(401).json({ error: 'token invalid' })
    }
};

module.exports = verifyToken;