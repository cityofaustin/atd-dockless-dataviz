// todo
// deploy api
// highlight source cells

var API_URL = 'http://localhost:5000/api'

var formatPct = d3.format(".1%");

var total_trips;
var query_layer;
var od_layer;
var data;
var first = true;

$(document).keyup(function(e) {
  if (e.keyCode === 27) {
    showLayer('feature_layer', false);
    removeQueryLayer();
    removeStats();
  }
});


mapboxgl.accessToken = 'pk.eyJ1Ijoiam9obmNsYXJ5IiwiYSI6ImNqbjhkZ25vcjF2eTMzbG52dGRlbnVqOHAifQ.y1xhnHxbB6KlpQgTp1g1Ow';

var mapOptions = {
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center : [-97.74, 30.275],
    zoom : 13,
    minZoom : 1,
    maxZoom : 19
};

var drawOptions = {
    controls : {line_string : false, combine_features: false, uncombine_features: false}
}

var map = new mapboxgl.Map(mapOptions);

var nav = new mapboxgl.NavigationControl();

map.addControl(nav, 'top-left');

var Draw = new MapboxDraw(drawOptions);

map.addControl(Draw, 'top-left');

map.on('load', function() {

    var mode = $('#modeSelector option:selected').val();

    $('#modeSelector').change(function(){
        mode = $('#modeSelector option:selected').val();
    })

    map.on('draw.create', function (e) {
        updateQueryLayers(e);
        var url = getUrl(e, mode);
        getData(url);
    });

    map.on('draw.update', function (e) {
        var url = getUrl(e, mode);
        getData(url);
    });

    map.on('click', 'feature_layer', function (e) {
        postCellTripCount(e.features[0])
    });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', 'feature_layer', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'feature_layer', function () {
        map.getCanvas().style.cursor = '';
    });

    function getUrl(e, mode) {
        var coordinates = e.features[0].geometry.coordinates.toString();
  
        url = API_URL + "?xy=" + coordinates + '&mode=' + mode;
        return(url);

    }

});
  

function addFeatures(features, total_trips) {

    if (first) {

        // Insert the layer beneath any symbol layer.
        var layers = map.getStyle().layers;

        var labelLayerId;
        for (var i = 0; i < layers.length; i++) {
            if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
            }
        }

        map.addLayer({
            'id' : 'feature_layer',
            'type': 'fill-extrusion',
            'source': {
                'type' : 'geojson',
                'data' : features
            },
            'layout': {},
            'paint': {
                'fill-extrusion-color':[
                    'interpolate',
                    ['linear'],
                    ['/', ['number', ['get', 'current_count']], total_trips],
                    0, "#fed976",
                    .01, "#feb24c",
                    .04, "#fd8d3c",
                    .07, "#f03b20",
                    .1, "#bd0026",
                ],
                // use an 'interpolate' expression to add a smooth transition effect to the
                // buildings as the user zooms in
                'fill-extrusion-height': [
                    '*', ['number', ['get', 'current_count']], 2
                ],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': .6
            } 

        });
        showLayer('feature_layer', true);
        postTrips(total_trips);
        first = false;
    } else {
        // map.removeLayer('feature_layer');
        updateLayer(features);
    }

}   




function updateLayer(features) {
    map.getSource('feature_layer').setData(features);
    map.setPaintProperty('feature_layer', 'fill-extrusion-color', getPaint(total_trips));
    showLayer('feature_layer', true);
    postTrips(total_trips);
}

function updateQueryLayers(e) {
      // get bounds and send to grid api
    if (!e) {
        Draw.delete(query_layer);
    } else if (query_layer) {
        Draw.delete(query_layer);
        query_layer = e.features[0].id;
    } else {
        query_layer = e.features[0].id;
    }
}

function getData(url) {
    d3.json(url, {
        headers : {
            "Access-Control-Allow-Origin" : 'http://localhost:5000'
        }
    }).then(function(json){
        total_trips = json.total_trips;
        addFeatures(json.features, json.total_trips);
    });
}


function postCellTripCount(feature) {

    var trip_percent = feature.properties.current_count / total_trips;
    var html = "<p id=cellTripCount >Clicked cell contains " + feature.properties.current_count + " (" + formatPct(trip_percent) + ") trips.<p>";
    $('#cellTripCount').remove();
    $('#dataPane').append(html);
}

function removeQueryLayer() {
    // delete the drawn feature
    updateQueryLayers(null);
}

function showLayer(layer_name, show_layer) {

    if (!show_layer) {
        map.setLayoutProperty(layer_name, 'visibility', 'none');
        this.className = '';
    } else {
        this.className = 'active';
        map.setLayoutProperty(layer_name, 'visibility', 'visible');
    }
}


function getPaint(total_trips) {
    return [
        'interpolate',
        ['linear'],
        ['/', ['number', ['get', 'current_count']], total_trips],
        0, "#fed976",
        .01, "#feb24c",
        .04, "#fd8d3c",
        .07, "#f03b20",
        .1, "#bd0026",
    ]
}

function postTrips(total_trips, divId="dataPane") {

    $('#dataPane').html('<h4>Total Trips: ' + total_trips + '</h4>');

}


function removeStats(divId="dataPane") {
    $('#dataPane').html('');
}