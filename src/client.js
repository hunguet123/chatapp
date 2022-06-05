const socket = io.connect('https://testapp2701.herokuapp.com/');
//const socket = io.connect('http://localhost:3030/');
let user_id;
let room_id;
let user_name;


let myWindow;

function openWindow(id) {
    myWindow = window.open("/chat/box/video-call/" + id, "", "width=1000,height=1000");
}

function closeWindow() {
   myWindow = window.close();
}

function initConversation(sender_id, conv_id, sender_name){
   room_id = conv_id;
   user_id = sender_id;
   user_name = sender_name;
   socket.emit('setRoom', conv_id, sender_id);
};

socket.on('userExists', function(data){
   document.getElementById('error-container').innerHTML = data;
});
async function sendMessage(){
   let msg = document.getElementById('message').value;
   if(msg){
     await socket.emit('msg', {message: msg, user: user_name,userId: user_id, room_id,});
   }
}
socket.on('newmsg', function(data){
   if(user_id){
      document.getElementById('message-container').innerHTML +='<div><b>' + data.user + '</b> : ' + data.message + ' (new) </div>'
   }
})


//video call
const videoGrid = document.getElementById('video-partner')

const myPeer = new Peer(undefined, {})
const myVideo = document.createElement('video')
myVideo.muted = true

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })
    socket.on('user-disconnected', userId => {
        console.log(userId)
    })
})

myPeer.on('open', id => {
    socket.emit('setRoom', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove();
        videoGrid.remove();
    })
}


function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}

function disconnect() {
    socket.on('user-disconnected', userId => {
        const call = myPeer.call(userId, stream);
        //const video = document.getElementById('video');
        call.on('close', () => {
            //video.remove();
            videoGrid.remove();
            myVideo.remove();
        })
    })
}

