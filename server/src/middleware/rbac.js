const roleHierarchy = { super_admin: 3, admin: 2, viewer: 1 };

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const userLevel = roleHierarchy[req.user.role] || 0;
    const hasAccess = roles.some(role => userLevel >= roleHierarchy[role]);
    if (!hasAccess) return res.status(403).json({ error: 'Insufficient permissions' });
    next();
  };
};

module.exports = { authorize };
