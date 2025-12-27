const rateLimit = (options) => {
  const tokens = new Map();
  
  return {
    check: (res, limit, token) => {
      const now = Date.now();
      const userTokens = tokens.get(token) || [];
      
      // Remove old tokens
      const validTokens = userTokens.filter((timestamp) => 
        now - timestamp < options.interval
      );
      
      if (validTokens.length >= limit) {
        throw new Error('Rate limit exceeded');
      }
      
      validTokens.push(now);
      tokens.set(token, validTokens);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', limit - validTokens.length);
      res.setHeader('X-RateLimit-Reset', 
        Math.ceil((validTokens[0] + options.interval) / 1000)
      );
      
      return Promise.resolve();
    }
  };
};

export default rateLimit;
