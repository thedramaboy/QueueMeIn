const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้",
      });
    }
    next();
  };
};

export default allowRoles;
