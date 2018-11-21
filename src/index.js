// Vendor JS modules
import "jquery";
import "bootstrap/dist/js/bootstrap";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw";
import { format } from "d3-format";
import ES6Promise from "es6-promise";
import axios from "axios";
import { ckmeans } from "simple-statistics";

// We have to import js-cookies this way because they need better support for
// es6 module import: https://github.com/js-cookie/js-cookie/issues/233
window.Cookies = require("js-cookie");

// custom JS modules
import {
  initializeTutorial,
  initializeTutorialContinued
} from "./modules/tutorial.js";

// Vendor CSS
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "../node_modules/@fortawesome/fontawesome-free/js/all.min.js";

// Custom CSS
import "./style.css";
import "./css/mapbox-custom.css";
import "./css/bootstrap-tooltip-custom.css";

// Promise polyfill for IE 11
// https://stackoverflow.com/questions/42533264/getting-error-promise-is-undefined-in-ie11
ES6Promise.polyfill();

// import favicons for webpack
import "./assets/images/favicon.ico";
import "./assets/images/manifest.json";
function importAll(r) {
  return r.keys().map(r);
}
const favicons = importAll(
  require.context("./assets/images", false, /\.(png|jpe?g|svg)$/)
);

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
      maxZoom: 19,
      pitch: 30
    },
    Draw: "",
    isDrawControlActive: true,
    flow: "",
    mode: "",
    url: "",
    total_trips: "",
    first: true,
    formatPct: format(".1%"),
    formatKs: format(","),
    numClasses: 5
  };

  // Attach public methods like this using object literal notation.
  docklessMap.init = function() {
    console.log("initializing");
    this.$uiMap = $("#map");
    this.$uiOverlayPane = $(".map-overlay-pane");

    initalizeMap();
    runAppCode();
    registerEventHandlers();
    popWelcomeModal();
    initializeTutorial(docklessMap);
  };

  const initalizeMap = () => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoiam9obmNsYXJ5IiwiYSI6ImNqbjhkZ25vcjF2eTMzbG52dGRlbnVqOHAifQ.y1xhnHxbB6KlpQgTp1g1Ow";

    if (!mapboxgl.supported()) {
      alert(
        "This map is designed for modern browsers. Please use a recent version of Firefox, Chrome, Safari, or Edge to view this site."
      );

      $(".map-overlay-pane").html(`
        <div class="alert alert-danger">
          <h4>Incompatible Browser</h4>
          <p>This map is designed for modern browsers. Please use a recent version of Firefox, Chrome, Safari, or Edge to view this site.</p>
        </div>
      `);
    }

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
    $("#map-container").css("height", window.innerHeight);
  };

  // TODO: Break this down into smaller pieces
  const runAppCode = () => {
    // do magic
    docklessMap.map.on("load", function() {
      console.log("do magic");

      initializeDataFilters();

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
        renderCellTripCount(e.features[0]);
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

    function renderCellTripCount(feature, divId = "js-data-pane") {
      const trip_percent =
        feature.properties.trips / docklessMap.total_trips;
      let text;

      if (docklessMap.flow === "origin") {
        text = `${docklessMap.formatKs(
          feature.properties.trips
        )} (${docklessMap.formatPct(
          trip_percent
        )}) trips originated in the clicked cell.`;
      } else if (docklessMap.flow === "destination") {
        text = `${docklessMap.formatKs(
          feature.properties.trips
        )} (${docklessMap.formatPct(
          trip_percent
        )}) trips terminated in the clicked cell.`;
      }

      const html = `
        <div id="js-cell-trip-count" class="d-none d-sm-block alert alert-dark stats" role="alert">
         ${text}
         </div>
      `;

      const htmlMobile = `
        <div id="js-cell-trip-count--mobile" class="d-sm-none alert alert-dark stats trip-alert--mobile" role="alert">
         ${text}
         </div>
      `;

      $("#js-cell-trip-count").remove();
      $("#js-cell-trip-count--mobile").remove();
      $("#js-data-pane").append(html);
      $("#js-trip-stats-container--mobile").append(htmlMobile);
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

    handleMapResizeOnWindowChange();
    handleResetMap();
    handleSelectChanges();
    handleWelcomeModalToggle();
    handleActiveCellHighlight();
  };

  const popWelcomeModal = () => {
    if (!window.Cookies.get("visited")) {
      $("#welcomeModal").modal("show");
    }
    window.Cookies.set("visited", true);
  };

  const getUrl = (features, flow, mode) => {
    const coordinates = features[0].geometry.coordinates.toString();
    const url = `${API_URL}?xy=${coordinates}&flow=${flow}&mode=${mode}`;
    return url;
  };

  const showLoader = (divId = "js-data-pane") => {
    var html = '<p class="loader">Loading...</p>';
    $("#" + divId).append(html);
  };

  const hideLoader = (divId = "js-data-pane") => {
    $(".loader").remove();
  };

  const handleMapResizeOnWindowChange = () => {
    (function($, sr) {
      // debouncing function from John Hann
      // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
      var debounce = function(func, threshold, execAsap) {
        var timeout;

        return function debounced() {
          var obj = this,
            args = arguments;
          function delayed() {
            if (!execAsap) func.apply(obj, args);
            timeout = null;
          }

          if (timeout) clearTimeout(timeout);
          else if (execAsap) func.apply(obj, args);

          timeout = setTimeout(delayed, threshold || 100);
        };
      };
      // smartresize
      jQuery.fn[sr] = function(fn) {
        return fn ? this.bind("resize", debounce(fn)) : this.trigger(sr);
      };
    })(jQuery, "smartresize");

    $(window).smartresize(() => {
      docklessMap.map.resize();
      $("#map-container").css("height", window.innerHeight);
    });
  };

  const initializeDataFilters = () => {
    const $flowSelect = docklessMap.$uiOverlayPane.find(".js-flow-select");
    const $modeSelect = docklessMap.$uiOverlayPane.find(".js-mode-select");

    docklessMap.flow = $flowSelect.find("option:selected").val();
    docklessMap.mode = $modeSelect.find("option:selected").val();
  };

  const handleSelectChanges = () => {
    const $dataSelectForm = docklessMap.$uiOverlayPane.find(
      "#js-data-select-form"
    );

    $dataSelectForm.change(() => {
      const previousFlow = docklessMap.flow;
      const previousMode = docklessMap.mode;

      docklessMap.flow = $dataSelectForm
        .find(".js-flow-select option:selected")
        .val();

      docklessMap.mode = $dataSelectForm
        .find(".js-mode-select option:selected")
        .val();

      closeSlidingPane();

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

  const getData = url => {
    axios
      .get(url)
      .then(response => {
        const { features, intersect_feature, total_trips } = response.data;
        if (docklessMap.isDrawControlActive) {
          // When Mapbox Draw is active, touch events don't propagate so we have
          // to deactivate the controls this way.
          docklessMap.Draw.deleteAll();
          docklessMap.map.removeControl(docklessMap.Draw);
          docklessMap.isDrawControlActive = false;
          $("#js-reset-map").removeClass("d-none");

          // I wish the tutorial module could avoid leaking into this function, but
          // with the Mapbox Draw bug block touch event when active,
          // we have to initialize the second part of the tutorial this way.
          if (!window.Cookies.get("tutorialed")) {
            initializeTutorialContinued(docklessMap);
          }
        }
        docklessMap.total_trips = total_trips;
        addFeatures(features, intersect_feature, total_trips);
      })
      .catch(error => {
        $("#errorModal").modal("show");
        $("#errorModal .modal-body").html(`
          <p>It seems that we're having trouble getting data from our server at this point in time.</p>
          <p>Please refresh this page and try again.</p>
          <p>If the problem persists, please <a href="mailto:ATDDataTechnologyServices@austintexas.gov?subject=Bug Report: Dockless Data Explorer">email us</a> or <a href="https://github.com/cityofaustin/dockless/issues/new">create a new issue</a> on our Github repo.</p>
          <h5>Error Message:</h5><code>${error}</code>
        `);
      });
  };

  const clearMapOnEscEvent = () => {
    $(document).keyup(function(e) {
      if (e.keyCode === 27) {
        clearMap();
      }
    });
  };

  const clearMap = () => {
    const isFeatureLayerActive =
      docklessMap.map.getLayer("feature_layer").visibility === "visible";

    if (isFeatureLayerActive) {
      showLayer("feature_layer", false);
      showLayer("reference_layer", false);
      removeStats();
      docklessMap.map.addControl(docklessMap.Draw, "top-left");
      $("#js-reset-map").addClass("d-none");
      docklessMap.isDrawControlActive = true;
    }
  };

  const handleResetMap = () => {
    $("#js-reset-map").on("click", () => {
      clearMap();
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
    renderTrips(total_trips);
  };

  const removeStats = (selector = "stats") => {
    $("." + selector).remove();
  };

  const addFeatures = (features, reference_features, total_trips) => {
    if (docklessMap.first) {
      docklessMap.map.addSource("features", {
        type: "geojson",
        data: features
      });

      docklessMap.map.addLayer({
        id: "feature_layer",
        type: "fill-extrusion",
        source: "features",
        layout: {},
        paint: {
          "fill-extrusion-color": getPaint(features.features),

          "fill-extrusion-height": [
            "*",
            ["number", ["get", "trips"]],
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

      // highlight layer to activate later
      docklessMap.map.addLayer({
        id: "feature_layer_highlight",
        type: "fill-extrusion",
        source: "features",
        layout: {},
        paint: {
          "fill-extrusion-color": "#756bb1",
          "fill-extrusion-height": [
            "*",
            ["number", ["get", "current_count"]],
            1
          ],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.7
        }
      });

      showLayer("feature_layer", true);
      showLayer("reference_layer", true);
      showLayer("feature_layer_highlight", false);
      hideLoader();
      renderTrips(docklessMap.total_trips);

      docklessMap.first = false;
    } else {
      updateLayers(features, reference_features, docklessMap.total_trips);
    }
  };

  const getPaint = features => {
    if (features.length <= docklessMap.numClasses) {
      // paint everything the same color when there are few features to style
      return "#ffeda0";
    }

    let counts = features.map(f => f.properties.trips);

    if (Math.max(...counts) - Math.min(...counts) < docklessMap.numClasses) {
      // paint everything the same color when the range of trip counts is small
      return "#ffeda0";
    }

    let breaks = jenksBreaks(counts, docklessMap.numClasses);

    // color ramps courtesy of ColorBrewer (http://colorbrewer2.org)
    return [
      "interpolate",
      ["linear"],
      ["number", ["get", "trips"]],
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

  const jenksBreaks = (counts, numClasses) => {
    return ckmeans(counts, numClasses);
  };

  const renderTrips = (total_trips, divId = "js-data-pane") => {
    let text;
    if (docklessMap.flow === "origin") {
      text = `${docklessMap.formatKs(
        total_trips
      )} trips terminated in the selected area.`;
    } else if (docklessMap.flow === "destination") {
      text = `${docklessMap.formatKs(
        total_trips
      )}  trips originated in the selected area.`;
    }

    const html = `
      <div id="js-trip-alert" class="d-none d-sm-block alert alert-primary stats" role="alert">
        ${text}
      </div>`;

    const htmlMobile = `
      <div id="js-trip-alert--mobile" class="d-sm-none alert alert-primary stats trip-alert--mobile" role="alert">
        ${text}
      </div>
    `;

    $("#js-trip-alert").remove();
    $("#js-trip-alert--mobile").remove();
    $("#js-cell-trip-count").remove();
    $(`#${divId}`).append(html);
    $("#js-trip-stats-container--mobile").append(htmlMobile);
  };

  const openSlidingPane = () => {
    $(".js-sliding-pane").removeClass("map-overlay-pane--collapsed");
    $(".js-sliding-pane").addClass("map-overlay-pane--expanded");
  };

  const closeSlidingPane = () => {
    $(".js-sliding-pane").removeClass("map-overlay-pane--expanded");
    $(".js-sliding-pane").addClass("map-overlay-pane--collapsed");
  };

  const handleWelcomeModalToggle = () => {
    $(".js-question-modal").on("click", () => {
      $("#welcomeModal").modal("toggle");
    });
  };

  const handleActiveCellHighlight = () => {
    docklessMap.map.on("click", "feature_layer", e => {
      // Filter features of the highlighted layer down just for the one clicked.
      docklessMap.map.setFilter("feature_layer_highlight", [
        "==",
        "trips",
        // TODO: We need a UID for the cell added as a property on the backend.
        // We're just using trips right now bc its all I have but it results in duplicates.
        e.features[0].properties.trips
      ]);
      showLayer("feature_layer_highlight", true);
    });
  };

  return docklessMap;
})();

ATD_DocklessMap.init();
