permit = function(...allowed) {
  const isAllowed = role => allowed.indexOf(role) > -1;
  
  // return a middleware
  return (req, res, next) => {
    if (user_session && isAllowed(user_session.role))
      next(); // role is allowed, so continue on the next middleware
    else {
      const message = "Forbidden";
      res.status(403).json({message: message}); 
    }
  }
}
exports.permit = permit;