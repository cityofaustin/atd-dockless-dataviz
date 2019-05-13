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
const BOOTSTRAP_SM_BREAKPOINT = 575;

// custom JS modules
import {
  initializeTutorial,
  initializeTutorialContinued
} from "./modules/tutorial.js";
import { numberWithCommas } from "./modules/numberWithCommas";
import {
  initializeDatepicker,
  convertDateFieldInputToUnixTime
} from "./modules/datepicker";

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
      pitch: 15
    },
    Draw: "",
    isDrawControlActive: true,
    flow: "",
    mode: "",
    startTime: null,
    endTime: null,
    url: "",
    total_trips: "",
    first: true,
    formatPct: format(".1%"),
    formatKs: format(","),
    numClasses: 5,
    colorClassArray: [
      // color ramps courtesy of ColorBrewer (http://colorbrewer2.org)
      "#ffeda0",
      "#fed976",
      "#fd8d3c",
      "#e31a1c",
      "#60001d"
    ]
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
    initializeDatepicker(docklessMap);
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
    if (window.innerWidth < BOOTSTRAP_SM_BREAKPOINT) {
      $("#map-container").css("height", window.innerHeight);
    }
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
          docklessMap.mode,
          docklessMap.startTime,
          docklessMap.endTime
        );
        // console.log(docklessMap.url);
        getData(docklessMap.url);
        removeStats();
      });

      docklessMap.map.on("draw.update", function(e) {
        showLoader();
        docklessMap.url = getUrl(
          e.features,
          docklessMap.flow,
          docklessMap.mode,
          docklessMap.startTime,
          docklessMap.endTime
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
      const trip_percent = feature.properties.trips / docklessMap.total_trips;
      let text;

      if (docklessMap.flow === "origin") {
        text = `${docklessMap.formatKs(
          feature.properties.trips
        )} (${docklessMap.formatPct(
          trip_percent
        )}) trips started in the selected cell.`;
      } else if (docklessMap.flow === "destination") {
        text = `${docklessMap.formatKs(
          feature.properties.trips
        )} (${docklessMap.formatPct(
          trip_percent
        )}) trips ended in the selected cell.`;
      }

      const html = `
        <div id="js-cell-trip-count" class="alert alert-purple col-xs-12 col-md-5 ml-sm-2 js-stats-alert" role="alert">
         ${text}
         </div>
      `;

      $("#js-cell-trip-count").remove();
      $("#js-trip-stats-container").append(html);
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
    handleModeFlowSelectChanges();
    handleDateChange();
    handleWelcomeModalToggle();
    handleActiveCellHighlight();
    handleModalClose();
  };

  const popWelcomeModal = () => {
    if (!window.Cookies.get("visited")) {
      $("#welcomeModal").modal("show");
    }
    window.Cookies.set("visited", true);
  };

  const getUrl = (features, flow, mode, startTime, endTime) => {
    const coordinates = features[0].geometry.coordinates.toString();
    let url = `${API_URL}?xy=${coordinates}&flow=${flow}&mode=${mode}`;

    if (startTime && endTime) {
      url = `${url}&start_time=${startTime}&end_time=${endTime}`;
    }
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

      if (window.innerWidth < BOOTSTRAP_SM_BREAKPOINT) {
        $("#map-container").css("height", window.innerHeight);
      }
    });
  };

  const initializeDataFilters = () => {
    const $flowSelect = docklessMap.$uiOverlayPane.find(".js-flow-select");
    const $modeSelect = docklessMap.$uiOverlayPane.find(".js-mode-select");

    docklessMap.flow = $flowSelect.find("option:selected").val();
    docklessMap.mode = $modeSelect.find("option:selected").val();
  };

  function handleDateChange() {
    $("#js-start-date-select").on("change changeDate", function(e) {
      const date = convertDateFieldInputToUnixTime(e.target.value);
      const previousStartTime = docklessMap.startTime;
      docklessMap.startTime = date;
      updateUrlAndDataForDateRange(previousStartTime, docklessMap.startTime);
      closeSlidingPane();
      $(this).datepicker("hide");
    });

    $("#js-end-date-select").on("change changeDate", function(e) {
      const date = convertDateFieldInputToUnixTime(e.target.value);
      const previousEndTime = docklessMap.endTime;
      docklessMap.endTime = date;
      updateUrlAndDataForDateRange(previousEndTime, docklessMap.endTime);
      closeSlidingPane();
      $(this).datepicker("hide");
    });
  }

  function updateUrlAndDataForDateRange(previousDate, newDate) {
    // if already showing feature layer, update layer with new daterange data
    if (docklessMap.map.getLayer("feature_layer")) {
      let visibility = docklessMap.map.getLayoutProperty(
        "feature_layer",
        "visibility"
      );

      if (visibility === "visible") {
        docklessMap.url = docklessMap.url.replace(previousDate, newDate);
        showLoader();
        getData(docklessMap.url);
        removeStats();
      }
    }
  }

  const handleModeFlowSelectChanges = () => {
    const $form = docklessMap.$uiOverlayPane.find("#js-mode-flow-select-form");

    $form.change(() => {
      const previousFlow = docklessMap.flow;
      const previousMode = docklessMap.mode;

      docklessMap.flow = $form.find(".js-flow-select option:selected").val();
      docklessMap.mode = $form.find(".js-mode-select option:selected").val();

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

        // If there are not enough items in the geo features Array of the response data,
        // stop the process here before other errors occur.
        if (features.features.length < docklessMap.numClasses) {
          $("#errorModal").modal("show");
          $("#errorModal .modal-body").html(`
            <p>There is not enough data available for the area you selected. Try a bigger shape or pick another point on the map.</p>
            <p>If the problem persists there may be an error with our server, please <a href="mailto:ATDDataTechnologyServices@austintexas.gov?subject=Bug Report: Dockless Data Explorer">email us</a> or <a href="https://github.com/cityofaustin/dockless/issues/new">create a new issue</a> on our Github repo.</p>
          `);
          return false;
        }
        if (docklessMap.isDrawControlActive) {
          // When Mapbox Draw is active, touch events don't propagate so we have
          // to deactivate the controls this way.
          docklessMap.Draw.deleteAll();

          // Before we remove the control, make sure there isn't a tutorial
          // tooltip attached.
          $(".mapbox-gl-draw_point").tooltip("hide");

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
        updateLegend(features.features);
      })
      .catch(error => {
        $("#errorModal").modal("show");
        $("#errorModal .modal-body").html(`
          <p>It seems that we're having trouble getting data from our server at this point in time.</p>
          <p>Please refresh this page and try again.</p>
          <p>If the problem persists, please <a href="mailto:ATDDataTechnologyServices@austintexas.gov?subject=Bug Report: Dockless Data Explorer">email us</a> or <a href="https://github.com/cityofaustin/dockless/issues/new">create a new issue</a> on our Github repo.</p>
          <h5>Error Message:</h5><code>${error}</code>
        `);
        throw error;
      });
  };

  const handleModalClose = () => {
    $("#errorModal").on("hide.bs.modal", () => {
      hideLoader();
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
      showLayer("feature_layer_highlight", false);
      removeStats();
      docklessMap.map.addControl(docklessMap.Draw, "top-left");
      $("#js-reset-map").addClass("d-none");
      docklessMap.isDrawControlActive = true;
    }

    // Remove previous legend
    $("#js-legend").empty();
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
    docklessMap.map.getSource("features").setData(features);
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

  const updateLegend = features => {
    const counts = features.map(f => f.properties.trips);
    const breaks = jenksBreaks(counts, docklessMap.numClasses);

    // Reset & remove old legend HTML content
    $("#js-legend").empty();

    // Add legend title
    $("#js-legend").append(
      "<span class='legend-title mb-2'>Number of Trips</span>"
    );

    // Loop over class breaks and add to legend keys
    for (let i = 0; i < breaks.length; i++) {
      let color = docklessMap.colorClassArray[i];
      let itemHtml = document.createElement("div");
      let colorKeyHtml = document.createElement("span");
      let tripsTextHtml = document.createElement("span");
      let text;

      colorKeyHtml.className = "legend-key";
      colorKeyHtml.style.backgroundColor = color;

      if (i < 4) {
        text = `
          ${numberWithCommas(breaks[i][0])} -
          ${numberWithCommas(breaks[i + 1][0] - 1)}
        `;
      } else {
        // Only for the last value use a different text template
        text = `${numberWithCommas(breaks[i][0])}+`;
      }

      tripsTextHtml.innerHTML = text;
      itemHtml.appendChild(colorKeyHtml);
      itemHtml.appendChild(tripsTextHtml);
      $("#js-legend").append(itemHtml);
    }

    // Add height scale note
    $("#js-legend").append(`
      <span class='legend-title mt-2'>Cell Height</span>
      <span>5 trips = 1 meter</span>
    `);
  };

  const removeStats = (selector = "js-stats-alert") => {
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
            ["number", ["get", "count_as_height"]],
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
            ["number", ["get", "count_as_height"]],
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
    const counts = features.map(f => f.properties.trips);
    const breaks = jenksBreaks(counts, docklessMap.numClasses);
    const hasFewerFeaturesThanClasses =
      features.length <= docklessMap.numClasses;
    const hasSmallRangeOfTrips =
      Math.max(...counts) - Math.min(...counts) < docklessMap.numClasses;

    // paint everything the same color when:
    //    - there are few features to style
    //    - the range of trip counts is small
    if (hasFewerFeaturesThanClasses || hasSmallRangeOfTrips) {
      return docklessMap.colorClassArray[0];
    }

    return [
      "interpolate",
      ["linear"],
      ["number", ["get", "trips"]],
      breaks[0][0] - 1,
      docklessMap.colorClassArray[0],
      breaks[1][0] - 1,
      docklessMap.colorClassArray[1],
      breaks[2][0] - 1,
      docklessMap.colorClassArray[2],
      breaks[3][0] - 1,
      docklessMap.colorClassArray[3],
      breaks[4][0],
      docklessMap.colorClassArray[4]
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
      )} trips terminated in the outlined area.`;
    } else if (docklessMap.flow === "destination") {
      text = `${docklessMap.formatKs(
        total_trips
      )}  trips originated in the outlined area.`;
    }

    const html = `
      <div id="js-trip-alert" class="alert alert-primary alert-dashed-border col-xs-12 col-md-5 mr-sm-2 js-stats-alert" role="alert">
        ${text}
      </div>
    `;

    $("#js-trip-alert").remove();
    $("#js-cell-trip-count").remove();
    $("#js-trip-stats-container").append(html);
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
        "cell_id",
        e.features[0].properties.cell_id
      ]);
      showLayer("feature_layer_highlight", true);
    });
  };

  return docklessMap;
})();

ATD_DocklessMap.init();
