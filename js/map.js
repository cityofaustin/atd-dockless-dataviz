var API_URL = 'https://dockless-data.austintexas.io/api'

var formatPct = d3.format(".1%");
var formatKs = d3.format(",");

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
    controls : {
        trash: false,
        line_string : false,
        combine_features: false,
        uncombine_features: false
    }
}

var Draw = new MapboxDraw(drawOptions);

map.addControl(Draw, 'top-left');

// do magic
map.on('load', function() {

    var url;

    mode = $('#modeSelector option:selected').val();

    $('#modeSelector').change(function(){
        var previousMode = mode;

        mode = $('#modeSelector option:selected').val();

        if (map.getLayer('feature_layer')) {
            var visibility = map.getLayoutProperty('feature_layer', 'visibility');    
        
            // if showing feature layer, update layer with new mode
            if (visibility === 'visible') {

                url = url.replace(previousMode, mode)
                showLoader();
                getData(url);
                removeStats();  
            }
        }


    })

    map.on('draw.create', function (e) {
        showLoader();
        url = getUrl(e.features, mode);
        getData(url);
        removeStats();
    });

    map.on('draw.update', function (e) {
        showLoader();
        url = getUrl(e.features, mode);
        getData(url);
        removeStats();
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

    function getUrl(features, mode) {
        var coordinates = features[0].geometry.coordinates.toString();
  
        var url = API_URL + "?xy=" + coordinates + '&mode=' + mode;
        return(url);

    }

});
  

function addFeatures(features, reference_features, total_trips) {
    
    if (first) {
        var breaks = jenksBreaks(features.features);

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
                    ['number', ['get', 'current_count']],
                    breaks[1][0]-1, '#ffffcc',
                    breaks[2][0]-1, '#ffeda0',
                    breaks[3][0]-1, '#fed976',
                    breaks[4][0]-1, '#feb24c',
                    breaks[5][0]-1, '#fd8d3c',
                    breaks[6][0]-1, '#fc4e2a',
                    breaks[7][0]-1, '#e31a1c',
                    breaks[8][0]-1, '#bd0026',
                    breaks[8][0], '#800026',
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
        hideLoader();
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
    showLayer('reference_layer', true);
    hideLoader();
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


function postCellTripCount(feature, divId="dataPane") {

    var trip_percent = feature.properties.current_count / total_trips;
    
    if (mode == 'origin') {
        var text = formatKs(feature.properties.current_count) + " (" + formatPct(trip_percent) + ") trips originated in the clicked cell.";
    } else if (mode == 'destination') {
        var text = formatKs(feature.properties.current_count) + " (" + formatPct(trip_percent) + ") trips terminated in the clicked cell.";
    }

    var html = '<div id="cellTripCount" class="alert alert-dark stats" role="alert">' + text + 
    '</div>';
    
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
        var text = formatKs(total_trips) + ' trips terminated in the selected area.';
    } else if (mode == 'destination') {
        var text = formatKs(total_trips) + ' trips originated in the selected area.';
    }

    var html = '<div id="tripAlert" class="alert alert-primary stats" role="alert">' + text + 
    '</div>';

    $("#tripAlert").remove();
    $("#cellTripCount").remove();
    $('#' + divId).append(html);
}


function removeStats(selector="stats") {
    $('.' + selector).remove()
}

function showLoader(divId="dataPane") {
    var html = '<p class="loader">Loading...</p>';
    $("#" + divId).append(html);
}

function hideLoader(divId="dataPane") {
    $(".loader").remove();
}

function jenksBreaks(features) {
    return ss.ckmeans(features.map(f => f.properties.current_count), 9);
}