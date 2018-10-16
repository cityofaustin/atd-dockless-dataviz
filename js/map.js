// todo
// deploy api
// highlight source cells

var API_URL = 'https://dockless-data.austintexas.io'

var formatPct = d3.format(".1%");

var total_trips;
var data;
var mode;
var first = true;

// clear map on ESC key press
$(document).keyup(function(e) {
  if (e.keyCode === 27) {
    showLayer('feature_layer', false);
    showLayer('reference_layer', false);
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

// init map
var map = new mapboxgl.Map(mapOptions);

// add nav
var nav = new mapboxgl.NavigationControl();

map.addControl(nav, 'top-left');

// add drawing
var drawOptions = {
    controls : {trash: false, line_string : false, combine_features: false, uncombine_features: false}
}

var Draw = new MapboxDraw(drawOptions);

map.addControl(Draw, 'top-left');

// do magic
map.on('load', function() {

    mode = $('#modeSelector option:selected').val();

    $('#modeSelector').change(function(){
        mode = $('#modeSelector option:selected').val();
    })

    map.on('draw.create', function (e) {
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
  

function addFeatures(features, reference_features, total_trips) {

    if (first) {

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

                'fill-extrusion-height': [
                    '*', ['number', ['get', 'current_count']], 2
                ],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': .6
            } 

        });


        map.addLayer({
            'id' : 'reference_layer',
            'type': 'line',
            'source': {
                'type' : 'geojson',
                'data' : reference_features
            },
            'layout': {
                'line-cap' : 'round',
                'line-join' : 'round'
            },
            'paint': {
                'line-color': '#000',
                'line-opacity': 0.4,
                'line-width' : 3,
                'line-dasharray' : [3, 3]
            }

        });

        showLayer('feature_layer', true);
        showLayer('reference_layer', true);

        postTrips(total_trips);
        first = false;
    } else {
        updateLayers(features, reference_features, total_trips);
    }

}   


function updateLayers(features, reference_features, total_trips) {
    map.getSource('reference_layer').setData(reference_features);
    map.getSource('feature_layer').setData(features);
    map.setPaintProperty('feature_layer', 'fill-extrusion-color', getPaint(total_trips));
    showLayer('feature_layer', true);
    showLayer('reference_layer', false);
    postTrips(total_trips);
}


function getData(url) {
    d3.json(url, {
        headers : {
            "Access-Control-Allow-Origin" : 'http://localhost:5000'
        }
    }).then(function(json){
        Draw.deleteAll();
        total_trips = json.total_trips;
        addFeatures(json.features, json.intersect_feature, json.total_trips);
    });
}


function postCellTripCount(feature) {

    var trip_percent = feature.properties.current_count / total_trips;
    if (mode == 'origin') {
        var html = "<p id=cellTripCount >" + feature.properties.current_count + " (" + formatPct(trip_percent) + ") trips originated in the clicked cell.<p>";
    } else if (mode == 'destination') {
        var html = "<p id=cellTripCount >" + feature.properties.current_count + " (" + formatPct(trip_percent) + ") trips terminated in the clicked cell.<p>";
    }

    
    $('#cellTripCount').remove();
    $('#dataPane').append(html);
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
    if (mode == 'origin') {
        var html = '<h5>' + total_trips + ' trips terminated in the selected area.</h5>'
    } else if (mode == 'destination') {
        var html = '<h5>' + total_trips + ' trips originated in the selected area.</h5>'
    }
    $('#dataPane').html(html);
}


function removeStats(divId="dataPane") {
    $('#dataPane').html('');
}