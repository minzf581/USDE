// middleware/responseTime.js - 新增文件
const responseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    // 如果响应时间过长，记录警告
    if (duration > 2000) {
      console.warn(`Slow response detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

module.exports = responseTime;



