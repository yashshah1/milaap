import SimplePeer from 'simple-peer';
import $ from 'jquery';
import socketIOClient from 'socket.io-client';
import { Emitter } from './emmiter';
const socket = socketIOClient.connect('http://localhost:5000'); //will be replaced by an appropriate room.
socket.connect();
socket.on('connect', () => {
  console.log(socket.connected); // true
});

export class Peer extends Emitter {
  constructor(it, stream, room) {
    super();
    this.error = null;
    this.active = false;
    this.stream = null;
    this.room = room;
    this.initiator = it;
    this.peer = new SimplePeer({ initiator: it, stream: stream,
      config: { iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            url: 'turn:numb.viagenie.ca',
            credential: 'HWeF3pu@u2RfeYD',
            username: 'veddandekar6@gmail.com'
          }
        ]
      },
    });

    this.peer.on('error', (err) => {
      this.error = err;
      this.emit('error', err);
      this.close();
      console.log('Error Occured while connecting!', err);
    });

    this.peer.on('close', (_) => {
      this.close();
      console.log('closed');
    });
    console.log('in constructor');
    this.peer.on('signal', (data) => {
      console.log(data);
      var room = this.room;
      socket.emit('signalling', room, data, (resp) => {
        console.log('reply rcvd');
        console.log(data);
      });
      console.log('received signal to be seint');
    });
    this.peer.on('data', (data) => {
      console.log('recvd data from remote peer');
    });
    this.peer.on('connect', (data) => {
      console.log('connected');
    });
    this.peer.on('stream', (data) => {
      console.log('stream received');
      createVideoElement(this, data, 'id', 'test');
    });
    socket.on('signalling', (data) => {
      console.log(data);
      console.log(this.peer);
      console.log(this.peer.initiator);
      if (this.peer && !this.peer.destroyed) {
        console.log('replying');
        this.peer.signal(data);
      }
    });
  }

  close() {
    this.emit('close');
    this.active = false;
    this.peer.destroy();
  }

  startCall() {
    console.log('starting call');
  }
}

export function createVideoElement(self, stream, friendtkn, username) {
  const wrapper = document.createElement('div');
  const video = document.createElement('video');
  const nameTag = document.createElement('div');
  const context = document.getElementById('context');
  nameTag.classList.add('name-label');
  nameTag.innerText = username || 'me';
  video.width = '200';
  video.id = friendtkn;
  if (video.id == 'me') {
    video.muted = 'true';
  }
  video.height = '350';
  video.srcObject = stream;
  video.autoplay = true;
  video.onclick = switchContext;
  wrapper.appendChild(video);
  wrapper.appendChild(nameTag);
  document.getElementById('videos').appendChild(wrapper);
  if (!context.srcObject) switchContext(document.getElementById(friendtkn));
}

export function switchContext(e) {
  if (e.target) e = e.target;
  try {
    const context = document.getElementById('context');
    if (e.srcObject == context.srcObject) return;
    const username = e.nextElementSibling.innerText;
    context.style.display = 'inline';
    context.poster =
      'https://dummyimage.com/1024x576/2f353a/ffffff.jpg&text=' + username;
    context.srcObject = e.srcObject;
    context.play();
    $('#context').removeClass().addClass(e.id);
  } catch (err) {
    console.log('The selected stream is old');
    console.log(err);
  }
}

export async function getMyMediaStream(self, type) {
  if (type === 'screen') {
    // TODO: Add try catch to handle case when user denies access

    await navigator.mediaDevices
      .getDisplayMedia({
        video: { width: 1024, height: 576 },
        audio: true
      })
      .then((media) => {
        self.setState({
          myMediaStreamObj: media
        });
        createVideoElement(self, media, 'me');
        return media;
      });
  } else if (type === 'video') {
    // TODO: Add try catch to handle case when user denies access

    await navigator.mediaDevices
      .getUserMedia({
        video: { width: 1024, height: 576 },
        audio: true
      })
      .then((media) => {
        self.setState({
          myMediaStreamObj: media
        });
        createVideoElement(self, media, 'me');
        return media;
      });
  }
}