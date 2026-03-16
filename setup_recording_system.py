#!/usr/bin/env python3
"""
Recording System Setup Script

This script helps set up the video/audio recording system by:
1. Installing required dependencies
2. Running database migrations
3. Creating storage directories
4. Verifying system readiness

Requirements: Recording System Implementation
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🎯 {title}")
    print("=" * 60)

def print_step(step_num, title):
    """Print a formatted step"""
    print(f"\n📋 Step {step_num}: {title}")
    print("-" * 40)

def run_command(command, description, cwd=None):
    """Run a command and handle errors"""
    print(f"Running: {description}")
    print(f"Command: {command}")
    
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            capture_output=True, 
            text=True,
            cwd=cwd
        )
        print("✅ Success")
        if result.stdout:
            print(f"Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed: {e}")
        if e.stdout:
            print(f"Output: {e.stdout.strip()}")
        if e.stderr:
            print(f"Error: {e.stderr.strip()}")
        return False

def check_python_version():
    """Check Python version compatibility"""
    print_step(1, "Checking Python Version")
    
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required for recording system")
        return False
    
    print("✅ Python version compatible")
    return True

def install_system_dependencies():
    """Install system-level dependencies"""
    print_step(2, "Installing System Dependencies")
    
    system = platform.system().lower()
    
    if system == "linux":
        print("Detected Linux system")
        
        # Check for package managers
        if subprocess.run(["which", "apt"], capture_output=True).returncode == 0:
            print("Using apt package manager")
            commands = [
                "sudo apt update",
                "sudo apt install -y ffmpeg libsndfile1 portaudio19-dev"
            ]
        elif subprocess.run(["which", "yum"], capture_output=True).returncode == 0:
            print("Using yum package manager")
            commands = [
                "sudo yum install -y ffmpeg libsndfile portaudio-devel"
            ]
        else:
            print("⚠️  Unknown package manager. Please install ffmpeg and libsndfile manually")
            return True
            
    elif system == "darwin":  # macOS
        print("Detected macOS system")
        
        if subprocess.run(["which", "brew"], capture_output=True).returncode == 0:
            print("Using Homebrew")
            commands = [
                "brew install ffmpeg libsndfile portaudio"
            ]
        else:
            print("❌ Homebrew not found. Please install Homebrew first:")
            print("   /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"")
            return False
            
    elif system == "windows":
        print("Detected Windows system")
        print("⚠️  Please install FFmpeg manually:")
        print("   1. Download from https://ffmpeg.org/download.html")
        print("   2. Add to PATH environment variable")
        print("   3. Restart terminal/IDE")
        return True
        
    else:
        print(f"⚠️  Unknown system: {system}")
        print("Please install ffmpeg and libsndfile manually")
        return True
    
    # Run installation commands
    success = True
    for command in commands:
        if not run_command(command, f"Installing system dependencies"):
            success = False
            break
    
    return success

def install_python_dependencies():
    """Install Python dependencies"""
    print_step(3, "Installing Python Dependencies")
    
    backend_dir = Path(__file__).parent / "backend"
    
    if not backend_dir.exists():
        print(f"❌ Backend directory not found: {backend_dir}")
        return False
    
    requirements_file = backend_dir / "requirements.txt"
    
    if not requirements_file.exists():
        print(f"❌ Requirements file not found: {requirements_file}")
        return False
    
    # Install requirements
    command = f"{sys.executable} -m pip install -r requirements.txt"
    return run_command(command, "Installing Python dependencies", cwd=backend_dir)

def run_database_migration():
    """Run database migration"""
    print_step(4, "Running Database Migration")
    
    backend_dir = Path(__file__).parent / "backend"
    
    # Check if alembic is available
    command = f"{sys.executable} -m alembic --version"
    if not run_command(command, "Checking Alembic", cwd=backend_dir):
        print("❌ Alembic not available")
        return False
    
    # Run migration
    command = f"{sys.executable} -m alembic upgrade head"
    return run_command(command, "Running database migration", cwd=backend_dir)

def create_storage_directories():
    """Create storage directories"""
    print_step(5, "Creating Storage Directories")
    
    backend_dir = Path(__file__).parent / "backend"
    storage_dirs = [
        backend_dir / "storage" / "media",
        backend_dir / "storage" / "media" / "audio",
        backend_dir / "storage" / "media" / "video",
        backend_dir / "storage" / "media" / "temp"
    ]
    
    for directory in storage_dirs:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created: {directory}")
        except Exception as e:
            print(f"❌ Failed to create {directory}: {e}")
            return False
    
    return True

def verify_installation():
    """Verify the installation"""
    print_step(6, "Verifying Installation")
    
    # Run the test script
    test_script = Path(__file__).parent / "test_recording_system.py"
    
    if not test_script.exists():
        print(f"❌ Test script not found: {test_script}")
        return False
    
    command = f"{sys.executable} {test_script}"
    return run_command(command, "Running verification tests")

def create_env_example():
    """Create .env.example with recording system variables"""
    print_step(7, "Creating Environment Configuration")
    
    backend_dir = Path(__file__).parent / "backend"
    env_example = backend_dir / ".env.example"
    
    recording_config = """
# Recording System Configuration
RECORDING_MAX_FILE_SIZE=104857600  # 100MB in bytes
RECORDING_MAX_DURATION=600         # 10 minutes in seconds
WHISPER_MODEL_SIZE=small           # tiny, base, small, medium, large
WHISPER_DEVICE=auto                # auto, cpu, cuda
STORAGE_CLEANUP_DAYS=30            # Days to keep old recordings
"""
    
    try:
        if env_example.exists():
            # Append to existing file
            with open(env_example, 'a') as f:
                f.write(recording_config)
        else:
            # Create new file
            with open(env_example, 'w') as f:
                f.write(recording_config)
        
        print(f"✅ Updated {env_example}")
        print("   Copy to .env and adjust settings as needed")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create environment config: {e}")
        return False

def main():
    """Main setup process"""
    print_header("Video/Audio Recording System Setup")
    
    print("This script will set up the recording system for your interview coach application.")
    print("It will install dependencies, run migrations, and verify the installation.")
    
    response = input("\nDo you want to continue? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("Setup cancelled.")
        return
    
    steps = [
        check_python_version,
        install_system_dependencies,
        install_python_dependencies,
        run_database_migration,
        create_storage_directories,
        create_env_example,
        verify_installation
    ]
    
    failed_steps = []
    
    for i, step in enumerate(steps, 1):
        try:
            if not step():
                failed_steps.append(step.__name__)
        except Exception as e:
            print(f"❌ Step {i} crashed: {e}")
            failed_steps.append(step.__name__)
    
    # Summary
    print_header("Setup Summary")
    
    if failed_steps:
        print(f"❌ Setup completed with {len(failed_steps)} failed steps:")
        for step in failed_steps:
            print(f"   - {step}")
        print("\nPlease fix the issues and run the setup again.")
        print("You can also run individual steps manually.")
    else:
        print("🎉 Setup completed successfully!")
        print("\nNext steps:")
        print("1. Copy backend/.env.example to backend/.env")
        print("2. Configure your database and other settings")
        print("3. Start the backend server: cd backend && python -m uvicorn app.main:app --reload")
        print("4. Start the frontend: cd frontend && npm start")
        print("5. Test the recording feature in an interview session")
    
    print(f"\nFor troubleshooting, run: python test_recording_system.py")

if __name__ == "__main__":
    main()