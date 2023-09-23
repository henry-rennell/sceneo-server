function verifySessionSecret(req, res, next) {
    const sessionSecret = req.session.secret; // Replace with the actual session key you want to verify
  
    if (sessionSecret !== process.env.SESSION_SECRET) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
  
    // If the session secret is verified, continue to the next middleware or route handler
    next();
  }