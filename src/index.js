// import _ from "lodash"; // not using this right now but maybe we will
import $ from "jQuery";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw";
import { format } from "d3-format";
import { json } from "d3-fetch";
import { ckmeans } from "simple-statistics";

import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./style.css";

// Locally Scoped Object Module Pattern
// more info: https://toddmotto.com/mastering-the-module-pattern/#locally-scoped-object-literal
const ATD_DocklessMap = (function() {
  // Let this object be place to store app level state variables and the placeholder to attach public methods.
  let docklessMap = {
    map: "",
    mapOptions: {
      container: "map",
      style: "mapbox://styles/mapbox/light-v9",
      center: [-97.74, 30.275],
      zoom: 13,
      minZoom: 1,
      maxZoom: 19
    },
    Draw: "",
    flow: "",
    mode: "",
    url: "",
    API_URL: "http://localhost:8000/v1/trips",
    total_trips: "",
    first: true,
    formatPct: format(".1%"),
    formatKs: format(",")
  };

  // Attach public methods like this using object literal notation.
  docklessMap.init = function() {
    console.log("initializing");
    this.$uiMap = $("#map");
    this.$uiOverlayPane = $(".map-overlay-pane");

    setHeight("#map-container");
    initalizeMap();
    runAppCode();
    registerEventHandlers();
  };

  const initalizeMap = () => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoiam9obmNsYXJ5IiwiYSI6ImNqbjhkZ25vcjF2eTMzbG52dGRlbnVqOHAifQ.y1xhnHxbB6KlpQgTp1g1Ow";
    docklessMap.map = new mapboxgl.Map(docklessMap.mapOptions);

    // add nav
    var nav = new mapboxgl.NavigationControl();
    docklessMap.map.addControl(nav, "top-left");

    // add drawing
    var drawOptions = {
      controls: {
        trash: false,
        line_string: false,
        combine_features: false,
        uncombine_features: false
      }
    };
    docklessMap.Draw = new MapboxDraw(drawOptions);
    docklessMap.map.addControl(docklessMap.Draw, "top-left");
  };

  const handleSelectChanges = () => {
    const $dataSelectForm = docklessMap.$uiOverlayPane.find(
      "#data-select-form"
    );

    $dataSelectForm.change(function() {
      const previousFlow = docklessMap.flow;
      const previousMode = docklessMap.mode;

      docklessMap.flow = $dataSelectForm
        .find("#flow-select option:selected")
        .val();

      docklessMap.mode = $dataSelectForm
        .find("#mode-select option:selected")
        .val();

      if (docklessMap.map.getLayer("feature_layer")) {
        let visibility = docklessMap.map.getLayoutProperty(
          "feature_layer",
          "visibility"
        );

        // if showing feature layer, update layer with new flow & mode
        if (visibility === "visible") {
          docklessMap.url = docklessMap.url.replace(
            previousFlow,
            docklessMap.flow
          );
          docklessMap.url = docklessMap.url.replace(
            previousMode,
            docklessMap.mode
          );
          console.log(docklessMap.url);
          showLoader();
          getData(docklessMap.url);
          removeStats();
        }
      }
    });
  };

  // TODO: Break this down into smaller pieces
  const runAppCode = () => {
    // do magic
    docklessMap.map.on("load", function() {
      console.log("do magic");

      initializeDataFilters();
      handleSelectChanges();

      docklessMap.map.on("draw.create", function(e) {
        showLoader();
        docklessMap.url = getUrl(
          e.features,
          docklessMap.flow,
          docklessMap.mode
        );
        console.log(docklessMap.url);
        getData(docklessMap.url);
        removeStats();
      });

      docklessMap.map.on("draw.update", function(e) {
        showLoader();
        docklessMap.url = getUrl(
          e.features,
          docklessMap.flow,
          docklessMap.mode
        );
        getData(docklessMap.url);
        removeStats();
      });

      docklessMap.map.on("click", "feature_layer", function(e) {
        postCellTripCount(e.features[0]);
      });

      // Change the cursor to a pointer when the mouse is over the states layer.
      docklessMap.map.on("mouseenter", "feature_layer", function() {
        docklessMap.map.getCanvas().style.cursor = "pointer";
      });

      // Change it back to a pointer when it leaves.
      docklessMap.map.on("mouseleave", "feature_layer", function() {
        docklessMap.map.getCanvas().style.cursor = "";
      });
    });

    function postCellTripCount(feature, divId = "dataPane") {
      var trip_percent =
        feature.properties.current_count / docklessMap.total_trips;

      if (docklessMap.flow == "origin") {
        var text =
          docklessMap.formatKs(feature.properties.current_count) +
          " (" +
          docklessMap.formatPct(trip_percent) +
          ") trips originated in the clicked cell.";
      } else if (docklessMap.flow == "destination") {
        var text =
          docklessMap.formatKs(feature.properties.current_count) +
          " (" +
          docklessMap.formatPct(trip_percent) +
          ") trips terminated in the clicked cell.";
      }

      var html =
        '<div id="cellTripCount" class="alert alert-dark stats" role="alert">' +
        text +
        "</div>";

      $("#cellTripCount").remove();
      $("#dataPane").append(html);
    }

    const showLayer = (layer_name, show_layer) => {
      if (!show_layer) {
        docklessMap.map.setLayoutProperty(layer_name, "visibility", "none");
      } else {
        docklessMap.map.setLayoutProperty(layer_name, "visibility", "visible");
      }
    };
  };

  // All methods declared with `const`, must be "private" and are scoped
  const registerEventHandlers = () => {
    console.log("registering events");
    clearMapOnEscEvent();

    $(".js-close-pane").on("click", e => {
      closeSlidingPane();
    });

    $(".js-open-pane").on("click", e => {
      openSlidingPane();
    });
  };

  const getUrl = (features, flow, mode) => {
    const coordinates = features[0].geometry.coordinates.toString();
    const url = `${
      docklessMap.API_URL
    }?xy=${coordinates}&flow=${flow}&mode=${mode}`;
    return url;
  };

  const showLoader = (divId = "dataPane") => {
    var html = '<p class="loader">Loading...</p>';
    $("#" + divId).append(html);
  };

  const hideLoader = (divId = "dataPane") => {
    $(".loader").remove();
  };

  const initializeDataFilters = () => {
    const $flowSelect = docklessMap.$uiOverlayPane.find("#flow-select");
    const $modeSelect = docklessMap.$uiOverlayPane.find("#mode-select");

    docklessMap.flow = $flowSelect.find("option:selected").val();
    docklessMap.mode = $modeSelect.find("option:selected").val();
  };

  const getData = url => {
    json(url).then(function(json) {
      docklessMap.Draw.deleteAll();
      docklessMap.total_trips = json.total_trips;
      addFeatures(json.features, json.intersect_feature, json.total_trips);
    });
  };

  const setHeight = selector => {
    var height = $(window).height();
    $(selector).css("height", height);
  };

  const clearMapOnEscEvent = () => {
    $(document).keyup(function(e) {
      if (e.keyCode === 27) {
        showLayer("feature_layer", false);
        showLayer("reference_layer", false);
        removeStats();
      }
    });
  };

  const showLayer = (layer_name, show_layer) => {
    if (!show_layer) {
      docklessMap.map.setLayoutProperty(layer_name, "visibility", "none");
    } else {
      docklessMap.map.setLayoutProperty(layer_name, "visibility", "visible");
    }
  };

  const updateLayers = (features, reference_features, total_trips) => {
    docklessMap.map.getSource("reference_layer").setData(reference_features);
    docklessMap.map.getSource("feature_layer").setData(features);
    docklessMap.map.setPaintProperty(
      "feature_layer",
      "fill-extrusion-color",
      getPaint(features.features)
    );
    showLayer("feature_layer", true);
    showLayer("reference_layer", true);
    hideLoader();
    postTrips(total_trips);
  };

  const removeStats = (selector = "stats") => {
    $("." + selector).remove();
  };

  const addFeatures = (features, reference_features, total_trips) => {
    if (docklessMap.first) {
      docklessMap.map.addLayer({
        id: "feature_layer",
        type: "fill-extrusion",
        source: {
          type: "geojson",
          data: features
        },
        layout: {},
        paint: {
          "fill-extrusion-color": getPaint(features.features),

          "fill-extrusion-height": [
            "*",
            ["number", ["get", "current_count"]],
            1
          ],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.7
        }
      });

      docklessMap.map.addLayer({
        id: "reference_layer",
        type: "line",
        source: {
          type: "geojson",
          data: reference_features
        },
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": "#000",
          "line-opacity": 0.4,
          "line-width": 3,
          "line-dasharray": [3, 3]
        }
      });

      showLayer("feature_layer", true);
      showLayer("reference_layer", true);
      hideLoader();
      postTrips(docklessMap.total_trips);
      docklessMap.first = false;
    } else {
      updateLayers(features, reference_features, docklessMap.total_trips);
    }
  };

  const getPaint = features => {
    let breaks = jenksBreaks(features);

    return [
      "interpolate",
      ["linear"],
      ["number", ["get", "current_count"]],
      breaks[0][0] - 1,
      "#ffeda0",
      breaks[1][0] - 1,
      "#fed976",
      breaks[2][0] - 1,
      "#fd8d3c",
      breaks[3][0] - 1,
      "#e31a1c",
      breaks[4][0],
      "#800026"
    ];
  };

  const jenksBreaks = features => {
    return ckmeans(features.map(f => f.properties.current_count), 5);
  };

  const postTrips = (total_trips, divId = "dataPane") => {
    if (docklessMap.flow == "origin") {
      var text =
        docklessMap.formatKs(total_trips) +
        " trips terminated in the selected area.";
    } else if (docklessMap.flow == "destination") {
      var text =
        docklessMap.formatKs(total_trips) +
        " trips originated in the selected area.";
    }

    var html =
      '<div id="tripAlert" class="alert alert-primary stats" role="alert">' +
      text +
      "</div>";

    $("#tripAlert").remove();
    $("#cellTripCount").remove();
    $("#" + divId).append(html);
  };

  const openSlidingPane = () => {
    $(".js-sliding-pane").removeClass("map-overlay-pane--collapsed");
    $(".js-sliding-pane").addClass("map-overlay-pane--expanded");
  };

  const closeSlidingPane = () => {
    $(".js-sliding-pane").removeClass("map-overlay-pane--expanded");
    $(".js-sliding-pane").addClass("map-overlay-pane--collapsed");
  };

  return docklessMap;
})();

ATD_DocklessMap.init();
