// اپلیکیشن WebRTC اتاق ویدیویی ایران
// بهینه شده برای اینترنت ضعیف و موبایل

class IranVideoCall {
    constructor() {
        this.socket = null;
        this.localStream = null;
        this.peerConnections = {};
        this.roomName = 'iran'; // اتاق ثابت ایران
        this.userId = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        
        // تنظیمات بهینه برای اینترنت ضعیف
        this.mediaConstraints = {
            video: {
                width: { ideal: 320, max: 640 },
                height: { ideal: 240, max: 480 },
                frameRate: { ideal: 15, max: 20 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000
            }
        };
        
        // سرورهای STUN رایگان عمومی
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ];
        
        // تلاش برای اضافه کردن سرور TURN رایگان
        this.addFreeTurnServers();
        
        this.init();
    }
    
    // تلاش برای اضافه کردن سرورهای TURN رایگان
    async addFreeTurnServers() {
        try {
            // تست سرورهای TURN رایگان
            const freeTurnServers = [
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },
                {
                    urls: 'turn:turn.matrix.org:3478',
                    username: 'turn',
                    credential: 'turn'
                }
            ];
            
            // اضافه کردن به لیست ICE servers
            this.iceServers.push(...freeTurnServers);
        } catch (error) {
            console.log('خطا در اضافه کردن سرورهای TURN:', error);
        }
    }
    
    // مقداردهی اولیه
    async init() {
        try {
            // اتصال به سرور سیگنالینگ
            this.socket = io();
            this.setupSocketListeners();
            
            // تنظیم event listeners برای دکمه‌ها
            this.setupUIListeners();
            
            console.log('اپلیکیشن با موفقیت مقداردهی اولیه شد');
        } catch (error) {
            console.error('خطا در مقداردهی اولیه:', error);
            this.showError('خطا در بارگذاری اپلیکیشن');
        }
    }
    
    // تنظیم listeners برای Socket.IO
    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.userId = this.socket.id;
            console.log('به سرور متصل شدیم:', this.userId);
            this.updateConnectionStatus('connected');
        });
        
        this.socket.on('disconnect', () => {
            console.log('اتصال با سرور قطع شد');
            this.updateConnectionStatus('disconnected');
            this.handleReconnection();
        });
        
        this.socket.on('users-list', (users) => {
            console.log('لیست کاربران:', users);
            this.updateUserCount(users.length + 1); // +1 برای خود کاربر
            
            // ایجاد اتصال با کاربران موجود
            users.forEach(userId => {
                this.createPeerConnection(userId);
                this.createOffer(userId);
            });
        });
        
        this.socket.on('user-joined', (data) => {
            console.log('کاربر جدید پیوست:', data.userId);
            this.updateUserCount(this.getUserCount() + 1);
            
            // ایجاد اتصال با کاربر جدید
            this.createPeerConnection(data.userId);
            this.createOffer(data.userId);
        });
        
        this.socket.on('user-left', (data) => {
            console.log('کاربر خارج شد:', data.userId);
            this.updateUserCount(this.getUserCount() - 1);
            this.removePeerConnection(data.userId);
        });
        
        this.socket.on('offer', async (data) => {
            console.log('Offer دریافت شد از:', data.fromUserId);
            await this.handleOffer(data.offer, data.fromUserId);
        });
        
        this.socket.on('answer', async (data) => {
            console.log('Answer دریافت شد از:', data.fromUserId);
            await this.handleAnswer(data.answer, data.fromUserId);
        });
        
        this.socket.on('ice-candidate', async (data) => {
            console.log('ICE Candidate دریافت شد از:', data.fromUserId);
            await this.handleIceCandidate(data.candidate, data.fromUserId);
        });
        
        this.socket.on('chat-message', (data) => {
            this.displayChatMessage(data);
        });
        
        this.socket.on('user-status', (data) => {
            this.updateUserStatus(data);
        });
        
        this.socket.on('reconnect-success', () => {
            console.log('اتصال مجدد موفق بود');
            this.updateConnectionStatus('connected');
        });
    }
    
    // تنظیم listeners برای رابط کاربری
    setupUIListeners() {
        // دکمه شروع تماس
        document.getElementById('startCallBtn').addEventListener('click', () => {
            this.startCall();
        });
        
        // دکمه‌های کنترل
        document.getElementById('toggleVideoBtn').addEventListener('click', () => {
            this.toggleVideo();
        });
        
        document.getElementById('toggleAudioBtn').addEventListener('click', () => {
            this.toggleAudio();
        });
        
        document.getElementById('toggleScreenBtn').addEventListener('click', () => {
            this.toggleScreenShare();
        });
        
        document.getElementById('endCallBtn').addEventListener('click', () => {
            this.endCall();
        });
        
        // چت
        document.getElementById('sendChatBtn').addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        // مدیریت تغییر جهت صفحه
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustVideoLayout();
            }, 100);
        });
    }
    
    // شروع تماس
    async startCall() {
        try {
            this.updateConnectionStatus('connecting');
            
            // درخواست دسترسی به میکروفون و دوربین
            this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
            
            // نمایش ویدیو محلی
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = this.localStream;
            
            // نمایش محیط تماس
            document.getElementById('startCallSection').classList.add('hidden');
            document.getElementById('callSection').classList.remove('hidden');
            
            // بهینه‌سازی کیفیت برای اینترنت ضعیف
            this.optimizeForLowBandwidth();
            
            // شروع مانیتورینگ کیفیت
            this.startQualityMonitoring();
            
            this.updateConnectionStatus('connected');
            console.log('تماس با موفقیت شروع شد');
            
        } catch (error) {
            console.error('خطا در شروع تماس:', error);
            this.showError('خطا در دسترسی به دوربین یا میکروفون');
        }
    }
    
    // ایجاد اتصال Peer
    createPeerConnection(userId) {
        try {
            const configuration = {
                iceServers: this.iceServers,
                iceCandidatePoolSize: 10
            };
            
            const pc = new RTCPeerConnection(configuration);
            
            // اضافه کردن استریم محلی به اتصال
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    pc.addTrack(track, this.localStream);
                });
            }
            
            // مدیریت ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('ice-candidate', {
                        targetUserId: userId,
                        candidate: event.candidate
                    });
                }
            };
            
            // مدیریت استریم‌های دریافتی
            pc.ontrack = (event) => {
                console.log('استریم جدید دریافت شد از:', userId);
                this.addRemoteVideo(userId, event.streams[0]);
            };
            
            // مدیریت تغییر وضعیت اتصال
            pc.onconnectionstatechange = () => {
                console.log(`وضعیت اتصال با ${userId}:`, pc.connectionState);
                this.handleConnectionStateChange(userId, pc.connectionState);
            };
            
            // ذخیره اتصال
            this.peerConnections[userId] = pc;
            
        } catch (error) {
            console.error('خطا در ایجاد اتصال Peer:', error);
        }
    }
    
    // ایجاد Offer
    async createOffer(userId) {
        try {
            const pc = this.peerConnections[userId];
            if (!pc) return;
            
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            await pc.setLocalDescription(offer);
            
            this.socket.emit('offer', {
                targetUserId: userId,
                offer: offer
            });
            
        } catch (error) {
            console.error('خطا در ایجاد Offer:', error);
        }
    }
    
    // مدیریت Offer دریافتی
    async handleOffer(offer, fromUserId) {
        try {
            let pc = this.peerConnections[fromUserId];
            if (!pc) {
                this.createPeerConnection(fromUserId);
                pc = this.peerConnections[fromUserId];
            }
            
            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            this.socket.emit('answer', {
                targetUserId: fromUserId,
                answer: answer
            });
            
        } catch (error) {
            console.error('خطا در مدیریت Offer:', error);
        }
    }
    
    // مدیریت Answer دریافتی
    async handleAnswer(answer, fromUserId) {
        try {
            const pc = this.peerConnections[fromUserId];
            if (pc) {
                await pc.setRemoteDescription(answer);
            }
        } catch (error) {
            console.error('خطا در مدیریت Answer:', error);
        }
    }
    
    // مدیریت ICE Candidate دریافتی
    async handleIceCandidate(candidate, fromUserId) {
        try {
            const pc = this.peerConnections[fromUserId];
            if (pc) {
                await pc.addIceCandidate(candidate);
            }
        } catch (error) {
            console.error('خطا در مدیریت ICE Candidate:', error);
        }
    }
    
    // اضافه کردن ویدیو دوربرد
    addRemoteVideo(userId, stream) {
        // بررسی آیا ویدیو از قبل وجود دارد
        let videoContainer = document.getElementById(`video-${userId}`);
        if (videoContainer) {
            // به‌روزرسانی استریم موجود
            const video = videoContainer.querySelector('video');
            video.srcObject = stream;
            return;
        }
        
        // ایجاد کانتینر ویدیوی جدید
        videoContainer = document.createElement('div');
        videoContainer.id = `video-${userId}`;
        videoContainer.className = 'video-container';
        
        videoContainer.innerHTML = `
            <video class="video-element" autoplay playsinline></video>
            <div class="video-overlay">
                <span>کاربر ${userId.substring(0, 8)}</span>
                <span id="status-${userId}" class="mr-2"></span>
            </div>
            <button class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded hover:bg-opacity-70" onclick="app.toggleFullscreen('video-${userId}')">
                <i class="fas fa-expand"></i>
            </button>
        `;
        
        // تنظیم استریم
        const video = videoContainer.querySelector('video');
        video.srcObject = stream;
        
        // اضافه به گرید ویدیوها
        document.getElementById('videoGrid').appendChild(videoContainer);
    }
    
    // حذف اتصال Peer
    removePeerConnection(userId) {
        const pc = this.peerConnections[userId];
        if (pc) {
            pc.close();
            delete this.peerConnections[userId];
        }
        
        // حذف ویدیو
        const videoContainer = document.getElementById(`video-${userId}`);
        if (videoContainer) {
            videoContainer.remove();
        }
    }
    
    // خاموش/روشن کردن ویدیو
    toggleVideo() {
        if (!this.localStream) return;
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            this.isVideoEnabled = !this.isVideoEnabled;
            videoTrack.enabled = this.isVideoEnabled;
            
            const btn = document.getElementById('toggleVideoBtn');
            btn.classList.toggle('active', this.isVideoEnabled);
            
            // به‌روزرسانی وضعیت برای دیگران
            this.socket.emit('user-status', {
                videoEnabled: this.isVideoEnabled
            });
            
            // به‌روزرسانی وضعیت محلی
            this.updateLocalStatus();
        }
    }
    
    // خاموش/روشن کردن صدا
    toggleAudio() {
        if (!this.localStream) return;
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            this.isAudioEnabled = !this.isAudioEnabled;
            audioTrack.enabled = this.isAudioEnabled;
            
            const btn = document.getElementById('toggleAudioBtn');
            btn.classList.toggle('active', this.isAudioEnabled);
            
            // به‌روزرسانی وضعیت برای دیگران
            this.socket.emit('user-status', {
                audioEnabled: this.isAudioEnabled
            });
            
            // به‌روزرسانی وضعیت محلی
            this.updateLocalStatus();
        }
    }
    
    // اشتراک‌گذاری صفحه
    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // شروع اشتراک‌گذاری صفحه
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        frameRate: { ideal: 15, max: 30 }
                    },
                    audio: true
                });
                
                // جایگزینی track ویدیو
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = this.getVideoSender();
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
                
                // مدیریت پایان اشتراک‌گذاری
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
                
                this.isScreenSharing = true;
                document.getElementById('toggleScreenBtn').classList.add('active');
                
            } else {
                this.stopScreenShare();
            }
            
        } catch (error) {
            console.error('خطا در اشتراک‌گذاری صفحه:', error);
            this.showError('خطا در اشتراک‌گذاری صفحه');
        }
    }
    
    // توقف اشتراک‌گذاری صفحه
    async stopScreenShare() {
        try {
            // بازگرداندن ویدیو محلی
            const videoTrack = this.localStream.getVideoTracks()[0];
            const sender = this.getVideoSender();
            
            if (sender && videoTrack) {
                await sender.replaceTrack(videoTrack);
            }
            
            this.isScreenSharing = false;
            document.getElementById('toggleScreenBtn').classList.remove('active');
            
        } catch (error) {
            console.error('خطا در توقف اشتراک‌گذاری صفحه:', error);
        }
    }
    
    // گرفتن sender ویدیو
    getVideoSender() {
        for (const pc of Object.values(this.peerConnections)) {
            const senders = pc.getSenders();
            const videoSender = senders.find(sender => 
                sender.track && sender.track.kind === 'video'
            );
            if (videoSender) return videoSender;
        }
        return null;
    }
    
    // بهینه‌سازی برای پهنای باند کم
    optimizeForLowBandwidth() {
        Object.values(this.peerConnections).forEach(pc => {
            // تنظیمات کدک برای پهنای باند کم
            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) {
                const parameters = sender.getParameters();
                
                if (!parameters.encodings) {
                    parameters.encodings = [{}];
                }
                
                // محدود کردن بیت‌ریت
                parameters.encodings[0].maxBitrate = 200000; // 200 kbps
                
                // کاهش رزولوشن و فریم‌ریت
                parameters.encodings[0].scaleResolutionDownBy = 2;
                
                sender.setParameters(parameters).catch(console.error);
            }
        });
    }
    
    // شروع مانیتورینگ کیفیت
    startQualityMonitoring() {
        setInterval(() => {
            this.monitorConnectionQuality();
        }, 5000); // هر 5 ثانیه
    }
    
    // مانیتورینگ کیفیت اتصال
    async monitorConnectionQuality() {
        try {
            for (const [userId, pc] of Object.entries(this.peerConnections)) {
                const stats = await pc.getStats();
                let bitrate = 0;
                let packetsLost = 0;
                let rtt = 0;
                
                stats.forEach(report => {
                    if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                        // محاسبه بیت‌ریت
                        if (this.lastStats[userId]) {
                            const lastReport = this.lastStats[userId].get(report.id);
                            if (lastReport) {
                                const timeDiff = report.timestamp - lastReport.timestamp;
                                const bytesDiff = report.bytesReceived - lastReport.bytesReceived;
                                bitrate = Math.round((bytesDiff * 8) / (timeDiff / 1000));
                            }
                        }
                        packetsLost = report.packetsLost;
                    }
                    
                    if (report.type === 'remote-candidate') {
                        rtt = report.roundTripTime;
                    }
                });
                
                // ذخیره آمار فعلی
                this.lastStats[userId] = stats;
                
                // به‌روزرسانی UI
                this.updateQualityInfo(bitrate, packetsLost, rtt);
                
                // تنظیم تطبیقی کیفیت
                this.adaptiveQuality(userId, bitrate, packetsLost);
            }
        } catch (error) {
            console.error('خطا در مانیتورینگ کیفیت:', error);
        }
    }
    
    // تنظیم تطبیقی کیفیت
    adaptiveQuality(userId, bitrate, packetsLost) {
        const pc = this.peerConnections[userId];
        if (!pc) return;
        
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (!sender) return;
        
        const parameters = sender.getParameters();
        if (!parameters.encodings) return;
        
        // اگر بیت‌ریت خیلی کم است یا پکت لاس زیاد است
        if (bitrate < 100000 || packetsLost > 10) {
            // کاهش کیفیت
            parameters.encodings[0].scaleResolutionDownBy = 4;
            parameters.encodings[0].maxBitrate = 100000;
        } else if (bitrate > 300000 && packetsLost < 3) {
            // افزایش کیفیت
            parameters.encodings[0].scaleResolutionDownBy = 1;
            parameters.encodings[0].maxBitrate = 400000;
        }
        
        sender.setParameters(parameters).catch(console.error);
    }
    
    // به‌روزرسانی اطلاعات کیفیت
    updateQualityInfo(bitrate, packetsLost, rtt) {
        const qualityElement = document.getElementById('qualityInfo');
        const bandwidthElement = document.getElementById('bandwidthInfo');
        
        if (bitrate > 0) {
            qualityElement.textContent = `کیفیت: ${bitrate > 200000 ? 'خوب' : bitrate > 100000 ? 'متوسط' : 'ضعیف'}`;
            bandwidthElement.textContent = `پهنای باند: ${Math.round(bitrate / 1000)} kbps`;
        }
        
        if (packetsLost > 5) {
            qualityElement.textContent += ' (پکت لاس بالا)';
        }
    }
    
    // ارسال پیام چت
    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.socket.emit('chat-message', { message });
            input.value = '';
            
            // نمایش پیام محلی
            this.displayChatMessage({
                message: message,
                userId: this.userId,
                timestamp: new Date().toISOString(),
                type: 'chat'
            }, true);
        }
    }
    
    // نمایش پیام چت
    displayChatMessage(data, isLocal = false) {
        const chatContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message mb-2 p-2 rounded ' + 
            (isLocal ? 'bg-blue-600 ml-auto' : 'bg-gray-700') + 
            ' max-w-xs';
        
        const time = new Date(data.timestamp).toLocaleTimeString('fa-IR');
        const sender = isLocal ? 'شما' : `کاربر ${data.userId.substring(0, 8)}`;
        
        messageDiv.innerHTML = `
            <div class="text-xs opacity-70">${sender} - ${time}</div>
            <div class="text-sm">${data.message}</div>
        `;
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // به‌روزرسانی وضعیت کاربر
    updateUserStatus(data) {
        const statusElement = document.getElementById(`status-${data.userId}`);
        if (statusElement) {
            let status = '';
            if (data.videoEnabled !== undefined) {
                status += data.videoEnabled ? '📹' : '📹❌';
            }
            if (data.audioEnabled !== undefined) {
                status += data.audioEnabled ? '🎤' : '🎤❌';
            }
            statusElement.textContent = status;
        }
    }
    
    // به‌روزرسانی وضعیت محلی
    updateLocalStatus() {
        const statusElement = document.getElementById('localStatus');
        let status = '';
        status += this.isVideoEnabled ? '📹' : '📹❌';
        status += this.isAudioEnabled ? '🎤' : '🎤❌';
        statusElement.textContent = status;
    }
    
    // تمام صفحه کردن ویدیو
    toggleFullscreen(videoId) {
        const videoContainer = document.getElementById(videoId);
        const video = videoContainer.querySelector('video');
        
        if (!document.fullscreenElement) {
            video.requestFullscreen().catch(err => {
                console.error('خطا در تمام صفحه کردن:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    // تنظیم مجدد چیدمان ویدیو
    adjustVideoLayout() {
        const videoGrid = document.getElementById('videoGrid');
        const videoCount = videoGrid.children.length;
        
        if (videoCount <= 1) {
            videoGrid.className = 'video-grid grid grid-cols-1 gap-4 mb-6';
        } else if (videoCount <= 4) {
            videoGrid.className = 'video-grid grid grid-cols-2 gap-4 mb-6';
        } else {
            videoGrid.className = 'video-grid grid grid-cols-2 md:grid-cols-3 gap-4 mb-6';
        }
    }
    
    // به‌روزرسانی تعداد کاربران
    updateUserCount(count) {
        document.getElementById('userCount').textContent = count;
    }
    
    // گرفتن تعداد کاربران
    getUserCount() {
        return parseInt(document.getElementById('userCount').textContent);
    }
    
    // به‌روزرسانی وضعیت اتصال
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.className = 'connection-status status-' + status;
        
        switch (status) {
            case 'connected':
                statusElement.innerHTML = '<i class="fas fa-circle"></i> متصل';
                break;
            case 'connecting':
                statusElement.innerHTML = '<i class="fas fa-circle"></i> در حال اتصال...';
                break;
            case 'disconnected':
                statusElement.innerHTML = '<i class="fas fa-circle"></i> قطع اتصال';
                break;
        }
    }
    
    // مدیریت قطع اتصال
    handleReconnection() {
        setTimeout(() => {
            if (this.socket && !this.socket.connected) {
                this.socket.connect();
            }
        }, 3000);
    }
    
    // مدیریت تغییر وضعیت اتصال
    handleConnectionStateChange(userId, state) {
        if (state === 'disconnected' || state === 'failed') {
            console.log(`اتصال با کاربر ${userId} قطع شد`);
            // تلاش برای اتصال مجدد
            setTimeout(() => {
                this.createPeerConnection(userId);
                this.createOffer(userId);
            }, 5000);
        }
    }
    
    // پایان تماس
    endCall() {
        // قطع تمام اتصالات
        Object.values(this.peerConnections).forEach(pc => {
            pc.close();
        });
        this.peerConnections = {};
        
        // قطع استریم محلی
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        // قطع اتصال از سرور
        if (this.socket) {
            this.socket.disconnect();
        }
        
        // نمایش صفحه اصلی
        document.getElementById('callSection').classList.add('hidden');
        document.getElementById('startCallSection').classList.remove('hidden');
        
        this.updateConnectionStatus('disconnected');
    }
    
    // نمایش خطا
    showError(message) {
        // ایجاد المان خطا
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-20 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle ml-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // حذف بعد از 5 ثانیه
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// مقداردهی اولیه اپلیکیشن
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new IranVideoCall();
    
    // ذخیره آمار برای مانیتورینگ
    app.lastStats = {};
    
    console.log('اپلیکیشن اتاق ویدیویی ایران آماده است');
});

// مدیریت خطاهای جهانی
window.addEventListener('error', (event) => {
    console.error('خطای جهانی:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejection:', event.reason);
});
