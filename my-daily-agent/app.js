// ========================================
// LOKHA - INTELLIGENT ASSISTANT
// ========================================

class DailyAgent {
    constructor() {
        this.tasks = [];
        this.settings = {
            userName: '',
            timezone: 'America/Chicago',
            enableNotifications: true,
            enableSound: true,
            reminderAdvance: 5,
            dailyLimit: 2,
            enableWakeLock: false,
            enableAlarm: false
        };
        this.usage = { date: new Date().toDateString(), minutes: 0, warned: false };
        this.trainingData = [];
        this.conversationHistory = [];
        this.synthesis = window.speechSynthesis;
        this.wakeLock = null;
        this.alarmInterval = null;
        this.heartbeatInterval = null;
        this.silentAudio = null;

        this.init();
    }

    init() {
        this.loadData();
        this.setupVoiceRecognition();
        this.setupEventListeners();
        this.startClock();
        this.checkReminders();
        this.renderTasks();
        this.requestNotificationPermission();

        // Check for reminders every minute
        setInterval(() => {
            this.checkReminders();
            this.trackScreenTime();
        }, 60000);
    }

    // ========================================
    // DATA PERSISTENCE
    // ========================================

    loadData() {
        const savedTasks = localStorage.getItem('dailyAgentTasks');
        const savedSettings = localStorage.getItem('dailyAgentSettings');
        const savedConversation = localStorage.getItem('dailyAgentConversation');
        const savedUsage = localStorage.getItem('dailyAgentUsage');
        const savedTraining = localStorage.getItem('dailyAgentTraining');

        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            this.applySettings();
        }
        if (savedConversation) {
            this.conversationHistory = JSON.parse(savedConversation);
        }
        if (savedUsage) {
            const usage = JSON.parse(savedUsage);
            if (usage.date === new Date().toDateString()) {
                this.usage = usage;
            }
        }
        if (savedTraining) {
            this.trainingData = JSON.parse(savedTraining);
        }
    }

    saveData() {
        localStorage.setItem('dailyAgentTasks', JSON.stringify(this.tasks));
        localStorage.setItem('dailyAgentSettings', JSON.stringify(this.settings));
        localStorage.setItem('dailyAgentConversation', JSON.stringify(this.conversationHistory));
        localStorage.setItem('dailyAgentUsage', JSON.stringify(this.usage));
        localStorage.setItem('dailyAgentTraining', JSON.stringify(this.trainingData));
    }

    applySettings() {
        const userNameEl = document.getElementById('userName');
        const timezoneEl = document.getElementById('timezone');
        const notifEl = document.getElementById('enableNotifications');
        const soundEl = document.getElementById('enableSound');
        const voiceEl = document.getElementById('enableVoiceResponse');
        const reminderEl = document.getElementById('reminderAdvance');
        const screenTimeEl = document.getElementById('enableScreenTimeLimit');
        const dailyLimitEl = document.getElementById('dailyLimit');
        const screenTimeContainer = document.getElementById('screenTimeLimitContainer');

        if (userNameEl && this.settings.userName) {
            userNameEl.value = this.settings.userName;
        }
        if (timezoneEl) timezoneEl.value = this.settings.timezone;
        if (notifEl) notifEl.checked = this.settings.enableNotifications;
        if (soundEl) soundEl.checked = this.settings.enableSound;
        if (voiceEl) voiceEl.checked = this.settings.enableVoiceResponse;
        if (reminderEl) reminderEl.value = this.settings.reminderAdvance;

        if (screenTimeEl) {
            screenTimeEl.checked = this.settings.enableScreenTimeLimit;
            if (screenTimeContainer) {
                screenTimeContainer.style.display = this.settings.enableScreenTimeLimit ? 'block' : 'none';
            }
        }
        if (dailyLimitEl) dailyLimitEl.value = this.settings.dailyLimit;

        const wakeLockEl = document.getElementById('enableWakeLock');
        if (wakeLockEl) {
            wakeLockEl.checked = this.settings.enableWakeLock;
            if (this.settings.enableWakeLock) this.requestWakeLock();
        }

        const alarmEl = document.getElementById('enableAlarm');
        if (alarmEl) alarmEl.checked = this.settings.enableAlarm;

        if (this.settings.enableAlarm || this.settings.enableWakeLock) {
            this.startHeartbeat();
        } else {
            this.stopHeartbeat();
        }
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================

    setupEventListeners() {
        // Chat functionality
        document.getElementById('sendBtn').addEventListener('click', () => this.handleSendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });

        // Voice functionality
        document.getElementById('voiceBtn').addEventListener('click', () => this.toggleVoiceRecognition());

        // Add task modal
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openAddTaskModal());
        document.getElementById('closeTaskModal').addEventListener('click', () => this.closeModal('addTaskModal'));
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.closeModal('addTaskModal'));
        document.getElementById('saveTaskBtn').addEventListener('click', () => this.saveTask());

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeModal('settingsModal'));
        document.getElementById('cancelSettingsBtn').addEventListener('click', () => this.closeModal('settingsModal'));
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('testVoiceBtn').addEventListener('click', () => {
            this.speak('Hello! My name is Lokha. I am ready to help you with your daily schedule.');
        });

        document.getElementById('testNotifBtn').addEventListener('click', () => {
            this.sendTestNotification();
        });

        const screenTimeCheck = document.getElementById('enableScreenTimeLimit');
        if (screenTimeCheck) {
            screenTimeCheck.addEventListener('change', (e) => {
                const container = document.getElementById('screenTimeLimitContainer');
                if (container) {
                    container.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }

        // Day selector
        document.querySelectorAll('.day-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.classList.toggle('active');
            });
        });

        // Quick actions
        document.getElementById('viewScheduleBtn').addEventListener('click', () => this.viewFullSchedule());
        document.getElementById('addRoutineBtn').addEventListener('click', () => this.addRoutine());
        document.getElementById('statsBtn').addEventListener('click', () => this.showStats());
        document.getElementById('trainAgentBtn').addEventListener('click', () => this.trainAgent());

        document.getElementById('closeStatsModal').addEventListener('click', () => this.closeModal('statsModal'));
        document.getElementById('closeStatsBtn').addEventListener('click', () => this.closeModal('statsModal'));
        document.getElementById('closeTrainingModal').addEventListener('click', () => this.closeModal('trainingModal'));
        document.getElementById('cancelTrainingBtn').addEventListener('click', () => this.closeModal('trainingModal'));
        document.getElementById('saveTrainingBtn').addEventListener('click', () => this.saveTrainingLesson());

        document.getElementById('stopAlarmBtn').addEventListener('click', () => this.stopAlarm());

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('☀️ Agent Waking Up...');
                this.checkReminders();
                if (this.settings.enableWakeLock) this.requestWakeLock();
            }
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // ========================================
    // CHAT & AI FUNCTIONALITY
    // ========================================

    handleSendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessageToChat('user', message);
        input.value = '';

        // Process message with AI
        this.processUserMessage(message);
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = sender === 'user' ? '👤' : '🤖';

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to conversation history
        this.conversationHistory.push({ sender, message, timestamp: new Date().toISOString() });
        this.saveData();
    }

    processUserMessage(message) {
        // Simple AI-like responses (you can integrate with real AI API later)
        setTimeout(() => {
            const response = this.generateResponse(message);
            this.addMessageToChat('agent', response);

            // Speak response if voice is enabled
            if (this.settings.enableVoiceResponse) {
                this.speak(response);
            }
        }, 500);
    }

    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        const userName = this.settings.userName || 'there';

        // Check if modal is open and user is confirming
        const modal = document.getElementById('addTaskModal');
        if (modal && modal.classList.contains('active')) {
            if (/\b(yes|ok|okay|fine|good|looks good|save|do it|correct|yep|yeah|yup|sure)\b/.test(lowerMessage)) {
                const saveBtn = document.getElementById('saveTaskBtn');
                if (saveBtn) {
                    setTimeout(() => saveBtn.click(), 100);
                    return `Done! I've saved that to your schedule. What's next?`;
                }
            } else if (/\b(no|wait|stop|change|cancel)\b/.test(lowerMessage)) {
                this.closeModal('addTaskModal');
                return `No problem. I've cancelled that for you.`;
            }
        }

        // Custom trained patterns
        for (const pattern of this.trainingData) {
            const regex = new RegExp(`\\b${pattern.trigger}\\b`, 'i');
            if (regex.test(lowerMessage)) {
                return pattern.response.replace('{userName}', userName);
            }
        }

        // Greeting patterns
        if (/\b(hi|hello|hey|greetings|morning|afternoon|evening)\b/.test(lowerMessage)) {
            const hour = new Date().getHours();
            let timeGreeting = 'Hello';
            if (hour < 12) timeGreeting = 'Good morning';
            else if (hour < 17) timeGreeting = 'Good afternoon';
            else timeGreeting = 'Good evening';

            const greetings = [
                `${timeGreeting}, ${userName}! How can I help you today?`,
                `Hi ${userName}! I'm ready to help you manage your day.`,
                `Hey! Hope you're having a productive day so far. What can I do for you?`,
                `Hello! Ready to conquer your schedule?`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // Action: Add Task (Now with parsing!)
        if (/\b(add|create|new|remind|set|schedule)\b/.test(lowerMessage)) {
            const taskInfo = this.parseNaturalLanguage(message);
            if (taskInfo.title || taskInfo.time) {
                this.openAddTaskModal(taskInfo);
                let response = `I've prepared that for you! `;
                if (taskInfo.title && taskInfo.time) {
                    response += `Scheduled "${taskInfo.title}" at ${taskInfo.time}. Does this look right?`;
                } else if (taskInfo.time) {
                    response += `I set the time to ${taskInfo.time}. What's the task name?`;
                } else {
                    response += `I've started the form. When should I remind you about "${taskInfo.title}"?`;
                }
                return response;
            }
            this.openAddTaskModal();
            return `Of course! I've opened the task form. Tell me what "${userName}" needs to get done!`;
        }

        // Action: Check Schedule
        if (/\b(schedule|tasks|agenda|today|to do|doing)\b/.test(lowerMessage)) {
            const todayTasks = this.getTodayTasks();
            if (todayTasks.length === 0) {
                return `Currently, your schedule for today is completely clear, ${userName}. A perfect time to plan something new!`;
            }
            const pending = todayTasks.filter(t => !t.completed).length;
            if (pending === 0) {
                return `You've actually finished everything on your list for today! Great job, ${userName}!`;
            }
            return `You have ${todayTasks.length} tasks today, with ${pending} still to go. I've listed them below for you.`;
        }

        // Action: Time
        if (/\b(time|clock|date|day)\b/.test(lowerMessage)) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            return `It's currently ${timeStr} on this lovely ${dateStr}.`;
        }

        // Action: How are you?
        if (/\b(how are you|how's it going|how you doing)\b/.test(lowerMessage)) {
            return `I'm functioning perfectly and ready to help you! How are things with you, ${userName}?`;
        }

        // Action: Thank you
        if (/\b(thanks|thank you|thx|cheers)\b/.test(lowerMessage)) {
            const responses = [
                `You're very welcome, ${userName}! Any time.`,
                `My pleasure! Happy to help.`,
                `No problem at all! Just doing my job.`,
                `Glad I could help!`
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Pattern learning: Recurring
        if (/\b(every|daily|weekly|always)\b/.test(lowerMessage)) {
            return `I noticed you're talking about a routine. You can set tasks to repeat on specific days in the 'Add Task' menu!`;
        }

        // Help
        if (lowerMessage.includes('help') || lowerMessage === '?') {
            return `I'm Lokha, your personal assistant. Here's what I can do:\n• Manage your schedule and set reminders\n• Learn your daily routines\n• Track your productivity stats\n• Keep you organized via voice or text!\n\nJust tell me what's on your mind.`;
        }

        // Default
        return `I'm listening, ${userName}! I'm still learning your patterns, but I can certainly help you with your schedule or reminders if you'd like.`;
    }

    parseNaturalLanguage(text) {
        const lower = text.toLowerCase();
        let time = '';
        let title = '';

        // Time extraction (Basic regex for times like 8pm, 8:30 am, 20:00)
        let timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] || '00';
            const ampm = timeMatch[3].toLowerCase();

            if (ampm === 'pm' && hours < 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;

            time = `${hours.toString().padStart(2, '0')}:${minutes}`;
        } else {
            // Check for 24h format like 20:00
            timeMatch = text.match(/([012]?\d):(\d{2})/);
            if (timeMatch) {
                time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            }
        }

        // Title extraction (Everything between 'add/remind me to' and 'at/by/today')
        const titleMatch = lower.match(/(?:add|remind me to|create|new|schedule|set)\s+(.*?)(?:\s+at|\s+by|\s+today|\s+tonight|$)/);
        if (titleMatch) {
            title = titleMatch[1].trim();
            // Clean up common filler words
            title = title.replace(/\b(a|the|task|reminder|appointment|schedule|agenda)\b/gi, '').trim();
            title = title.charAt(0).toUpperCase() + title.slice(1);
        }

        return { title, time };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================
    // VOICE RECOGNITION & SPEECH
    // ========================================

    setupVoiceRecognition() {
        // Check if browser supports speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            document.getElementById('voiceBtn').classList.add('listening');
            document.getElementById('chatInput').placeholder = '🎤 Listening...';
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chatInput').value = transcript;
            this.handleSendMessage();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopVoiceRecognition();

            if (event.error === 'not-allowed') {
                this.addMessageToChat('agent', 'Microphone access denied. Please enable microphone permissions in your browser settings.');
            }
        };

        this.recognition.onend = () => {
            this.stopVoiceRecognition();
        };
    }

    toggleVoiceRecognition() {
        if (!this.recognition) {
            this.addMessageToChat('agent', 'Voice recognition is not supported in your browser. Try using Chrome or Safari.');
            return;
        }

        if (this.isListening) {
            this.stopVoiceRecognition();
        } else {
            this.startVoiceRecognition();
        }
    }

    startVoiceRecognition() {
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting voice recognition:', error);
        }
    }

    stopVoiceRecognition() {
        this.isListening = false;
        document.getElementById('voiceBtn').classList.remove('listening');
        document.getElementById('chatInput').placeholder = 'Ask me anything or describe your routine...';

        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                // Already stopped
            }
        }
    }

    speak(text) {
        // Stop any ongoing speech
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        // Try to use a more natural voice
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice =>
            voice.lang.startsWith('en') && voice.name.includes('Samantha')
        ) || voices.find(voice => voice.lang.startsWith('en'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        this.synthesis.speak(utterance);
    }

    // ========================================
    // TASK MANAGEMENT
    // ========================================

    openAddTaskModal(prefill = null) {
        this.clearTaskForm();
        if (prefill) {
            if (prefill.title) document.getElementById('taskTitle').value = prefill.title;
            if (prefill.time) document.getElementById('taskTime').value = prefill.time;
        }
        document.getElementById('addTaskModal').classList.add('active');
        document.getElementById('taskTitle').focus();
    }

    saveTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const time = document.getElementById('taskTime').value;
        const notes = document.getElementById('taskNotes').value.trim();
        const enableReminder = document.getElementById('enableReminder').checked;

        if (!title || !time) {
            alert('Please enter a task name and time');
            return;
        }

        const selectedDays = Array.from(document.querySelectorAll('.day-btn.active'))
            .map(btn => btn.dataset.day);

        const task = {
            id: Date.now(),
            title,
            time,
            days: selectedDays.length > 0 ? selectedDays : ['today'],
            notes,
            enableReminder,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveData();
        this.renderTasks();
        this.closeModal('addTaskModal');
        this.clearTaskForm();

        this.addMessageToChat('agent', `Perfect! I've added "${title}" to your schedule at ${this.formatTime(time)}. I'll remind you when it's time!`);
    }

    clearTaskForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskTime').value = '';
        document.getElementById('taskNotes').value = '';
        document.getElementById('enableReminder').checked = true;
        document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('active'));
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const todayTasks = this.getTodayTasks();

        if (todayTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <div class="empty-state-text">No tasks scheduled for today</div>
                </div>
            `;
            return;
        }

        // Sort by time
        todayTasks.sort((a, b) => a.time.localeCompare(b.time));

        container.innerHTML = todayTasks.map(task => {
            const isUpcoming = this.isTaskUpcoming(task);
            const upcomingClass = isUpcoming ? 'task-upcoming' : '';
            const completedClass = task.completed ? 'task-completed' : '';

            return `
                <div class="task-card ${upcomingClass} ${completedClass}" data-task-id="${task.id}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="agent.toggleTask(${task.id})">
                        ${task.completed ? '✓' : ''}
                    </div>
                    <div class="task-info">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        <div class="task-time">${this.formatTime(task.time)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getTodayTasks() {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

        return this.tasks.filter(task => {
            if (task.days.includes('today')) return true;
            return task.days.some(day => day.startsWith(today.substring(0, 3)));
        });
    }

    isTaskUpcoming(task) {
        const now = new Date();
        const [hours, minutes] = task.time.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0);

        const diff = taskTime - now;
        return diff > 0 && diff <= 3600000; // Within 1 hour
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveData();
            this.renderTasks();

            if (task.completed) {
                this.addMessageToChat('agent', `Great job completing "${task.title}"! Keep up the good work! 🎉`);
            }
        }
    }

    formatTime(time24) {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    // ========================================
    // REMINDER SYSTEM
    // ========================================

    async requestNotificationPermission() {
        if ('Notification' in window && this.settings.enableNotifications) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
    }

    checkReminders() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const todayTasks = this.getTodayTasks();

        todayTasks.forEach(task => {
            if (!task.completed && task.enableReminder) {
                const today = new Date().toDateString();
                if (!task.remindersSent) task.remindersSent = {};

                const diff = this.getMinutesDiff(currentTime, task.time);

                // Remind if we are within the advance window (e.g., 5 mins before) up to 1 minute after
                if (diff <= this.settings.reminderAdvance && diff >= -1 && !task.remindersSent[today]) {
                    task.remindersSent[today] = true;
                    this.sendReminder(task);
                    this.saveData();
                }
            }
        });
    }

    getMinutesDiff(currentTime, taskTime) {
        const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
        const [taskHours, taskMinutes] = taskTime.split(':').map(Number);

        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        const taskTotalMinutes = taskHours * 60 + taskMinutes;

        return taskTotalMinutes - currentTotalMinutes;
    }

    trackScreenTime() {
        if (!this.settings.enableScreenTimeLimit) return;

        const today = new Date().toDateString();
        if (this.usage.date !== today) {
            this.usage = { date: today, minutes: 0, warned: false };
        }

        this.usage.minutes += 1;

        const limitMinutes = (this.settings.dailyLimit || 2) * 60;
        if (this.usage.minutes >= limitMinutes && !this.usage.warned) {
            this.usage.warned = true;
            this.sendScreenTimeWarning();
        }
        this.saveData();
    }

    sendScreenTimeWarning() {
        const msg = `⚠️ Lokha Alert: You've reached your ${this.settings.dailyLimit}h screen time goal today. Time for a break?`;
        this.addMessageToChat('agent', msg);

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('Screen Time Limit reached', {
                    body: msg,
                    icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'
                });
            });
        }

        if (this.settings.enableVoiceResponse) {
            this.speak(`Hey ${this.settings.userName || 'there'}, you've hit your screen time limit for today. Let's take a break and rest your eyes!`);
        }
    }

    sendReminder(task) {
        // Use Service Worker for better mobile support if available
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Lokha Task Reminder', {
                    body: `Time for: ${task.title}`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
                    tag: `task-${task.id}`
                });
            });
        } else if (this.settings.enableNotifications && Notification.permission === 'granted') {
            new Notification('Lokha Task Reminder', {
                body: `Time for: ${task.title}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'
            });
        }

        if (this.settings.enableSound) {
            this.playNotificationSound();
        }

        const reminderMsg = `⏰ Reminder: It's time for "${task.title}"!`;
        this.addMessageToChat('agent', reminderMsg);

        if (this.settings.enableVoiceResponse) {
            // Give the audio context a moment to breathe before speaking
            setTimeout(() => {
                this.speak(`Excuse me, this is your reminder for: ${task.title}.`);
            }, 1000);
        }

        if (this.settings.enableAlarm) {
            this.startAlarm(task);
        }
    }

    startAlarm(task) {
        this.isAlarming = true;
        const overlay = document.getElementById('alarmOverlay');
        const title = document.getElementById('alarmTaskTitle');
        if (overlay && title) {
            title.textContent = `TIME FOR: ${task.title.toUpperCase()}`;
            overlay.style.display = 'flex';
        }

        // Persistent looping sound and voice
        this.alarmInterval = setInterval(() => {
            if (this.settings.enableSound) this.playNotificationSound();
            if (this.settings.enableVoiceResponse) {
                this.speak(`Hey! It is time for ${task.title}. Please complete your task.`);
            }
        }, 5000);
    }

    stopAlarm() {
        this.isAlarming = false;
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
        if (this.synthesis.speaking) this.synthesis.cancel();

        const overlay = document.getElementById('alarmOverlay');
        if (overlay) overlay.style.display = 'none';

        this.addMessageToChat('agent', 'Alarm stopped. You\'ve got this! Move fast! 🚀');
    }

    playNotificationSound() {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // ========================================
    // SETTINGS
    // ========================================

    openSettingsModal() {
        document.getElementById('settingsModal').classList.add('active');
    }

    saveSettings() {
        this.settings.userName = document.getElementById('userName').value.trim();
        this.settings.timezone = document.getElementById('timezone').value;
        this.settings.enableNotifications = document.getElementById('enableNotifications').checked;
        this.settings.enableSound = document.getElementById('enableSound').checked;
        this.settings.enableVoiceResponse = document.getElementById('enableVoiceResponse').checked;
        this.settings.reminderAdvance = parseInt(document.getElementById('reminderAdvance').value);
        this.settings.enableScreenTimeLimit = document.getElementById('enableScreenTimeLimit').checked;
        this.settings.dailyLimit = parseFloat(document.getElementById('dailyLimit').value) || 2;
        this.settings.enableWakeLock = document.getElementById('enableWakeLock').checked;
        this.settings.enableAlarm = document.getElementById('enableAlarm').checked;

        if (this.settings.enableWakeLock) {
            this.requestWakeLock();
        } else {
            this.releaseWakeLock();
        }

        if (this.settings.enableAlarm || this.settings.enableWakeLock) {
            this.startHeartbeat();
        } else {
            this.stopHeartbeat();
        }

        this.saveData();
        this.closeModal('settingsModal');

        this.addMessageToChat('agent', 'Settings saved! I\'ll use these preferences to help you better.');

        if (this.settings.enableNotifications) {
            this.requestNotificationPermission();
        }
    }

    // ========================================
    // QUICK ACTIONS
    // ========================================

    viewFullSchedule() {
        const todayTasks = this.getTodayTasks();
        if (todayTasks.length === 0) {
            this.addMessageToChat('agent', "Your schedule is currently clear. Want to add something?");
            return;
        }

        let scheduleMsg = "📅 **Today's Schedule:**\n";
        todayTasks.sort((a, b) => a.time.localeCompare(b.time)).forEach(t => {
            scheduleMsg += `• ${this.formatTime(t.time)}: ${t.title} ${t.completed ? '✅' : '⏳'}\n`;
        });
        this.addMessageToChat('agent', scheduleMsg);
    }

    addRoutine() {
        const routines = [
            { title: "Morning Kickstart", tasks: [{ t: "Drink Water", time: "07:00" }, { t: "Exercise", time: "07:15" }, { t: "Check Emails", time: "08:30" }] },
            { title: "Evening Wind Down", tasks: [{ t: "Read", time: "21:30" }, { t: "Meditate", time: "22:00" }, { t: "Plan Tomorrow", time: "22:15" }] }
        ];

        const choice = routines[Math.floor(Math.random() * routines.length)];
        choice.tasks.forEach(task => {
            this.tasks.push({
                id: Date.now() + Math.random(),
                title: task.t,
                time: task.time,
                days: ['today'],
                notes: `Added from ${choice.title}`,
                enableReminder: true,
                completed: false,
                createdAt: new Date().toISOString()
            });
        });

        this.saveData();
        this.renderTasks();
        this.addMessageToChat('agent', `Added the **${choice.title}** routine to your day! 🚀`);
    }

    showStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const screenUsage = Math.round((this.usage.minutes / 60) * 10) / 10;

        const body = document.getElementById('statsBody');
        body.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 3rem; font-weight: bold; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${completionRate}%</div>
                <div style="color: var(--color-text-muted);">Overall Completion</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 1.2rem; font-weight: 600;">${completed}/${total}</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-muted);">Tasks Done</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                    <div style="font-size: 1.2rem; font-weight: 600;">${screenUsage}h</div>
                    <div style="font-size: 0.8rem; color: var(--color-text-muted);">Screen Time</div>
                </div>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: rgba(99, 102, 241, 0.1); border-radius: 12px; color: var(--color-text-primary); border-left: 4px solid var(--color-primary);">
                <strong>Lokha's Insight:</strong> ${completionRate > 80 ? "You're a productivity machine! 🚀" : "Consistent progress is the key. You've got this! 💪"}
            </div>
        `;
        document.getElementById('statsModal').classList.add('active');
    }

    trainAgent() {
        this.renderTrainingList();
        document.getElementById('trainingModal').classList.add('active');
    }

    saveTrainingLesson() {
        const trigger = document.getElementById('trainTrigger').value.trim();
        const response = document.getElementById('trainResponse').value.trim();

        if (trigger && response) {
            this.trainingData.push({ trigger, response });
            this.saveData();
            this.renderTrainingList();
            document.getElementById('trainTrigger').value = '';
            document.getElementById('trainResponse').value = '';
            this.addMessageToChat('agent', `I've learned a new pattern! Now when you say "${trigger}", I'll know what to do.`);
        }
    }

    renderTrainingList() {
        const list = document.getElementById('customPatternsList');
        if (this.trainingData.length === 0) {
            list.innerHTML = '<p style="font-size: 0.8rem; color: var(--color-text-muted);">No custom lessons yet.</p>';
            return;
        }
        list.innerHTML = '<strong style="display:block; margin-bottom:10px; font-size: 0.9rem;">Current Lessons:</strong>' + this.trainingData.map((p, i) => `
            <div style="font-size: 0.8rem; margin-top: 5px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--color-text-secondary);">"${p.trigger}" → ${p.response.substring(0, 20)}...</span>
                <button onclick="agent.deleteLesson(${i})" style="background:rgba(255,77,77,0.1); border:none; color: #ff4d4d; cursor:pointer; padding: 2px 8px; border-radius: 4px;">×</button>
            </div>
        `).join('');
    }

    deleteLesson(index) {
        this.trainingData.splice(index, 1);
        this.saveData();
        this.renderTrainingList();
    }

    // ========================================
    // ADVANCED BACKGROUND UTILITIES
    // ========================================

    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('✅ Screen Wake Lock active');
            } catch (err) {
                console.warn(`Wake Lock Error: ${err.name}, ${err.message}`);
            }
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    sendTestNotification() {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('Lokha Test Alert', {
                    body: "If you're reading this, Lokha can reach you! 🔔",
                    icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'
                });
            });
        } else if (Notification.permission === 'granted') {
            new Notification('Lokha Test Alert', {
                body: "If you're reading this, Lokha can reach you! 🔔",
                icon: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png'
            });
        } else {
            this.addMessageToChat('agent', "Notification permission not granted. Please enable it in Settings.");
            Notification.requestPermission();
        }
    }

    // ========================================
    // BACKGROUND SURVIVAL (HEARTBEAT)
    // ========================================

    startHeartbeat() {
        if (this.heartbeatInterval) return;

        console.log('💓 Starting Service Heartbeat...');

        // Create a silent audio element to keep the background process alive
        if (!this.silentAudio) {
            this.silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
            this.silentAudio.loop = true;
        }

        // Pulse the logic every 30 seconds instead of 60 for higher accuracy
        this.heartbeatInterval = setInterval(() => {
            if (this.settings.enableAlarm || this.settings.enableWakeLock) {
                this.silentAudio.play().catch(() => { });
                this.checkReminders();
            }
        }, 30000);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.silentAudio) {
            this.silentAudio.pause();
        }
    }

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };

            document.getElementById('currentTime').textContent =
                now.toLocaleString('en-US', options);
        };

        updateClock();
        setInterval(updateClock, 1000);
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
}

// ========================================
// INITIALIZE APP
// ========================================

let agent;

document.addEventListener('DOMContentLoaded', () => {
    agent = new DailyAgent();

    // Add some demo tasks if it's first time
    if (agent.tasks.length === 0) {
        agent.addMessageToChat('agent',
            'Welcome! I\'m Lokha, your personal daily agent. I can help you manage your schedule and remind you of important tasks. Try adding your first task!'
        );
    }
});

// Make agent globally accessible for inline event handlers
window.agent = agent;
