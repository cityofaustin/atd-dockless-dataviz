import mapboxgl from "mapbox-gl";
window.Cookies = require("js-cookie");

import {
  setTooltip,
  showTooltip,
  initializeAllTooltips
} from "./tooltip_utils.js";

const UTEXAS_LATLONG = [-97.734785, 30.284145];
export function initializeTutorial(mapObject) {
  debugger;
  if (!window.Cookies.get("tutorialed")) {
    setTutorialStep1();
    setTutorialStep2(mapObject);
  }
}

export function initializeTutorialContinued(mapObject) {
  window.ATD_TUTORIAL.popupStep2.remove();
  window.ATD_TUTORIAL.popupStep3 = new mapboxgl.Popup()
    .setLngLat(UTEXAS_LATLONG)
    .setText(
      "Step 3: Click any hexagon cell to see counts and percentages of trip to/from that point or box."
    )
    .addTo(mapObject.map);
  $("#map-container").off("click.step3");

  setTutorialStep4();
}

export function initializeTutorial(mapObject) {
  if (document.cookie.indexOf("turtorialed=true") == -1) {
    setTutorialStep1();
    setEventTriggerStep2(mapObject);
    // initializeAllTooltips();
  }
}

function setTutorialStep1() {
  window.ATD_TUTORIAL = {};
  setTooltip(
    ".mapbox-gl-draw_point",
    "right",
    "Step 1: Click here to select a point. Or click above to start drawing a bounding box"
  );
  showTooltip(".mapbox-gl-draw_point");
}

function setEventTriggerStep2(mapObject) {
  const MAP_CENTER = mapObject.mapOptions.center;

  $(".mapbox-gl-draw_point").on("click.tutorial", () => {
    $(".mapbox-gl-draw_point").tooltip("hide");

    window.ATD_TUTORIAL.popupStep2 = new mapboxgl.Popup()
      .setLngLat(MAP_CENTER)
      .setText(
        "Step 2: Click any spot on the map to see where dockless trips started/ended."
      )
      .addTo(mapObject.map);
  });
}

function setTutorialStep4() {
  $("#map-container").on("click.step4", () => {
    window.ATD_TUTORIAL.popupStep3.remove();

    setTooltip(
      ".js-open-pane",
      "bottom",
      "Step 4: Adjust data settings like origin vs. destination (flow) and scooter vs. bicycle (mode)."
    );
    showTooltip(".js-open-pane");

    $("#map-container").off("click.step4");

    $(".js-open-pane").on("click.settingsClose", () => {
      $(".js-open-pane").tooltip("hide");
      $(".js-open-pane").off("click.settingsClose");
    });
  });

  window.Cookies.set("tutorialed", true);
}
