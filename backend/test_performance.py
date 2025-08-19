#!/usr/bin/env python3
"""
Test script for backend performance optimizations
Tests the core classes without requiring FastAPI dependencies
"""

import asyncio
import time
import sys
import os
import psutil
import threading
from collections import defaultdict, deque
from datetime import datetime, timedelta

# Test the core performance monitoring classes directly
class PerformanceMonitor:
    def __init__(self):
        self.request_times = deque(maxlen=1000)  # Keep last 1000 requests
        self.request_counts = defaultdict(int)
        self.error_counts = defaultdict(int)
        self.memory_usage = deque(maxlen=100)  # Keep last 100 memory readings
        self.start_time = time.time()
        self.lock = threading.Lock()
    
    def record_request(self, processing_time: float, status: str = "success"):
        with self.lock:
            self.request_times.append(processing_time)
            self.request_counts[status] += 1
            
    def record_error(self, error_type: str):
        with self.lock:
            self.error_counts[error_type] += 1
    
    def record_memory_usage(self):
        try:
            memory_mb = psutil.Process().memory_info().rss / 1024 / 1024
            with self.lock:
                self.memory_usage.append(memory_mb)
        except Exception:
            pass  # Ignore memory monitoring errors
    
    def get_stats(self):
        with self.lock:
            if not self.request_times:
                return {
                    "total_requests": 0,
                    "avg_processing_time": 0,
                    "min_processing_time": 0,
                    "max_processing_time": 0,
                    "requests_per_minute": 0,
                    "error_rate": 0,
                    "uptime_seconds": time.time() - self.start_time,
                    "memory_usage_mb": 0
                }
            
            avg_time = sum(self.request_times) / len(self.request_times)
            total_requests = sum(self.request_counts.values())
            total_errors = sum(self.error_counts.values())
            uptime = time.time() - self.start_time
            requests_per_minute = (total_requests / uptime) * 60 if uptime > 0 else 0
            error_rate = (total_errors / total_requests) * 100 if total_requests > 0 else 0
            current_memory = self.memory_usage[-1] if self.memory_usage else 0
            
            return {
                "total_requests": total_requests,
                "avg_processing_time": round(avg_time, 2),
                "min_processing_time": round(min(self.request_times), 2),
                "max_processing_time": round(max(self.request_times), 2),
                "requests_per_minute": round(requests_per_minute, 2),
                "error_rate": round(error_rate, 2),
                "uptime_seconds": round(uptime, 2),
                "memory_usage_mb": round(current_memory, 2),
                "request_counts": dict(self.request_counts),
                "error_counts": dict(self.error_counts)
            }

class DeviceManager:
    def __init__(self):
        self.device_info = self._detect_device()
        self.optimization_settings = self._get_optimization_settings()
    
    def _detect_device(self):
        try:
            import torch
            cuda_available = torch.cuda.is_available()
            cuda_device_count = torch.cuda.device_count() if cuda_available else 0
        except ImportError:
            cuda_available = False
            cuda_device_count = 0
        
        device_info = {
            "cuda_available": cuda_available,
            "cuda_device_count": cuda_device_count,
            "cpu_count": os.cpu_count(),
            "total_memory_gb": round(psutil.virtual_memory().total / (1024**3), 2)
        }
        
        if device_info["cuda_available"]:
            try:
                import torch
                device_info["cuda_device_name"] = torch.cuda.get_device_name(0)
                device_info["cuda_memory_gb"] = round(torch.cuda.get_device_properties(0).total_memory / (1024**3), 2)
                device_info["recommended_device"] = "cuda"
            except:
                device_info["recommended_device"] = "cpu"
        else:
            device_info["recommended_device"] = "cpu"
        
        return device_info
    
    def _get_optimization_settings(self):
        if self.device_info["cuda_available"]:
            return {
                "device": 0,  # Use first GPU
                "batch_size": 8,
                "max_length": 512,
                "use_fast_tokenizer": True,
                "torch_dtype": "float16"
            }
        else:
            return {
                "device": -1,  # Use CPU
                "batch_size": 1,
                "max_length": 256,  # Reduce for CPU
                "use_fast_tokenizer": True,
                "torch_dtype": "float32"
            }

class ModelCache:
    def __init__(self):
        self.cache = {}
        self.access_times = {}
        self.max_cache_size = 3  # Maximum number of models to cache
        self.lock = threading.Lock()
    
    def get_model(self, model_name: str):
        with self.lock:
            if model_name in self.cache:
                self.access_times[model_name] = time.time()
                return self.cache[model_name]
            return None
    
    def set_model(self, model_name: str, model):
        with self.lock:
            # Remove oldest model if cache is full
            if len(self.cache) >= self.max_cache_size:
                oldest_model = min(self.access_times.keys(), key=lambda k: self.access_times[k])
                del self.cache[oldest_model]
                del self.access_times[oldest_model]
            
            self.cache[model_name] = model
            self.access_times[model_name] = time.time()
    
    def clear_cache(self):
        with self.lock:
            self.cache.clear()
            self.access_times.clear()

def test_performance_monitor():
    """Test the PerformanceMonitor class"""
    print("🧪 Testing PerformanceMonitor...")
    
    monitor = PerformanceMonitor()
    
    # Record some test requests
    monitor.record_request(100.5, "success")
    monitor.record_request(85.2, "success")
    monitor.record_request(120.8, "error")
    monitor.record_error("timeout")
    monitor.record_error("model_error")
    monitor.record_memory_usage()
    
    stats = monitor.get_stats()
    print(f"✅ Performance stats: {stats}")
    
    assert stats["total_requests"] == 3
    assert stats["avg_processing_time"] > 0
    assert stats["error_rate"] > 0
    print("✅ PerformanceMonitor tests passed!")

def test_device_manager():
    """Test the DeviceManager class"""
    print("🧪 Testing DeviceManager...")
    
    manager = DeviceManager()
    
    print(f"Device info: {manager.device_info}")
    print(f"Optimization settings: {manager.optimization_settings}")
    
    # Verify required fields exist
    assert "cuda_available" in manager.device_info
    assert "cpu_count" in manager.device_info
    assert "recommended_device" in manager.device_info
    assert "device" in manager.optimization_settings
    assert "batch_size" in manager.optimization_settings
    
    print("✅ DeviceManager tests passed!")

def test_model_cache():
    """Test the ModelCache class"""
    print("🧪 Testing ModelCache...")
    
    cache = ModelCache()
    
    # Test cache operations
    test_model = {"fake": "model"}
    cache.set_model("test_model", test_model)
    
    retrieved = cache.get_model("test_model")
    assert retrieved == test_model
    
    # Test cache miss
    missing = cache.get_model("nonexistent")
    assert missing is None
    
    # Test cache clearing
    cache.clear_cache()
    cleared = cache.get_model("test_model")
    assert cleared is None
    
    print("✅ ModelCache tests passed!")

def test_memory_monitoring():
    """Test memory monitoring functionality"""
    print("🧪 Testing memory monitoring...")
    
    monitor = PerformanceMonitor()
    
    # Test memory recording
    monitor.record_memory_usage()
    time.sleep(0.1)  # Small delay
    monitor.record_memory_usage()
    
    stats = monitor.get_stats()
    print(f"Memory usage: {stats['memory_usage_mb']} MB")
    
    # Should have recorded at least one memory reading
    assert len(monitor.memory_usage) > 0
    
    print("✅ Memory monitoring tests passed!")

async def test_timeout_simulation():
    """Test timeout handling simulation"""
    print("🧪 Testing timeout simulation...")
    
    async def mock_long_running_task():
        await asyncio.sleep(2)  # Simulate 2 second task
        return "completed"
    
    # Test with short timeout
    try:
        result = await asyncio.wait_for(mock_long_running_task(), timeout=0.5)
        assert False, "Should have timed out"
    except asyncio.TimeoutError:
        print("✅ Timeout handling works correctly")
    
    print("✅ Timeout simulation tests passed!")

async def main():
    """Run all tests"""
    print("🚀 Starting performance optimization tests...\n")
    
    try:
        test_performance_monitor()
        print()
        
        test_device_manager()
        print()
        
        test_model_cache()
        print()
        
        test_memory_monitoring()
        print()
        
        # Run async test
        await test_timeout_simulation()
        print()
        
        print("🎉 All performance optimization tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)