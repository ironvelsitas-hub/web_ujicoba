// Zoom Meeting System
let localStream = null;
let peerConnection = null;
let currentRoom = null;
let currentUser = null;
let chatWebSocket = null;

// Load zoom rooms for students
async function loadZoomRooms() {
    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();
        const now = new Date();
        
        const activeRooms = rooms.filter(room => {
            const roomDate = new Date(`${room.date}T${room.startTime}`);
            return room.isActive && roomDate > now;
        });
        
        const grid = document.getElementById('zoomRoomsGrid');
        if (!grid) return;
        
        if (activeRooms.length === 0) {
            grid.innerHTML = '<div class="empty-state">Tidak ada zoom meeting aktif saat ini</div>';
            return;
        }
        
        grid.innerHTML = activeRooms.map(room => `
            <div class="zoom-room-card" onclick="showJoinModal('${room.roomId}')">
                <h3>${escapeHtml(room.title)}</h3>
                <p>${escapeHtml(room.description || '')}</p>
                <div class="room-code">Kode: ${room.roomId}</div>
                <div class="room-time">📅 ${room.date} | ⏰ ${room.startTime} - ${room.endTime}</div>
                <div class="room-mapel">📖 ${room.mapel || 'Umum'}</div>
                <div class="room-participants">👥 ${room.participants?.length || 0} peserta</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading zoom rooms:', error);
    }
}

// Show join modal
function showJoinModal(roomId) {
    const modal = document.getElementById('joinZoomModal');
    document.getElementById('roomCode').value = roomId;
    modal.style.display = 'flex';
}

function closeJoinZoomModal() {
    document.getElementById('joinZoomModal').style.display = 'none';
}

// Join room
async function joinRoom() {
    const roomCode = document.getElementById('roomCode').value.toUpperCase();
    const participantName = document.getElementById('participantName').value;
    
    if (!roomCode || !participantName) {
        alert('Masukkan kode room dan nama Anda!');
        return;
    }
    
    try {
        const response = await fetch(`/api/rooms/join/${roomCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: participantName })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert(data.error || 'Gagal bergabung ke room');
            return;
        }
        
        currentRoom = data.room;
        currentUser = participantName;
        
        closeJoinZoomModal();
        startZoomMeeting(currentRoom);
        
    } catch (error) {
        console.error('Error joining room:', error);
        alert('Gagal bergabung ke room');
    }
}

// Start Zoom meeting (WebRTC)
async function startZoomMeeting(room) {
    const modal = document.getElementById('zoomModal');
    const zoomBody = document.getElementById('zoomBody');
    
    zoomBody.innerHTML = `
        <div id="zoomVideoContainer">
            <div class="video-container">
                <div class="local-video" id="localVideo">
                    <video id="localVideoElement" autoplay muted playsinline></video>
                    <div class="video-label">${escapeHtml(currentUser)}</div>
                </div>
                <div class="remote-videos" id="remoteVideos"></div>
            </div>
            <div class="zoom-controls">
                <button onclick="toggleMute()" id="muteBtn" class="zoom-control">🎤 Mute</button>
                <button onclick="toggleVideo()" id="videoBtn" class="zoom-control">📹 Stop Video</button>
                <button onclick="shareScreen()" class="zoom-control">🖥️ Share Screen</button>
                <button onclick="leaveZoomRoom()" class="zoom-control leave">🚪 Leave</button>
            </div>
            <div class="zoom-chat" id="zoomChat">
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input">
                    <input type="text" id="chatInput" placeholder="Ketik pesan...">
                    <button onclick="sendChatMessage()">Kirim</button>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Initialize WebRTC
    await initWebRTC();
}

// Initialize WebRTC
async function initWebRTC() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const localVideo = document.getElementById('localVideoElement');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        // Setup signaling (simple peer connection simulation)
        setupSignaling();
        
    } catch (error) {
        console.error('Error accessing media devices:', error);
        alert('Tidak dapat mengakses kamera/mikrofon. Pastikan Anda sudah memberikan izin.');
    }
}

function setupSignaling() {
    // Simulasi koneksi peer-to-peer
    // Dalam implementasi nyata, Anda perlu signaling server (Socket.io)
    console.log('Signaling setup for room:', currentRoom?.roomId);
}

function toggleMute() {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            const muteBtn = document.getElementById('muteBtn');
            muteBtn.innerHTML = audioTrack.enabled ? '🎤 Mute' : '🔇 Unmute';
        }
    }
}

function toggleVideo() {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            const videoBtn = document.getElementById('videoBtn');
            videoBtn.innerHTML = videoTrack.enabled ? '📹 Stop Video' : '📹 Start Video';
        }
    }
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const localVideo = document.getElementById('localVideoElement');
        if (localVideo) {
            localVideo.srcObject = screenStream;
        }
        
        screenStream.getVideoTracks()[0].onended = () => {
            if (localStream) {
                localVideo.srcObject = localStream;
            }
        };
    } catch (error) {
        console.error('Error sharing screen:', error);
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(currentUser, message);
    input.value = '';
    
    // Simulate sending to others (in real implementation, broadcast via signaling)
}

function addChatMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <span class="sender">${escapeHtml(sender)}:</span>
        <span class="message">${escapeHtml(message)}</span>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function leaveZoomRoom() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    document.getElementById('zoomModal').style.display = 'none';
    alert('Anda telah meninggalkan zoom meeting');
}

// Load zoom rooms for admin
async function loadZoomRoomsAdmin() {
    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();
        
        const listContainer = document.getElementById('zoomRoomsList');
        if (!listContainer) return;
        
        if (rooms.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center;">Belum ada room zoom yang dibuat</p>';
            return;
        }
        
        listContainer.innerHTML = rooms.map(room => `
            <div class="zoom-room-item">
                <div>
                    <strong>${escapeHtml(room.title)}</strong><br>
                    <small>📅 ${room.date} | ⏰ ${room.startTime} - ${room.endTime}</small><br>
                    <small>🔑 Kode: <strong>${room.roomId}</strong></small><br>
                    <small>👥 Peserta: ${room.participants?.length || 0}</small>
                </div>
                <button class="delete-btn" onclick="deleteZoomRoom(${room.id})">Hapus</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// Create zoom room
document.getElementById('zoomForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomData = {
        title: document.getElementById('meetingTitle').value,
        description: document.getElementById('meetingDesc').value,
        date: document.getElementById('meetingDate').value,
        startTime: document.getElementById('meetingStart').value,
        endTime: document.getElementById('meetingEnd').value,
        mapel: document.getElementById('meetingMapel').value,
        createdBy: localStorage.getItem('guruUsername') || 'Admin'
    };
    
    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`✅ Room Zoom berhasil dibuat!\nKode Room: ${data.room.roomId}`);
            document.getElementById('zoomForm').reset();
            loadZoomRoomsAdmin();
            loadZoomRooms();
        } else {
            alert('❌ Gagal membuat room');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Gagal membuat room');
    }
});

async function deleteZoomRoom(id) {
    if (confirm('Yakin ingin menghapus room zoom ini?')) {
        try {
            await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
            loadZoomRoomsAdmin();
            loadZoomRooms();
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

function closeZoomModal() {
    leaveZoomRoom();
}