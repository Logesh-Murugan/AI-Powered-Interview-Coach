# 🚀 Quick Start Guide - AI Interview Coach

## ✅ **System Status: RUNNING**

Both backend and frontend servers are now running successfully!

## 🌐 **Access Your Application**

### **Frontend (User Interface)**
- **URL**: http://localhost:5173
- **Status**: ✅ Running
- **Features**: Complete interview system with speech-to-text

### **Backend (API Server)**
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Status**: ✅ Running
- **Features**: All APIs including media processing

## 🎯 **How to Use the System**

### **Step 1: Open the Application**
1. Open your web browser
2. Go to: **http://localhost:5173**
3. You should see the AI Interview Coach homepage

### **Step 2: Create Account / Login**
1. Click "Register" if you're new
2. Or "Login" if you have an account
3. Fill in your details

### **Step 3: Start an Interview**
1. Click "Start Interview" or "Practice Interview"
2. Choose your preferences:
   - Job role (e.g., Software Engineer)
   - Difficulty level
   - Number of questions

### **Step 4: Test Both Modes**

#### **Text Mode (Original)**
1. Select "Text" mode (default)
2. Type your answer in the text box
3. Click "Submit Answer"
4. Get AI evaluation and feedback

#### **Speech Mode (NEW)**
1. Select "Speech" mode
2. Click "Start Recording"
3. Grant microphone permission
4. Speak your answer naturally
5. Click "Stop" when done
6. **Watch the magic**: Speech converts to text automatically!
7. Click "Submit Answer"
8. Get AI evaluation + voice analysis

## 🎤 **Testing the Speech-to-Text Feature**

### **Quick Test:**
1. Go to any interview question
2. Switch to "Speech" mode
3. Record yourself saying: "In my previous role, I worked on a challenging project that required problem-solving skills and teamwork."
4. Verify the transcription appears correctly
5. Submit and check that you get the same quality evaluation as text mode

### **What You Should See:**
- ✅ Clear mode selection (Text/Speech toggle)
- ✅ Recording controls with timer
- ✅ Automatic speech-to-text conversion
- ✅ Transcription preview box
- ✅ Same AI evaluation quality
- ✅ Additional voice analysis feedback

## 🔧 **If Something Doesn't Work**

### **Frontend Issues**
- **Problem**: Page won't load
- **Solution**: Check http://localhost:5173 is accessible
- **Alternative**: Try http://localhost:5174

### **Backend Issues**
- **Problem**: API errors
- **Solution**: Check http://localhost:8000/docs loads
- **Check**: Backend terminal for error messages

### **Recording Issues**
- **Problem**: Microphone not working
- **Solution**: Grant browser microphone permissions
- **Check**: Try in Chrome/Firefox/Safari

### **Speech-to-Text Issues**
- **Problem**: No transcription appears
- **Solution**: Check backend logs for Whisper loading
- **Verify**: Media health at http://localhost:8000/api/v1/media/health

## 📊 **System Health Check**

You can verify everything is working by visiting:
- **Frontend**: http://localhost:5173 ✅
- **Backend API**: http://localhost:8000/docs ✅
- **Media Service**: http://localhost:8000/api/v1/media/health ✅

## 🎉 **You're Ready!**

The complete AI-powered interview coach with integrated speech-to-text is now running and ready for use!

### **Key Features Available:**
- ✅ **Dual Input Modes**: Type or speak your answers
- ✅ **AI Evaluation**: Same quality assessment for both modes
- ✅ **Voice Analysis**: Speaking skills feedback for speech mode
- ✅ **Real-time Processing**: Fast speech-to-text conversion
- ✅ **Complete Privacy**: All processing happens locally

### **Next Steps:**
1. Create your account
2. Start your first interview
3. Test both text and speech modes
4. Experience the enhanced AI coaching

**Happy interviewing! 🎯**