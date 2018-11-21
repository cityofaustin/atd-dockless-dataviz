import mapboxgl from "mapbox-gl";

// We have to import js-cookies this way because they need better support for
// es6 module import: https://github.com/js-cookie/js-cookie/issues/233
window.Cookies = require("js-cookie");

import { setTooltip, showTooltip } from "./tooltip_utils.js";

window.ATD_TUTORIAL = {};

export function initializeTutorial(mapObject) {
  if (!window.Cookies.get("tutorialed")) {
    setTutorialStep1();
    setTutorialStep2(mapObject);
  }
}

export function initializeTutorialContinued(mapObject) {
  window.ATD_TUTORIAL.popupStep2.remove();

  setTutorialStep3(mapObject);
  setTutorialStep4();
}

function setTutorialStep1() {
  setTooltip(
    ".mapbox-gl-draw_point",
    "right",
    "Step 1: Click here to select a point. Or click above to start drawing a bounding box"
  );
  showTooltip(".mapbox-gl-draw_point");
}

function setTutorialStep2(mapObject) {
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

function setTutorialStep3(mapObject) {
  const UTEXAS_LATLONG = [-97.734785, 30.284145];
  window.ATD_TUTORIAL.popupStep3 = new mapboxgl.Popup()
    .setLngLat(UTEXAS_LATLONG)
    .setText(
      "Step 3: Click any hexagon cell to see counts and percentages of trip to/from that point or box."
    )
    .addTo(mapObject.map);
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
