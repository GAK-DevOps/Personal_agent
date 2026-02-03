# 🤖 Lokha

Your personal AI-powered daily assistant that learns your schedule, sends smart reminders, and helps you stay productive!

## ✨ Features

### 🎯 Core Capabilities
- **Smart Schedule Management**: Add and manage your daily tasks with an intuitive interface
- **Intelligent Reminders**: Get notified at the right time for the right task
- **AI Chat Interface**: Talk to your agent naturally - it learns from your conversations
- **Recurring Routines**: Set up tasks that repeat on specific days
- **Completion Tracking**: Mark tasks as complete and track your productivity
- **Real-time Clock**: Always know the current time and date

### 🧠 AI Features
- **Pattern Learning**: The agent learns your preferences over time
- **Natural Language**: Chat naturally - the agent understands your intent
- **Contextual Responses**: Get relevant, helpful responses based on your needs
- **Productivity Stats**: Track completion rates and productivity metrics

### 📱 Mobile-Friendly
- **Responsive Design**: Works beautifully on phones, tablets, and desktops
- **Add to Home Screen**: Install as a web app on your mobile device
- **Touch-Optimized**: Smooth interactions designed for mobile use

### 🔔 Notification System
- **Browser Notifications**: Get desktop/mobile notifications for reminders
- **Sound Alerts**: Optional audio notification for important tasks
- **Customizable Timing**: Choose when to receive reminders (at time, 5 min before, etc.)

### 🎨 Design
- **Premium Dark Theme**: Beautiful gradient colors and smooth animations
- **Glassmorphism Effects**: Modern, elegant UI design
- **Smooth Animations**: Micro-animations for enhanced user experience
- **Professional Typography**: Clean, readable Inter font family

## 🚀 Getting Started

### Running Locally

1. Navigate to the project directory:
   ```bash
   cd /Users/agovada/Desktop/Personal_agent/my-daily-agent
   ```

2. Start a local web server:
   ```bash
   python3 -m http.server 8082
   ```

3. Open your browser and go to:
   ```
   http://localhost:8082
   ```

### Using on Mobile

#### Option 1: Same WiFi Network
1. Find your computer's IP address:
   - Mac: System Preferences → Network
   - Look for "IP Address" (usually something like 192.168.x.x)

2. On your phone's browser, visit:
   ```
   http://YOUR_IP_ADDRESS:8082
   ```

#### Option 2: Add to Home Screen (iOS)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Name it "Lokha" and tap Add
5. The app icon will appear on your home screen!

#### Option 3: Add to Home Screen (Android)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen"
4. Name it and tap Add

## 📖 How to Use

### Adding Your First Task

1. **Click "Add Task" button** or tell the agent "Add a task"
2. **Enter task details**:
   - Task name (e.g., "Morning workout")
   - Time (e.g., 7:00 AM)
   - Select days to repeat
   - Optional notes

3. **Save** and the agent will remind you!

### Setting Up Daily Routines

Want the same tasks every day? Easy!

1. Add a task and select all days (Mon-Sun)
2. The agent will remind you every day at the specified time

**Example routines:**
- Morning workout at 7:00 AM
- Check emails at 9:00 AM
- Lunch break at 12:30 PM
- Team meeting at 2:00 PM (Mon, Wed, Fri)
- Evening meditation at 8:00 PM

### Chatting with Your Agent

Just type naturally! The agent understands:
- "What's my schedule today?"
- "Add a reminder for tomorrow"
- "Show me my tasks"
- "What time is it?"
- "Help me stay productive"

### Customizing Settings

Click the ⚙️ settings button to:
- Set your name
- Choose your timezone
- Enable/disable notifications
- Set reminder advance time
- Toggle sound alerts

## 🔧 Technical Details

### Data Storage
- All data is stored locally in your browser (localStorage)
- Your schedule and preferences are private and never sent to any server
- Data persists between sessions

### Notifications
- Uses browser's native notification API
- Requires notification permission (will prompt on first use)
- Works even when the browser is in the background

### AI Capabilities
The current version includes:
- Pattern recognition in your messages
- Context-aware responses
- Task extraction from natural language

**Future upgrades** can include:
- Integration with real AI APIs (Gemini, GPT, Claude)
- Advanced learning algorithms
- Predictive scheduling
- Integration with calendar apps

## 🎯 Use Cases

### For Work
- Morning standup at 9:00 AM
- Check project updates at 11:00 AM
- Lunch break reminder
- End of day review at 5:00 PM

### For Health
- Drink water every 2 hours
- Workout sessions
- Meal times
- Medication reminders

### For Personal Development
- Daily reading time
- Meditation sessions
- Journaling
- Learning new skills

### For Daily Life
- Wake up alarm
- Commute reminders
- Household chores
- Family time

## 🔮 Future Enhancements

Potential features to add:
- [ ] Integration with calendar apps (Google Calendar, Apple Calendar)
- [ ] Voice input/output
- [ ] Advanced AI with real API integration
- [ ] Task categories and tags
- [ ] Habit tracking and streaks
- [ ] Weekly/monthly planning views
- [ ] Export/import schedules
- [ ] Collaborative schedules (share with family/team)
- [ ] Smart suggestions based on patterns
- [ ] Integration with productivity apps

## 💡 Tips

1. **Enable Notifications**: For the best experience, allow browser notifications
2. **Add to Home Screen**: Makes it feel like a native app on your phone
3. **Regular Check-ins**: Chat with your agent daily to help it learn your patterns
4. **Be Specific**: When adding tasks, include helpful details in the notes
5. **Review Stats**: Check your productivity stats to stay motivated!

## 🎨 Customization

Want to customize the look? Edit `style.css`:
- Change color scheme in CSS variables
- Adjust animation speeds
- Modify layout and spacing
- Create your own themes

## 📝 Privacy & Security

- ✅ All data stored locally on your device
- ✅ No data sent to external servers
- ✅ No tracking or analytics
- ✅ You own and control your data
- ✅ Works completely offline (after initial load)

## 🤝 Support

Having issues or ideas? The agent is yours to customize and improve!

---

**Built with ❤️ for productivity and personal growth**

Enjoy your personal AI daily agent, Lokha! 🚀
