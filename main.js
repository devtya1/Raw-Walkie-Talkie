var firebaseConfig = {
    apiKey: "AIzaSyCfIyfq6IDCvgKoZtg2d7B-4-iFBMbxc-s",
    authDomain: "test-database-for-all.firebaseapp.com",
    databaseURL: "https://test-database-for-all-default-rtdb.firebaseio.com",
    projectId: "test-database-for-all",
    storageBucket: "test-database-for-all.appspot.com",
    messagingSenderId: "24401273232",
    appId: "1:24401273232:web:06ff1f75311448641f1315"
  };
  
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

const talkButton = document.getElementById('talkButton');
const stopButton = document.getElementById('stopButton');
let mediaRecorder, audioChunks = [], currentSound;

// Audio Recording Setup
async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
    mediaRecorder.start();
}

talkButton.addEventListener('mousedown', startRecording);

talkButton.addEventListener('mouseup', () => {
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        audioChunks = []; // Clear for next recording
        const audioURL = URL.createObjectURL(audioBlob);

        // Upload audio to Firebase Storage
        const audioRef = storage.ref(`audios/${Date.now()}.mp3`);
        await audioRef.put(audioBlob);
        const audioDownloadURL = await audioRef.getDownloadURL();

        // Save metadata in Firebase Database
        db.ref('walkie-talkie').push({
            url: audioDownloadURL,
            timestamp: Date.now(),
            sender: 'device1' // Assign a unique ID to each device
        });
    };
});

// Listen for Database Updates
db.ref('walkie-talkie').on('child_added', snapshot => {
    const { url, sender } = snapshot.val();
    if (sender !== 'device1') { // Check that sender is not the current device
        playAudio(url);
    }
});

// Play Audio Function
function playAudio(url) {
    if (currentSound) {
        currentSound.pause();
        currentSound.currentTime = 0; // Reset if currently playing
    }
    currentSound = new Audio(url);
    currentSound.play();
}

// Stop audio and reset
stopButton.addEventListener('click', function() {
    if (currentSound) {  // Ensure currentSound is defined
        currentSound.pause();
        currentSound.currentTime = 0; // Reset to the beginning
    }
    clearTimeout(soundTimeout);
});

