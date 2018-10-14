// todo
// od-toggle
// smaller grid
// deploy api
// description panel

var API_URL = 'http://localhost:5000/api'

var formatPct = d3.format(".1%");

var total_trips;
var query_layer;
var od_layer;
var data;
var first = true;

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


    map.on('draw.create', function (e) {
        updateQueryLayers(e);
        var url = getUrl(e);
        getData(url);
    });

    map.on('draw.update', function (e) {
        var url = getUrl(e);
        getData(url);
    });

    map.on('click', 'feature_layer', function (e) {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(getPopup(e.features[0]))
            .addTo(map);
    });

    // Change the cursor to a pointer when the mouse is over the states layer.
    map.on('mouseenter', 'feature_layer', function () {
        map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'feature_layer', function () {
        map.getCanvas().style.cursor = '';
    });

    function getUrl(e) {
        var coordinates = e.features[0].geometry.coordinates.toString();
  
        url = API_URL + "?xy=" + coordinates;
        return(url);

    }

});
  

function addFeatures(features, total_trips) {

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
                // use an 'interpolate' expression to add a smooth transition effect to the
                // buildings as the user zooms in
                'fill-extrusion-height': [
                    '*', ['number', ['get', 'current_count']], 10
                ],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': .6
            }

        });

        first = false;
    } else {
        // map.removeLayer('feature_layer');
        updateLayer(features);
    }

}   


function updateLayer(features) {
    map.getSource('feature_layer').setData(features);
    map.setPaintProperty('feature_layer', 'fill-extrusion-color', getPaint(total_trips));
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


function getPopup(feature) {
    var trip_percent = feature.properties.current_count / total_trips;

    return "Trips: " + feature.properties.current_count + " (" + formatPct(trip_percent) + ")";

}
function clearMap() {
    updateQueryLayers(null);
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