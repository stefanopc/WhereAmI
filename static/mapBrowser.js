/* Gestione mappa browser */

const TOKEN_LEAFLET = 'pk.eyJ1Ijoic3RlZmFub3BjIiwiYSI6ImNrMXNidXNubTBkYWgzcG51eDZobHdwdzEifQ.hzuL-gYifU8cgnLhJfkuaQ';
const COORD_GPS = [44.493712, 11.343078];
const API_KEY = "AIzaSyCrDe_ydySvtkuEE9cf-0Y0S3BoSPrWoqQ";
const API_KEY2 = "AIzaSyCoBAIETc5gwyjyfdkkMlTNf7g6rzdhljE";

//Icona blu per luoghi
var blueIcon = L.icon({
    iconUrl: '/marker-icon-blue.png',
    iconSize: [25, 40],
    iconAnchor: [12, 40],
    popupAnchor: [1, -35],
}),

//Posizione attuale di colore rosso
redIcon = L.icon({
    iconUrl: '/marker-icon-red.png',
    iconSize: [25, 40],
    iconAnchor: [12, 40],
    popupAnchor: [1, -35],
});

//var mappa
var currPos; //posizione corrente (marker rosso)

//var clip YouTube
var clipID = []; //vettore contenente le clip
var metaClip = {}; //metadata clip

$(document).ready(function(){
  setUpMap(COORD_GPS); //inizializzazione mappa con coordinate iniziali
  showPlaces(); //mostra luoghi clip
});


//Inizializza mappa
function setUpMap(coordinates) {
    map = L.map('map').setView(coordinates, 15);

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
    //Richiesta gps
    geolocation();
};


//Aggiorna mappa con posizione corrente
function showPositionMap(coordinates){
    if(currPos)
        currPos.remove();
    map.setView(coordinates, 15);

    //Imposta il marker sulla posizione corrente
    currPos = L.marker(coordinates, {draggable:'true'}); //il marker si può spostare
    currPos.setIcon(redIcon);
    //Aggiunge popup al marker
    currPos.bindPopup(
        `<div style="text-align: center;">
        <h6 class="text-uppercase" style="margin-top: 2%;"> Where I Am </h6>
        <hr align="center"> Trascinami per impostare la posizione attuale
        </div>`).openPopup();
    //Aggiunge il marker alla mappa
    currPos.addTo(map);
};

//Localizzazione gps
function geolocation() {
    //se la geolocalizzazione è attiva
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition( //richiesta asincrona che calcola pos attuale utente
        //Se l'utente ha permesso la geolocalizzazione
        pos => showPositionMap([pos.coords.latitude, pos.coords.longitude]),
        //Se l'utente ha rifiutato la geolocalizzazione
         showPositionMap(COORD_GPS));
    } else { //se la geolocalizzazione non è attiva
         showPositionMap(COORD_GPS);
  }
};

//Filtraggio clip
function filtra(){
    clipID.forEach(function(item) {
        if ((metaClip[item].purpose != $("#purpose").val() || metaClip[item].language != $("#language").val()
            || metaClip[item].audience != $("#audience").val() || metaClip[item].category != $("#content").val()
            || metaClip[item].detail != $("#detailLevel").val()))
              $("#"+item+"card").hide();
        else
            $("#"+item+"card").show();
    });
};

//Rimuove i filtri e mostra tutte le clip
function reset(){
    clipID.forEach(function(item) {
            $("#"+item+"card").show();
    });

    //reimposta i valori dei filtri di default
    $("#purpose option, #language option, #audience option, #content option, #detailLevel option").prop('selected', function() {
        return this.defaultSelected;
    });
};

/* https://www.liedman.net/leaflet-routing-machine/api/#l-routing-control */
//Routing
var routingControl = null; //per leaflet routing machine

function routing(){ //leaflet routing machine API
    if (routingControl != null) { //rimuove routing precedente
        map.removeControl(routingControl);
        routingControl = null;
    }

    coordWaypoint = this.getLatLng(); //coordinate del luogo
    let options = {profile: 'mapbox/walking', language: 'it'}

    routingControl = L.Routing.control({
        waypoints: [currPos.getLatLng(),coordWaypoint],
        showAlternatives: 'false',
        router: new L.Routing.mapbox(TOKEN_LEAFLET, options)
    }).addTo(map);
};


//Mostra sulla mappa i marker relativi ai luoghi delle clip utilizzando YT API
function showPlaces(){
    gapi.client.setApiKey(API_KEY);
    clipID = []; //vettore clip
    gapi.client.load("youtube","v3", function () {
        console.log("YT API Ready");
        var results = gapi.client.youtube.search.list({
            part:"id,snippet",
            /* id ha i campi kind(youtube#video) e videoId
    snippet ha title (titolo:geoloc) e description (geoloc:purpose:language:content:A+audience:P+detail#descrizione) */
            maxResults: 50,
            order: "title",
            q: "8FPHF8VV+M59",
            type: "video"
        });
        results.execute(function(response) {
            console.log(response);
            var arrayClip = response.result.items;

            for(var i=0; i<arrayClip.length; i++){
                var videoID=arrayClip[i].id.videoId;
                var nextID;
                //video successivo
                if(i != (arrayClip.length -1)){ 
                    nextID = arrayClip[i+1].id.videoId;
                }

                clipID.push(videoID); //inserisco i video ID nel vettore clipID

                //dettagli video
                let name = arrayClip[i].snippet.title.split(":")[0]; //prende la parte prima dei : nel titolo
                let metadati = arrayClip[i].snippet.description.split("#")[0]; //prende la parte prima di # nella descrizione
                let description = arrayClip[i].snippet.description.split("#")[1];
                let olc = metadati.split(":")[0];
                let purpose = metadati.split(":")[1];
                let language = metadati.split(":")[2];
                let category = metadati.split(":")[3];
                let audience = metadati.split(":")[4];
                audience = audience.substring(2, audience.length); //rimuove A+
                var detail = metadati.split(":")[5];
                detail = detail.substring(2, detail.length); //rimuove P+
                let coords = OpenLocationCode.decode(olc);  //traduce l'olc in coordinate
                //metadati clip
                let meta = {"purpose": purpose, "language": language, "category": category, "audience": audience, "detail":detail};
                metaClip[videoID] = meta;

                let popup = //popup quando si clicca sul marker
                `<div id="${videoID}popup" style="text-align: center;">
                    <h4 style="margin-top: 2%;">${name}</h4>
                    <a id="${videoID}link" class="btn" href="#${videoID}card">Vai alla clip!</a>
                </div>`;

                //associa ad ogni luogo un marker con id e al click mostra la navigazione
                var m = new L.marker([coords.latitudeCenter, coords.longitudeCenter], {myCustomId: videoID+"map"} )
                .bindPopup(popup).addTo(map).on('click', routing);

                //Carico l'IFrame Player API
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/player_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                    $("#clips").append(`
                        <article id="${videoID}card" style="margin: 2%; width: 96%">
                          <div class="card text-center" style="margin: 2%; width: 96%">
                            <div class="row">
                              <div class="col-6">
                                <div class="card-header text-left" style="background-color: white">
                                <span class="space">
                                  <a id="${videoID}map" href="#map"><i class="fa fa-location-arrow" style="font-size: 20px" id="download-icon"></i></a>
                                  </span>
                                  <h4 id="heading-card" style="font-size: 25px;">${name}</h4>
                                </div>
                              </div>
                              <div class="col-6">
                                <div class="text-right" style="margin-top: 2%; margin-right:5%">
                                <button id="${videoID}" class="${videoID} btn">
                                  <i class="fa fa-play" style="font-size: 24px;"></i>
                                  </button>
                                <button class="pause btn">
                                  <i class="fa fa-pause" style="font-size: 24px;"></i>
                                </button>
                                <button id="${nextID}" class="${nextID} next btn">
                                  <i class="fa fa-forward" id="next" style="font-size: 24px;"></i>
                                </button>
                               </div>
                              </div>
                            </div>
                           <div class="card-body">
                              <ul class="list-group">
                                <div class="row">
                                  <div class="col-sm-6">
                                    <li class="list-group-item"><span><i><b>Purpose:&nbsp</b></i> ${purpose}</span></li>
                                    <li class="list-group-item"><span><i><b>Language:&nbsp</b></i> ${language}</span></li>
                                 </div>
                              <div class="col-sm-6">
                                <li class="list-group-item"><span><i><b>Category:&nbsp</b></i> ${category}</span></li>
                                <li class="list-group-item"><span><i><b>Audience:&nbsp</b></i> ${audience}</span></li>
                              </div>
                            </div>
                            <li class="list-group-item text-left" style="height: 3rem;overflow: auto;"><span><i><b>Description:&nbsp</b></i> ${description} </span></li>
                            </ul>
                          </div>
                        </div>
                        <script>

                        $("#${videoID}map").click(function(){ //click luogo sulla mappa
                            $.each(map._layers, function(i, item){
                                if(this.options.myCustomId == "${videoID}map"){
                                    this.openPopup();
                                    map.flyTo(this._latlng); //animazione che porta alla mappa
                                }
                            });
                        });


                        $(".${videoID}").click(function(){ //click bottone play
                             var idVideo = this.className.split(" ")[0];
                             player.clearVideo();
                             player.loadVideoById(idVideo);
                             player.playVideo();
                        });

                        $(".pause").click(function(){
                            player.pauseVideo();
                        });

                    </script>
                    </article>
                    `);
          }//chiude for
        });
    });
}




