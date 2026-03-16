#!/usr/bin/env python3
"""
Quick System Check for Recording System

Run this script to verify your system is ready for recording functionality.
"""

import sys
import subprocess
import importlib
from pathlib import Path

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major >= 3 and version.minor >= 8:
        print("✅ Python version OK")
        return True
    else:
        print("❌ Python 3.8+ required")
        return False

def check_ffmpeg():
    """Check FFmpeg installation"""
    try:
        result = subprocess.run(['ffmpeg', '-version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("✅ FFmpeg installed")
            return True
        else:
            print("❌ FFmpeg not working")
            return False
    except FileNotFoundError:
        print("❌ FFmpeg not found")
        print("   Install: https://ffmpeg.org/download.html")
        return False
    except Exception as e:
        print(f"❌ FFmpeg check failed: {e}")
        return False

def check_dependencies():
    """Check Python dependencies"""
    deps = [
        'faster_whisper',
        'librosa', 
        'soundfile',
        'numpy',
        'fastapi',
        'sqlalchemy',
        'alembic'
    ]
    
    missing = []
    for dep in deps:
        try:
            importlib.import_module(dep)
            print(f"✅ {dep}")
        except ImportError:
            print(f"❌ {dep} - not installed")
            missing.append(dep)
    
    return len(missing) == 0

def check_directories():
    """Check required directories exist"""
    backend_dir = Path("Ai_powered_interview_coach/backend")
    frontend_dir = Path("Ai_powered_interview_coach/frontend")
    
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    print("✅ Project directories found")
    return True

def check_database_files():
    """Check database migration files"""
    migration_file = Path("Ai_powered_interview_coach/backend/alembic/versions/008_add_recording_fields.py")
    
    if migration_file.exists():
        print("✅ Recording migration file exists")
        return True
    else:
        print("❌ Recording migration file missing")
        return False

def main():
    print("🔍 Quick System Check for Recording System")
    print("=" * 50)
    
    checks = [
        ("Python Version", check_python_version),
        ("FFmpeg", check_ffmpeg),
        ("Dependencies", check_dependencies),
        ("Project Structure", check_directories),
        ("Database Migration", check_database_files)
    ]
    
    results = []
    for name, check_func in checks:
        print(f"\n📋 Checking {name}...")
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} check failed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 50)
    print("📊 Summary")
    print("=" * 50)
    
    passed = 0
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {name}")
        if result:
            passed += 1
    
    print(f"\nResult: {passed}/{len(results)} checks passed")
    
    if passed == len(results):
        print("\n🎉 System ready! Run the full setup:")
        print("   python setup_recording_system.py")
    else:
        print("\n⚠️  Please fix the failed checks first")
        print("\nNext steps:")
        print("1. Install missing dependencies: pip install -r backend/requirements.txt")
        print("2. Install FFmpeg: https://ffmpeg.org/download.html")
        print("3. Run setup script: python setup_recording_system.py")

if __name__ == "__main__":
    main()