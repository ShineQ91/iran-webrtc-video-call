const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// تنظیمات CORS برای پشتیبانی از همه دامنه‌ها
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// استفاده از middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// مسیر اصلی برای سرویس فایل index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// اتاق ثابت "ایران"
const IRAN_ROOM = 'iran';

// ذخیره اطلاعات کاربران متصل
const users = new Map();

// مدیریت اتصالات Socket.IO
io.on('connection', (socket) => {
  console.log(`کاربر جدید متصل شد: ${socket.id}`);

  // کاربر به اتاق ایران ملحق می‌شود
  socket.join(IRAN_ROOM);
  
  // اطلاع‌رسانی به کاربران موجود
  socket.to(IRAN_ROOM).emit('user-joined', {
    userId: socket.id,
    timestamp: new Date().toISOString()
  });

  // ارسال لیست کاربران موجود به کاربر جدید
  const existingUsers = Array.from(io.sockets.adapter.rooms.get(IRAN_ROOM) || [])
    .filter(id => id !== socket.id);
  
  socket.emit('users-list', existingUsers);

  // مدیریت سیگنالینگ WebRTC
  socket.on('offer', (data) => {
    console.log(`Offer از ${socket.id} به ${data.targetUserId}`);
    io.to(data.targetUserId).emit('offer', {
      offer: data.offer,
      fromUserId: socket.id
    });
  });

  socket.on('answer', (data) => {
    console.log(`Answer از ${socket.id} به ${data.targetUserId}`);
    io.to(data.targetUserId).emit('answer', {
      answer: data.answer,
      fromUserId: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    console.log(`ICE Candidate از ${socket.id} به ${data.targetUserId}`);
    io.to(data.targetUserId).emit('ice-candidate', {
      candidate: data.candidate,
      fromUserId: socket.id
    });
  });

  // مدیریت چت متنی
  socket.on('chat-message', (data) => {
    const messageData = {
      message: data.message,
      userId: socket.id,
      timestamp: new Date().toISOString(),
      type: 'chat'
    };
    
    // ارسال پیام به همه کاربران در اتاق ایران
    io.to(IRAN_ROOM).emit('chat-message', messageData);
    console.log(`پیام چت از ${socket.id}: ${data.message}`);
  });

  // مدیریت تغییر وضعیت میکروفون/دوربین
  socket.on('user-status', (data) => {
    const statusData = {
      userId: socket.id,
      ...data,
      timestamp: new Date().toISOString()
    };
    
    socket.to(IRAN_ROOM).emit('user-status', statusData);
  });

  // مدیریت قطع ارتباط کاربر
  socket.on('disconnect', () => {
    console.log(`کاربر قطع شد: ${socket.id}`);
    
    // اطلاع‌رسانی به کاربران دیگر
    socket.to(IRAN_ROOM).emit('user-left', {
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // حذف کاربر از لیست
    users.delete(socket.id);
  });

  // مدیریت درخواست اتصال مجدد
  socket.on('reconnect-request', () => {
    const currentUsers = Array.from(io.sockets.adapter.rooms.get(IRAN_ROOM) || [])
      .filter(id => id !== socket.id);
    
    socket.emit('users-list', currentUsers);
    socket.emit('reconnect-success');
  });
});

// نمایش وضعیت سرور
setInterval(() => {
  const roomSize = io.sockets.adapter.rooms.get(IRAN_ROOM)?.size || 0;
  console.log(`اتاق ایران: ${roomSize} کاربر آنلاین`);
}, 30000);

// شروع سرور
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`سرور WebRTC ایران روی پورت ${PORT} اجرا شد`);
  console.log(`اتاق عمومی "ایران" آماده استفاده است`);
});
