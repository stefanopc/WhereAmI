/* Registrazione video con MediaRecorder per upload su YouTube */

var mediaRecorder;
var recordedBlobs;

var gumVideo = document.querySelector('video#gum');
var recordedVideo = document.querySelector('video#recorded');
var recordButton = document.querySelector('button#recordVideo');
var playButton = document.querySelector('button#playVideo');
var downloadButton = document.querySelector('button#downloadVideo');

recordButton.onclick = toggleRecording;
playButton.onclick = play;

var constraints = { //vincoli registrazione audio e video
  audio: true,
  video: true
};

//chiede all'utente il permesso di registrazione audio/video
navigator.mediaDevices.getUserMedia(
  constraints
).then(
  successCallback,
  errorCallback
);

//se l'utente concede autorizzazione
function successCallback(stream) {
  console.log('stream getUserMedia(): ', stream); //stream MediaStream
  window.stream = stream;
  gumVideo.srcObject = stream; //restituisce l'oggetto gumVideo che serve per lo stream
}

//se l'utente non concede autorizzazione
function errorCallback(error) { 
  console.log('Errore getUserMedia(): ', error);
}

//quando vengono creati nuovi dati stream
function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) { //se sono stati creati i dati
    recordedBlobs.push(event.data); //li inserisce nei blob registrati
  }
}

//gestisce stop recorder
function handleStop(event) {
  console.log('Registrazione fermata: ', event);
}

//gestione bottoni registrazione
function toggleRecording() {
  if (recordButton.textContent === 'Start Rec') {
    if($("#name").val().trim().length == 0) { //titolo non può essere vuoto
        alert('Inserire titolo audio');
        return;
      }
    startRecording(); //inizia registrazione
  } else {
    stopRecording(); //ferma registrazione
    $("button#recordVideo").hide();
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
}

//inizio registrazione
function startRecording() {
  var options = {mimeType: 'video/webm;codecs=vp9', bitsPerSecond: 100000};
  recordedBlobs = [];
  try {
    mediaRecorder = new MediaRecorder(window.stream, options); //crea oggetto MediaRecorder
  } catch (e0) {
    console.log('Impossibile creare oggetto MediaRecorder con queste opzioni: ', options, e0);
    try {
      options = {mimeType: 'video/webm;codecs=vp8', bitsPerSecond: 100000};
      mediaRecorder = new MediaRecorder(window.stream, options); //crea oggetto MediaRecorder
    } catch (e1) {
      console.log('Impossibile creare oggetto MediaRecorder con queste opzioni: ', options, e1);
      try {
        options = 'video/mp4';
        mediaRecorder = new MediaRecorder(window.stream, options);
      } catch (e2) {
        alert('MediaRecorder non è supportato da questo browser');
        console.error('Eccezione sollevata durante la creazione di Mediarecorder: ', e2);
        return;
      }
    }
  }
  console.log('Creato MediaRecorder', mediaRecorder, 'con opzioni', options);
  recordButton.textContent = 'Stop Rec';
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); //crea vari blob di media ognuno di durata 10ms
  console.log('MediaRecorder iniziato', mediaRecorder);
}

//stop registrazione
function stopRecording() {
  mediaRecorder.stop();
  console.log('Blob registrati: ', recordedBlobs);
  recordedVideo.controls = true;
  download();
}

//play registrazione
function play() {
  var superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  recordedVideo.src = window.URL.createObjectURL(superBuffer); //crea un url per il blob e permette play video
}

//crea il link e permette di scaricarlo
function download() {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
  var url = window.URL.createObjectURL(blob); //crea url per il blob nella forma:
                                              //https://site181949.tw.cs.unibo.it/xxxxxxxx-xxxx

  //cliccando sul bottone di download si scarica il video in formato .webm
  $("button#downloadVideo").click(function() {
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'video.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
    }, 100);
  });

console.log(blob);

var metadata = createMetadata(); //crea metadati da associare alla clip

$("#upRec").append( //bottone per caricamento su YouTube
  `<div class="col text-center"><button id="upload" class="btn btn-primary" type="button">Carica</button></div>
  `);

$("#upload").click(function(){
  uploadClipOnYoutube(blob, metadata); //chiama la funzione per l'upload su YT
});
}

//Creazione metadata associati alla clip, nella forma:
//geoloc:purpose:language:content[:A+audience][:P+detail]
function createMetadata(){
  //Recupera metadata
  var geoloc = OpenLocationCode.encode(selLoc.getLatLng().lat, selLoc.getLatLng().lng, OpenLocationCode.CODE_PRECISION_EXTRA);
  console.log(geoloc);
  var purpose = $("#purpose").val();
  var language = $("#language").val();
  var content = $("#content").val();
  var audience = 'A+';
  audience += $("#audience").val();
  var detail = 'P+';
  detail += $("#detailLevel").val();
  var description =  $("#description").val();
  var name = $("#name").val();

  //definisce metadata
  var metadata = {
    kind: 'youtube#video',
    snippet: {
      title: name + ":8FPHF8VV+M59", //crea titolo con olc per identificare clip
      description: [[geoloc, purpose, language, content, audience, detail].join(':'),description].join('#'),
      categoryId: 27 //categoria 'Istruzione'

    },
    status: {
      privacyStatus: 'public', //video pubblico
      embeddable: true
    }
};

return metadata;
}


//Caricamento del video su YouTube
function uploadClipOnYoutube(video, metadata) {
  var auth = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token; //access token che permette accesso
  console.log(auth);
  var meta = new Blob([JSON.stringify(metadata)], { type: 'application/json' }); //crea un blob con json metadata
  var form = new FormData(); //crea un FormData con metadati e video
  form.append('data', meta);
  form.append('video', video);

  console.log(metadata);
  console.log(video);

  //post
  $.ajax({
    url: 'https://www.googleapis.com/upload/youtube/v3/videos?access_token='
    + encodeURIComponent(auth) + '&part=snippet,status', //codifica l'uri dell'autenticazione Google
    data: form, //dati da inviare
    cache: false, //forza il browser a ricaricare ogni volta i dati del server anche se non sono cambiati
    contentType: false, //non aggiunge un Content-Type (usiamo FormData -> false)
    processData: false, //i dati sono inviati direttamente (usiamo FormData -> false)
    method: 'POST',
    success: () => { alert('Il video è stato caricato con successo!'),
                    location.reload();
                   },
    error: (err) => alert('Errore')
  });
};


