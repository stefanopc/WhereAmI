const CLIENT_ID = "612334816706-kgsnjbmuttrd4v3b7frvasq6kjunpkfs.apps.googleusercontent.com";
const CLIENT_ID2 = "928285210754-fgco71d2d90kp6mmo0lj9q1r5741a0fn.apps.googleusercontent.com";
API_KEY = "AIzaSyCrDe_ydySvtkuEE9cf-0Y0S3BoSPrWoqQ";

/*
Gestione login Google
https://developers.google.com/people/quickstart/js
*/

//Effettua il login dell'utente tramite click
  function handleAuthClick(){
    gapi.auth2.getAuthInstance().signIn(); //restituisce l'oggetto GoogleAuth e una promise soddisfatta se l'utente accede correttamente
    console.log(gapi.auth2.getAuthInstance().signIn());
  }

//Al caricamento, chiamata per caricare la libreria auth2
  function handleClientLoad() {
    gapi.load('client:auth2', initClient);
  }

//Inizializza l'API client e imposta lo stato di login
  function initClient(callback) {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
      cookiepolicy: 'single_host_origin',
      scope: 'https://www.googleapis.com/auth/youtube'
    }).then(() => {
      //cambio di stato login
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
      console.log(gapi.auth2.getAuthInstance().isSignedIn.get());
      //gestisce stato iniziale login
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get()); //gestisce stato di signin
    })
    .catch(err => console.log(JSON.stringify(err)));
  }

//Chiamata quando cambia lo stato di signin
  function updateSigninStatus(status) {
    if (status) {
      console.log('Signed in');
    } else {
      console.log("Google login required");
   }
 };

  //Gestisce logout Google
  function handleSignout() {
    if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut();
        auth2.disconnect();
        alert("Disconnesso");

        $('#data').hide();
        $('#msgLogin').show();
      };
  }
