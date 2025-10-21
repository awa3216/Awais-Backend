import Redis from 'ioredis';

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: false, // Connect immediately
  keepAlive: 30000,
  connectTimeout: 5000, // Faster timeout
  commandTimeout: 3000, // Faster command timeout
  maxLoadingTimeout: 3000, // Faster loading timeout
  enableOfflineQueue: false, // Don't queue commands when disconnected
});

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('🚀 Redis ready for commands');
  // Test Redis performance on startup
  testRedisPerformance();
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Test Redis performance
async function testRedisPerformance() {
  try {
    const start = Date.now();
    await redis.ping();
    const responseTime = Date.now() - start;
    
    if (responseTime < 100) {
      console.log(`⚡ Redis ping: ${responseTime}ms (Excellent)`);
    } else if (responseTime < 500) {
      console.log(`✅ Redis ping: ${responseTime}ms (Good)`);
    } else {
      console.log(`⚠️ Redis ping: ${responseTime}ms (Slow - check connection)`);
    }
  } catch (error) {
    console.error('❌ Redis ping failed:', error.message);
  }
}

// Cache middleware for yacht listings
export const cacheYachtList = async (req, res, next) => {
  const requestStart = Date.now();
  const { page = 1, limit = 10, status } = req.query;
  const cacheKey = `yachts:${page}:${limit}:${status || 'all'}`;
  
  try {
    // Fast Redis check with very short timeout
    const cacheStart = Date.now();
    const cachedData = await Promise.race([
      redis.get(cacheKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis timeout')), 200) // Only 200ms timeout!
      )
    ]);
    const cacheTime = Date.now() - cacheStart;
    
    if (cachedData) {
      const totalTime = Date.now() - requestStart;
      console.log(`⚡ Cache HIT for yacht list | Cache: ${cacheTime}ms | Total: ${totalTime}ms | Key: ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }
    
    // Cache miss - will query database
    console.log(`🔄 Cache MISS for yacht list | Cache check: ${cacheTime}ms | Key: ${cacheKey}`);
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response and log timing
    res.json = function(data) {
      const dbQueryTime = Date.now() - requestStart;
      
      // Cache for 5 minutes (don't block response)
      redis.setex(cacheKey, 300, JSON.stringify(data))
        .then(() => {
          const cacheWriteTime = Date.now() - requestStart;
          console.log(`💾 Cached yacht list data | DB Query: ${dbQueryTime}ms | Cache Write: ${cacheWriteTime}ms | Total: ${cacheWriteTime}ms`);
        })
        .catch(err => console.error('Cache write error:', err.message));
      
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    const totalTime = Date.now() - requestStart;
    console.log(`⚠️ Redis cache failed, using database directly | Time: ${totalTime}ms | Error: ${error.message}`);
    next(); // Continue without cache if Redis fails
  }
};

// Cache middleware for individual yacht
export const cacheYachtById = async (req, res, next) => {
  const requestStart = Date.now();
  const { id } = req.query;
  const cacheKey = `yacht:${id}`;
  
  try {
    // Try to get from cache first
    const cacheStart = Date.now();
    const cachedData = await redis.get(cacheKey);
    const cacheTime = Date.now() - cacheStart;
    
    if (cachedData) {
      const totalTime = Date.now() - requestStart;
      console.log(`⚡ Cache HIT for yacht by ID | Cache: ${cacheTime}ms | Total: ${totalTime}ms | ID: ${id}`);
      return res.json(JSON.parse(cachedData));
    }
    
    // Cache miss - will query database
    console.log(`🔄 Cache MISS for yacht by ID | Cache check: ${cacheTime}ms | ID: ${id}`);
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response and log timing
    res.json = function(data) {
      const dbQueryTime = Date.now() - requestStart;
      
      // Cache for 10 minutes (longer for individual yachts)
      redis.setex(cacheKey, 600, JSON.stringify(data))
        .then(() => {
          const cacheWriteTime = Date.now() - requestStart;
          console.log(`💾 Cached yacht by ID data | DB Query: ${dbQueryTime}ms | Cache Write: ${cacheWriteTime}ms | Total: ${cacheWriteTime}ms | ID: ${id}`);
        })
        .catch(err => console.error('Cache write error:', err.message));
      
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    const totalTime = Date.now() - requestStart;
    console.log(`⚠️ Redis cache failed for yacht by ID | Time: ${totalTime}ms | Error: ${error.message} | ID: ${id}`);
    next(); // Continue without cache if Redis fails
  }
};

// Cache middleware for blog listings
export const cacheBlogList = async (req, res, next) => {
  const requestStart = Date.now();
  const { page = 1, limit = 10, status } = req.query;
  const cacheKey = `blogs:${page}:${limit}:${status || 'all'}`;
  
  try {
    // Try to get from cache first
    const cacheStart = Date.now();
    const cachedData = await redis.get(cacheKey);
    const cacheTime = Date.now() - cacheStart;
    
    if (cachedData) {
      const totalTime = Date.now() - requestStart;
      console.log(`⚡ Cache HIT for blog list | Cache: ${cacheTime}ms | Total: ${totalTime}ms | Key: ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }
    
    // Cache miss - will query database
    console.log(`🔄 Cache MISS for blog list | Cache check: ${cacheTime}ms | Key: ${cacheKey}`);
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response and log timing
    res.json = function(data) {
      const dbQueryTime = Date.now() - requestStart;
      
      // Cache for 5 minutes
      redis.setex(cacheKey, 300, JSON.stringify(data))
        .then(() => {
          const cacheWriteTime = Date.now() - requestStart;
          console.log(`💾 Cached blog list data | DB Query: ${dbQueryTime}ms | Cache Write: ${cacheWriteTime}ms | Total: ${cacheWriteTime}ms`);
        })
        .catch(err => console.error('Cache write error:', err.message));
      
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    const totalTime = Date.now() - requestStart;
    console.log(`⚠️ Redis cache failed for blog list | Time: ${totalTime}ms | Error: ${error.message}`);
    next(); // Continue without cache if Redis fails
  }
};

// Cache middleware for individual blog
export const cacheBlogById = async (req, res, next) => {
  const requestStart = Date.now();
  const { id } = req.query;
  const cacheKey = `blog:${id}`;
  
  try {
    // Try to get from cache first
    const cacheStart = Date.now();
    const cachedData = await redis.get(cacheKey);
    const cacheTime = Date.now() - cacheStart;
    
    if (cachedData) {
      const totalTime = Date.now() - requestStart;
      console.log(`⚡ Cache HIT for blog by ID | Cache: ${cacheTime}ms | Total: ${totalTime}ms | ID: ${id}`);
      return res.json(JSON.parse(cachedData));
    }
    
    // Cache miss - will query database
    console.log(`🔄 Cache MISS for blog by ID | Cache check: ${cacheTime}ms | ID: ${id}`);
    
    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response and log timing
    res.json = function(data) {
      const dbQueryTime = Date.now() - requestStart;
      
      // Cache for 10 minutes (longer for individual blogs)
      redis.setex(cacheKey, 600, JSON.stringify(data))
        .then(() => {
          const cacheWriteTime = Date.now() - requestStart;
          console.log(`💾 Cached blog by ID data | DB Query: ${dbQueryTime}ms | Cache Write: ${cacheWriteTime}ms | Total: ${cacheWriteTime}ms | ID: ${id}`);
        })
        .catch(err => console.error('Cache write error:', err.message));
      
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    const totalTime = Date.now() - requestStart;
    console.log(`⚠️ Redis cache failed for blog by ID | Error: ${error.message} | ID: ${id}`);
    next(); // Continue without cache if Redis fails
  }
};

// Clear cache when yacht data changes
export const clearYachtCache = async () => {
  try {
    const keys = await redis.keys('yachts:*');
    const individualKeys = await redis.keys('yacht:*');
    if (keys.length > 0 || individualKeys.length > 0) {
      await redis.del(...keys, ...individualKeys);
      console.log('🗑️ Cleared all yacht cache');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Clear cache when blog data changes
export const clearBlogCache = async () => {
  try {
    const keys = await redis.keys('blogs:*');
    const individualKeys = await redis.keys('blog:*');
    if (keys.length > 0 || individualKeys.length > 0) {
      await redis.del(...keys, ...individualKeys);
      console.log('🗑️ Cleared all blog cache');
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// General request timing middleware
export const requestTimer = (req, res, next) => {
  const start = Date.now();
  
  // Override res.json to capture timing
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.originalUrl || req.url;
    
    // Color-coded timing based on performance
    let timingColor = '';
    if (duration < 100) {
      timingColor = '⚡'; // Excellent
    } else if (duration < 500) {
      timingColor = '✅'; // Good
    } else if (duration < 1000) {
      timingColor = '⚠️'; // Slow
    } else {
      timingColor = '🐌'; // Very slow
    }
    
    console.log(`${timingColor} ${method} ${url} | Total: ${duration}ms`);
    
    return originalJson.call(this, data);
  };
  
  next();
};

export default redis;
