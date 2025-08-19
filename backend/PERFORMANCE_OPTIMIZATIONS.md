# Backend Performance Optimizations

This document summarizes the performance optimizations implemented for the BERT sentiment analysis backend API.

## Overview

The backend has been enhanced with comprehensive performance optimizations including request timeout handling, model caching, memory management, device detection, and detailed monitoring capabilities.

## Implemented Optimizations

### 1. Request Timeout Handling
- **Feature**: 30-second timeout for all sentiment analysis requests
- **Implementation**: Uses `asyncio.wait_for()` to prevent hanging requests
- **Benefits**: Prevents resource exhaustion from stuck requests
- **Error Handling**: Returns HTTP 408 (Request Timeout) with descriptive message

### 2. Model Caching and Memory Management
- **ModelCache Class**: LRU-style cache for up to 3 models
- **Memory Cleanup**: Automatic garbage collection and GPU memory clearing
- **Cache Benefits**: Faster model loading for repeated requests
- **Memory Monitoring**: Tracks memory usage over time

### 3. Performance Metrics and Monitoring
- **PerformanceMonitor Class**: Comprehensive request tracking
- **Metrics Collected**:
  - Request processing times (avg, min, max)
  - Request counts by status
  - Error counts by type
  - Memory usage tracking
  - Requests per minute
  - Error rates
  - System uptime

### 4. Device Detection and Optimization
- **DeviceManager Class**: Automatic GPU/CPU detection
- **Optimization Settings**: Device-specific configurations
  - GPU: Higher batch size, longer max length, float16 precision
  - CPU: Smaller batch size, shorter max length, float32 precision
- **Hardware Info**: Detailed system information including memory and CPU specs

### 5. Enhanced Logging and Monitoring
- **Structured Logging**: Timestamped logs with different levels
- **File Logging**: Optional log file output
- **Request Tracking**: Client IP logging and request details
- **Background Monitoring**: Continuous memory usage tracking
- **Performance Logging**: Detailed timing information

## New API Endpoints

### `/api/performance`
Returns detailed performance statistics:
```json
{
  "total_requests": 150,
  "avg_processing_time": 85.2,
  "min_processing_time": 45.1,
  "max_processing_time": 120.8,
  "requests_per_minute": 12.5,
  "error_rate": 2.1,
  "uptime_seconds": 3600,
  "memory_usage_mb": 245.6,
  "system_metrics": {
    "cpu_percent": 15.2,
    "memory_percent": 8.5,
    "threads": 12
  }
}
```

### Enhanced `/api/model-info`
Now includes performance stats, device info, and optimization settings.

### `/api/performance/reset`
Resets performance statistics (useful for testing).

## Performance Improvements

### Response Time Optimization
- **Device-specific settings**: Optimized batch sizes and precision
- **Model caching**: Eliminates repeated model loading
- **Efficient preprocessing**: Optimized text truncation and validation

### Memory Management
- **Automatic cleanup**: Garbage collection and GPU memory clearing
- **Memory monitoring**: Continuous tracking and reporting
- **Cache management**: LRU eviction prevents memory bloat

### Error Handling
- **Timeout protection**: Prevents hanging requests
- **Detailed error tracking**: Categorized error monitoring
- **Graceful degradation**: Proper error responses with HTTP status codes

### Monitoring and Observability
- **Real-time metrics**: Live performance statistics
- **Historical tracking**: Request history and trends
- **System monitoring**: CPU, memory, and thread tracking
- **Background monitoring**: Continuous system health checks

## Configuration

### Environment Variables
- Request timeout can be configured via `REQUEST_TIMEOUT` constant
- Log level can be adjusted in logging configuration
- Cache size can be modified in `ModelCache.max_cache_size`

### Hardware Optimization
- Automatic GPU detection and utilization
- CPU-optimized settings for systems without GPU
- Memory-aware configurations based on available resources

## Testing

The optimizations include comprehensive test suites:
- **Unit tests**: Individual component testing
- **Integration tests**: Full system testing
- **Performance tests**: Timing and memory validation
- **Error scenario tests**: Timeout and failure handling

## Dependencies

Added dependency:
- `psutil==5.9.6`: System and process monitoring

## Usage Examples

### Monitoring Performance
```python
# Get current performance stats
response = requests.get("/api/performance")
stats = response.json()
print(f"Average response time: {stats['avg_processing_time']}ms")
```

### Device Information
```python
# Check device optimization
response = requests.get("/api/model-info")
info = response.json()
print(f"Running on: {info['device_info']['recommended_device']}")
```

## Benefits

1. **Reliability**: Timeout handling prevents system hangs
2. **Performance**: Caching and optimization reduce response times
3. **Observability**: Comprehensive monitoring enables performance tuning
4. **Scalability**: Memory management supports higher request volumes
5. **Maintainability**: Detailed logging aids in debugging and monitoring

## Future Enhancements

Potential future optimizations:
- Request rate limiting
- Model quantization for faster inference
- Batch processing for multiple requests
- Redis-based distributed caching
- Prometheus metrics integration