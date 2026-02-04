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
            enableVoiceResponse: true
        };
        this.conversationHistory = [];
        this.synthesis = window.speechSynthesis;

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
        setInterval(() => this.checkReminders(), 60000);
    }

    // ========================================
    // DATA PERSISTENCE
    // ========================================

    loadData() {
        const savedTasks = localStorage.getItem('dailyAgentTasks');
        const savedSettings = localStorage.getItem('dailyAgentSettings');
        const savedConversation = localStorage.getItem('dailyAgentConversation');

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
    }

    saveData() {
        localStorage.setItem('dailyAgentTasks', JSON.stringify(this.tasks));
        localStorage.setItem('dailyAgentSettings', JSON.stringify(this.settings));
        localStorage.setItem('dailyAgentConversation', JSON.stringify(this.conversationHistory));
    }

    applySettings() {
        const userNameEl = document.getElementById('userName');
        const timezoneEl = document.getElementById('timezone');
        const notifEl = document.getElementById('enableNotifications');
        const soundEl = document.getElementById('enableSound');
        const voiceEl = document.getElementById('enableVoiceResponse');
        const reminderEl = document.getElementById('reminderAdvance');

        if (userNameEl && this.settings.userName) {
            userNameEl.value = this.settings.userName;
        }
        if (timezoneEl) timezoneEl.value = this.settings.timezone;
        if (notifEl) notifEl.checked = this.settings.enableNotifications;
        if (soundEl) soundEl.checked = this.settings.enableSound;
        if (voiceEl) voiceEl.checked = this.settings.enableVoiceResponse;
        if (reminderEl) reminderEl.value = this.settings.reminderAdvance;
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
                if (!task.reminded) task.reminded = {};
                const today = new Date().toDateString();

                if (this.shouldRemind(currentTime, task.time) && task.reminded[today] !== currentTime) {
                    task.reminded[today] = currentTime;
                    this.sendReminder(task);
                    this.saveData();
                }
            }
        });
    }

    shouldRemind(currentTime, taskTime) {
        const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
        const [taskHours, taskMinutes] = taskTime.split(':').map(Number);

        const currentTotalMinutes = currentHours * 60 + currentMinutes;
        const taskTotalMinutes = taskHours * 60 + taskMinutes;

        const diff = taskTotalMinutes - currentTotalMinutes;

        return diff === this.settings.reminderAdvance;
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
            this.speak(`Pardon me, it is time for ${task.title}.`);
        }
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
        const allTasks = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;

        this.addMessageToChat('agent',
            `You have ${allTasks} total task(s) in your schedule. ${completed} completed. Would you like me to show you a specific day?`
        );
    }

    addRoutine() {
        this.addMessageToChat('agent',
            'Let\'s set up a routine! Tell me what you do regularly. For example: "I exercise every morning at 7 AM" or "I check emails at 9 AM on weekdays"'
        );
    }

    showStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        this.addMessageToChat('agent',
            `📊 Your Stats:\n• Total tasks: ${total}\n• Completed: ${completed}\n• Completion rate: ${completionRate}%\n\nKeep up the great work!`
        );
    }

    trainAgent() {
        this.addMessageToChat('agent',
            'I\'m always learning from you! The more you use me, the better I understand your patterns. Tell me about your typical day, and I\'ll help you optimize your schedule!'
        );
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
