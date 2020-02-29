/* Gestione mappa editor */

const TOKEN_LEAFLET = 'pk.eyJ1Ijoic3RlZmFub3BjIiwiYSI6ImNrMXNidXNubTBkYWgzcG51eDZobHdwdzEifQ.hzuL-gYifU8cgnLhJfkuaQ'; //s
const COORD_GPS = [44.493712, 11.343078];
const API_KEY = "AIzaSyCrDe_ydySvtkuEE9cf-0Y0S3BoSPrWoqQ";
const API_KEY2 = "AIzaSyCoBAIETc5gwyjyfdkkMlTNf7g6rzdhljE";


var blueIcon = L.icon({
  iconUrl: '/marker-icon-blue.png',
  iconSize: [25, 40],
  iconAnchor: [12, 40],
  popupAnchor: [1, -35],
}),
redIcon = L.icon({
  iconUrl: '/marker-icon-red.png',
  iconSize: [25, 40],
  iconAnchor: [12, 40],
  popupAnchor: [1, -35],
});

var map; 
var selLoc; //punto selezionato
var currPos; //posizione corrente (marker rosso)


$(document).ready(function(){
  setUpMap(COORD_GPS); //inizializzazione mappa
  showPlaces(); //mostra marker luoghi clip
  handleClientLoad(); //gestione login Google
  insertClip(); //gestione inserimento clip tramite form
});


//Inizializza mappa con API Leaflet
function setUpMap(coordinates) {
  map = L.map('map').setView(coordinates, 14);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + TOKEN_LEAFLET, {
    maxZoom: 22,
    id: 'mapbox/streets-v11',
    accessToken: TOKEN_LEAFLET
}).addTo(map);

  var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider(); //geocoding per ricerca

  L.esri.Geocoding.geosearch({ //ricerca tramite bottone
    providers: [
      arcgisOnline,
      L.esri.Geocoding.mapServiceProvider({
      label: 'States and Counties',
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
      layers: [2, 3],
      searchFields: ['NAME', 'STATE_NAME']
    })
  ]
}).addTo(map);

    geolocation(); //richiesta gps
    map.on('click', handleMapClick); //gestione eventi
  }

  //Aggiorna mappa con posizioen corrente
  function showPositionMap(coordinates) {
    if(currPos)
        currPos.remove();
    map.setView(coordinates,14);
    //Imposta posizione corrente del marker
    currPos = L.marker(coordinates, {draggable:'true'}); //il marker si può spostare
    currPos.setIcon(redIcon);
    //Aggiunge popup al marker
    currPos.bindPopup('Where I Am').openPopup();
      //Aggiunge marker alla mappa
      currPos.addTo(map);
      //Gestione eventi
      currPos.on('click', handleMarkerClick);

    };

  //Localizzazione gps
  function geolocation(){
    //se la geolocalizzazione è attiva
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
            //Se l'utente ha permesso la geolocalizzazione
            pos => showPositionMap([pos.coords.latitude, pos.coords.longitude]),
            //Se l'ha rifiutata
            showPositionMap(COORD_GPS));
    } //se la geolocalizzazione non è attiva
    else  showPositionMap(COORD_GPS);
  }


//Ricerca video su youtube e mostra marker se trovati
function showPlaces() {
  gapi.client.setApiKey(API_KEY);
  //ricerca video tramite Youtube API
  gapi.client.load("youtube", "v3", function() {
    console.log("YT API ready");
    var results = gapi.client.youtube.search.list({
      part: "snippet",
      type: "video",
      q: ":8FPHF8VV+M59",
      maxResults: 50,
      order: "title"
    });
    results.execute(function(response) {
        console.log(response);
        var arrayClip = response.result.items;
        for(var i=0; i<arrayClip.length; i++){
            //dettagli video
            let title = arrayClip[i].snippet.title.split(":")[0];
            let olc = arrayClip[i].snippet.description.split("#")[0].split(":")[0];
            let coords = OpenLocationCode.decode(olc);
                //aggiunge marker con coordinate luogo e associa titolo
                var m = new L.marker([coords.latitudeCenter, coords.longitudeCenter])
                .bindPopup(title)
                .addTo(map);

                //Gestione eventi
                m.on('click', handleMarkerClick);
              } //chiude for
            });
          });
      }

var markerPos = L.marker(); //marker click mappa

//Gestione evento click mappa
function handleMapClick(e) {
  if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
    console.log("Google login required");
  } else {
       markerPos.setIcon(blueIcon)
        .setLatLng(e.latlng)
        .bindPopup('Registra una clip su questo luogo!').openPopup()
        .addTo(map);
        selLoc = markerPos;
        //mostra form
        insertClip();
    }
};

//Gestore evento click su marker esistente
function handleMarkerClick(marker) {
    if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
    console.log("Google login required");
    } else {
      markerPos.remove(); //rimuove marker precedente
      if(selLoc)
        selLoc.setIcon(marker.target.getIcon());
      selLoc = marker.target; //ritorna il marker

      //aggiorna nome campo
      $("#name").val(selLoc.getPopup().getContent());
      insertClip(); //mostra form per inserimento clip
    }
}


//Permette inserimento clip mostrando/nascondendo form
function insertClip() {
  if (selLoc) {
    $('#data').show();
    $('#msgLogin').hide();
  }
  else {
    $('#data').hide();
  }
}


