const socket = io.connect('https://testapp2701.herokuapp.com/');
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
        video.remove()
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
        const video = document.getElementById('video');
        call.on('close', () => {
            video.remove();
            videoGrid.remove();
        })
    })
}