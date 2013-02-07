(function() {

  var TILE_URL = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png';

  var gEl = document.getElementById.bind(document);
  var cEl = document.createElement.bind(document);

  var collectionSelect;
  var collectionForm;

  var currentCollection;

  var map;

  function addCollectionOption(name, selected) {
    var option = cEl('option');
    option.value = name;
    option.innerHTML = name;
    collectionSelect.appendChild(option);
    if(selected) {
      collectionSelect.value = name;
    }
  }

  function removeCollectionOption(name) {
    var options = Array.prototype.slice.call(collectionSelect.children);
    options.forEach(function(option) {
      if(option.value === name) {
        collectionSelect.removeChild(option);
      }
    });
  }

  var markers = [];

  function clearMarkers() {
    while(markers.length > 0) {
      var marker = markers.shift();
      map.removeLayer(marker);
    }
  }

  function displayFeature(feature) {
    var text = feature.properties.title + '\n\n' + feature.properties.description;
    var coords = feature.geometry.coordinates.reverse();
    markers.push(L.marker(coords).addTo(map).bindPopup(text));
  }

  function setupCollectionSelect() {
    collectionSelect = gEl('collection-select');

    var removeButton = gEl('remove-collection');

    remoteStorage.locations.on('add-collection', function(event) {
      console.log('add-collection', event);
      addCollectionOption(event.newValue.name);
    });

    remoteStorage.locations.on('remove-collection', function(event) {
      console.log('remove-collection', event);
      removeCollectionOption(event.oldValue.name);
    });

    collectionSelect.addEventListener('change', function() {
      if(collectionSelect.value) {
        remoteStorage.locations.getCollection(collectionSelect.value).
          then(function(collection) {
            currentCollection = collection;
            clearMarkers();
            return collection.getFeatures();
          }).
          then(function(features) {
            features.forEach(displayFeature);
          });
        removeButton.removeAttribute('disabled');
      } else {
        removeButton.setAttribute('disabled', 'disabled');
      }
    });

    removeButton.addEventListener('click', function() {
      var name = collectionSelect.value;
      if(name) {
        remoteStorage.locations.removeCollection(name).
          then(function() {
            removeCollectionOption(name);
          });
      }
    });
  }

  function setupCollectionForm() {
    collectionForm = gEl('collection-form');

    var addLink = gEl('add-collection');

    function resetForm() {
      collectionForm.name.value = '';
      collectionForm.name.removeAttribute('disabled');
      collectionForm.submit.removeAttribute('disabled');
      addLink.style.display = 'block';
      collectionForm.style.display = 'none';
    }

    addLink.addEventListener('click', function() {
      addLink.style.display = 'none';
      collectionForm.style.display = 'block';
    });

    collectionForm.cancel.addEventListener('click', function(event) {
      event.preventDefault();
      resetForm();
    });

    collectionForm.addEventListener('submit', function(event) {
      event.preventDefault();
      collectionForm.name.setAttribute('disabled', 'disabled');
      collectionForm.submit.setAttribute('disabled', 'disabled');
      var name = collectionForm.name.value;
      remoteStorage.locations.addCollection(name).
        then(function() {
          addCollectionOption(name, true);
          resetForm();
        });
    });
  }

  function hideField() {
    var note_window = document.getElementById("aNote");
    var input = note_window.getElementsByClassName('text')[0];        
    note_window.style.display = "none";
    input.value = ""; 
  }

  var markerCoordinates;

  function onMapClick(e) {
    var note_window = document.getElementById("aNote");
    note_window.style.left  = e.originalEvent.pageX+"px";
    note_window.style.top  = e.originalEvent.pageY+"px";
    note_window.style.display = "block"; 
    markerCoordinates = [e.latlng.lng, e.latlng.lat];
  }

  function setupMap() {
    // init map
    map = L.map('myMap')
    // add tile layer
    L.tileLayer(TILE_URL, {
      attribution: 'Map data',
      maxZoom: 18
    }).addTo(map);

    map.on('click', onMapClick);

    var note_window = document.getElementById("aNote");
    note_window.addEventListener('submit', function(event) {
      event.preventDefault();
      if(! currentCollection) {
        alert("You need to select a collection first");
        return;
      }
      hideField();
      currentCollection.addFeature({
        id: Math.uuid(),
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: markerCoordinates
        },
        properties: {
          title: note_window.title.value,
          description: note_window.description.value
        }
      }).
        then(displayFeature);
    });
    note_window.cancel.addEventListener('click', hideField);

    // go somewhere
    map.setView([52.4694, 13.31543], 5);

    // check if geolocation API is supported
    if('geolocation' in navigator) {
      // acquire current position
      navigator.geolocation.getCurrentPosition(function(position) {
        map.setView([position.coords.latitude, position.coords.longitude], 13);
      });
    }
  }

  window.addEventListener('load', function() {

    remoteStorage.claimAccess('locations', 'rw').
      then(function() {
        remoteStorage.locations.init();
        remoteStorage.onWidget('ready', function() {
          document.getElementById('disconnected').style.display = 'none';
          document.getElementById('connected').style.display = 'block';
        });
        remoteStorage.onWidget('disconnect', function() {
          resetMarkers();
          document.getElementById('disconnected').style.display = 'block';
          document.getElementById('connected').style.display = 'none';
        });
        remoteStorage.displayWidget();
      });

    setupMap();
    setupCollectionSelect();
    setupCollectionForm();

  });

})();

// window.onload = function () {
//   remoteStorage.defineModule("markers", function(privateClient, publicClient) {

//     privateClient.use('');

//     return {
//       exports: {

//         add: function(latlng, note) {
//           privateClient.storeObject("marker", Math.uuid() , {latlng:latlng, note:note});
//         },
//         list: function() {
//           return privateClient.getListing("").map(function(id){
//             return privateClient.getObject(id);
//           });
//         },
//         clear: function() {
//           privateClient.getListing("").forEach( function( item ) {
//             privateClient.remove(item);
//           })
//         },
//         on: privateClient.on 
//       }
//     }

//   })

//   remoteStorage.onWidget('state', function(state) {
//     // alert("state now: " + state);
//   });

//   remoteStorage.claimAccess("markers","rw");
//   remoteStorage.displayWidget("remotestorage-connect");

//   remoteStorage.markers.on("change", function(e) {
//     if( e.newValue )
//       displayMarker(e.newValue);
    
//   });

//   var map = L.map('myMap').setView([52.4694, 13.31543], 13);
//   L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', 
//               { attribution: 'Map data',
//                 maxZoom: 18
//               }).addTo(map);

//   function onMapClick(e) {
//     var note_window = document.getElementById("aNote");
//     note_window.style.left  = e.originalEvent.x+"px";
//     note_window.style.top  = e.originalEvent.y+"px";
//     note_window.style.display = "block"; 
//     var btn = note_window.getElementsByClassName('save')[0];
//     var input = note_window.getElementsByClassName('text')[0];
//     console.log( JSON.stringify([e.latlng.lat, e.latlng.lng]) );
//     btn.onclick = function() {
//       var note = input.value;
//       hideField();
//       var marker = {
//         latlng:[e.latlng.lat, e.latlng.lng],
//         note:note
//       };
//       saveMarker(marker);

//      // displayMarker(marker);
      
//     }
//   }

//   function hideField() {
//     var note_window = document.getElementById("aNote");
//     var input = note_window.getElementsByClassName('text')[0];        
//     note_window.style.display = "none";
//     input.value = ""; 
//   }
  
//   function displayMarker(marker) {
//     L.marker(marker.latlng)
//       .addTo(map)
//       .bindPopup(marker.note);
//   }

//   function saveMarker(marker) {
//     remoteStorage.markers.add(marker.latlng,marker.note);
//   }


//   function loadMarkers() {
//     return remoteStorage.markers.list();
//   }
//   // locations: [1,2,3,4]
//   // 1: {..}
//   // 2: {..}
//   // 3: {..}

//   function setMarkers(list){
//     list.forEach(displayMarker)
//   }

//   document.getElementById('cancel').addEventListener('click', hideField);
  
//   map.on('click', onMapClick);
//   setMarkers(loadMarkers());
// }

