const socket = io();

const authDiv = document.getElementById('auth');
const chatDiv = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const roomNameEl = document.getElementById('roomName');
const msgInput = document.getElementById('msg');
const signupBtn = document.getElementById('signup');
const loginBtn = document.getElementById('loginBtn');
const sendBtn = document.getElementById('send');
const callBtn = document.getElementById('call');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const videoContainer = document.getElementById('videoContainer');
const userList = document.getElementById('userList');

let pc;
let currentRoom;

signupBtn.onclick = () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const name = document.getElementById('name').value.trim();
  if (!email || !password || !name) return;
  socket.emit('signup', { email, password, name }, (res) => {
    if (!res.ok) alert(res.error);
    else alert('Registrazione completata, ora puoi entrare');
  });
};

loginBtn.onclick = () => {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const room = document.getElementById('room').value.trim();
  if (!email || !password || !room) return;
  currentRoom = room;
  socket.emit('login', { email, password, room }, (res) => {
    if (!res.ok) return alert(res.error);
    authDiv.classList.add('hidden');
    chatDiv.classList.remove('hidden');
    roomNameEl.textContent = room;
    res.history.forEach(({ name, msg }) => addMessage(name, msg));
  });
};

sendBtn.onclick = () => {
  const msg = msgInput.value;
  if (msg) {
    const to = userList.value;
    if (to) {
      const name = userList.options[userList.selectedIndex].text;
      addMessage(`Tu -> ${name}`, msg);
      socket.emit('dm', { to, msg });
    } else {
      socket.emit('chat', msg);
    }
    msgInput.value = '';
  }
};

function addMessage(name, msg) {
  const el = document.createElement('div');
  el.textContent = `${name}: ${msg}`;
  messagesDiv.appendChild(el);
}

socket.on('chat', ({ name, msg }) => {
  addMessage(name, msg);
});

socket.on('system', (text) => {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.fontStyle = 'italic';
  messagesDiv.appendChild(el);
});

socket.on('users', (list) => {
  userList.innerHTML = '<option value="">Tutti</option>';
  list.forEach(({ id, name }) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id === socket.id ? `${name} (tu)` : name;
    userList.appendChild(opt);
  });
});

socket.on('dm', ({ from, msg }) => {
  const sender = from.id === socket.id ? 'Tu' : from.name;
  addMessage(`${sender} (privato)`, msg);
});

callBtn.onclick = async () => {
  videoContainer.classList.remove('hidden');
  pc = new RTCPeerConnection();
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice', event.candidate);
    }
  };
  pc.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  localVideo.srcObject = stream;
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('offer', offer);
};

socket.on('offer', async ({ id, sdp }) => {
  videoContainer.classList.remove('hidden');
  pc = new RTCPeerConnection();
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice', event.candidate);
    }
  };
  pc.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  localVideo.srcObject = stream;
  await pc.setRemoteDescription(sdp);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('answer', { to: id, sdp: answer });
});

socket.on('answer', async ({ sdp }) => {
  await pc.setRemoteDescription(sdp);
});

socket.on('ice', async ({ candidate }) => {
  if (pc) {
    try {
      await pc.addIceCandidate(candidate);
    } catch (e) {
      console.error(e);
    }
  }
});
