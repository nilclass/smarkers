window.onload = function () {
  remoteStorage.defineModule("markers", function(privateClient, publicClient) {

    privateClient.use('');

    return {
      exports: {

        add: function(latlng, note) {
          privateClient.storeObject("marker", Math.uuid() , {latlng:latlng, note:note});
        },
        list: function() {
          return privateClient.getListing("").map(function(id){
            return privateClient.getObject(id);
          });
        },
        clear: function() {
          privateClient.getListing("").forEach( function( item ) {
            privateClient.remove(item);
          })
        },
        on: privateClient.on 
      }
    }

  })

  remoteStorage.onWidget('state', function(state) {
    // alert("state now: " + state);
  });

  remoteStorage.claimAccess("markers","rw");
  remoteStorage.displayWidget("remotestorage-connect");

  remoteStorage.markers.on("change", function(e) {
    if( e.newValue )
      displayMarker(e.newValue);
    
  });

  var map = L.map('myMap').setView([52.4694, 13.31543], 13);
  L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', 
              { attribution: 'Map data',
                maxZoom: 18
              }).addTo(map);
  function onMapClick(e) {
    var note_window = document.getElementById("aNote");
    note_window.style.left  = e.originalEvent.x+"px";
    note_window.style.top  = e.originalEvent.y+"px";
    note_window.style.display = "block"; 
    var btn = note_window.getElementsByClassName('save')[0];
    var input = note_window.getElementsByClassName('text')[0];
    console.log( JSON.stringify([e.latlng.lat, e.latlng.lng]) );
    btn.onclick = function() {
      var note = input.value;
      hideField();
      var marker = {
        latlng:[e.latlng.lat, e.latlng.lng],
        note:note
      };
      saveMarker(marker);

     // displayMarker(marker);
      
    }
  }
  
  function hideField(){
    var note_window = document.getElementById("aNote");
    var input = note_window.getElementsByClassName('text')[0];        
    note_window.style.display = "none";
    input.value = ""; 
  }

  
  function displayMarker(marker) {
    L.marker(marker.latlng)
      .addTo(map)
      .bindPopup(marker.note);
  }

  function saveMarker(marker) {
    remoteStorage.markers.add(marker.latlng,marker.note);
  }


  function loadMarkers() {
    return remoteStorage.markers.list();
  }
  // locations: [1,2,3,4]
  // 1: {..}
  // 2: {..}
  // 3: {..}

  function setMarkers(list){
    list.forEach(displayMarker)
  }
  
  map.on('click', onMapClick);
  setMarkers(loadMarkers());
}

