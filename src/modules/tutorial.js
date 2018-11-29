import mapboxgl from "mapbox-gl";

// We have to import js-cookies this way because they need better support for
// es6 module import: https://github.com/js-cookie/js-cookie/issues/233
window.Cookies = require("js-cookie");

import { setTooltip, showTooltip } from "./tooltip_utils.js";

window.ATD_TUTORIAL = {};
const BOOTSTRAP_SM_BREAKPOINT = 575;

export function initializeTutorial(mapObject) {
  if (!window.Cookies.get("tutorialed")) {
    setTutorialStep1();
    setTutorialStep2(mapObject);
  }
}

export function initializeTutorialContinued(mapObject) {
  window.ATD_TUTORIAL.popupStep2.remove();

  setTutorialStep3(mapObject);
  setTutorialStep4And5();
}

function setTutorialStep1() {
  setTooltip(".mapbox-gl-draw_point", "right", "Click here to begin");
  showTooltip(".mapbox-gl-draw_point");
}

function setTutorialStep2(mapObject) {
  const MAP_CENTER = mapObject.mapOptions.center;

  $(".mapbox-gl-draw_point").on("click.tutorial", () => {
    $(".mapbox-gl-draw_point").tooltip("hide");

    window.ATD_TUTORIAL.popupStep2 = new mapboxgl.Popup()
      .setLngLat(MAP_CENTER)
      .setText(
        "Click any spot on the map to see where dockless trips started/ended"
      )
      .addTo(mapObject.map);
  });
}

function setTutorialStep3(mapObject) {
  const UTEXAS_LATLONG = [-97.734785, 30.284145];
  window.ATD_TUTORIAL.popupStep3 = new mapboxgl.Popup()
    .setLngLat(UTEXAS_LATLONG)
    .setText(
      "Click a hexagon to view how many trips started/ended at that location"
    )
    .addTo(mapObject.map);
}

function setTutorialStep4And5() {
  $("#map-container").on("click.step4", () => {
    window.ATD_TUTORIAL.popupStep3.remove();

    // Tilt doesn't really work on mobile so we need to skip this step on small
    // devices.
    if (window.innerWidth < BOOTSTRAP_SM_BREAKPOINT) {
      runTutorialStep5(".mapboxgl-ctrl-compass-arrow");
    } else {
      setTooltip(
        ".mapboxgl-ctrl-compass-arrow",
        "right",
        "Click & drag here to tilt the map"
      );
      showTooltip(".mapboxgl-ctrl-compass-arrow");

      // set the next step's trigger based on device width
      $(".mapboxgl-ctrl-compass-arrow").on("mousedown.step5", () => {
        runTutorialStep5();
        $(".mapboxgl-ctrl-compass-arrow").off("mousedown.step5");
        $(".mapboxgl-ctrl-compass-arrow").tooltip("hide");
      });
    }

    $("#map-container").off("click.step4");
  });
}

function runTutorialStep5() {
  const step5Text = "Adjust more settings here";

  if (window.innerWidth < BOOTSTRAP_SM_BREAKPOINT) {
    setTooltip(".js-open-pane", "bottom", step5Text);
    showTooltip(".js-open-pane");

    $(".js-open-pane").on("click.settingsClose", () => {
      $(".js-open-pane").tooltip("hide");
      $(".js-open-pane").off("click.settingsClose");
    });
  } else {
    setTooltip(".js-flow-select", "top", step5Text);
    showTooltip(".js-flow-select");
    $(".js-flow-select").on("click.removeStep5", () => {
      $(".js-flow-select").tooltip("hide");
      $(".js-flow-select").off("click.removeStep5");
    });
  }

  $("#map-container").off("click.step5");
  window.Cookies.set("tutorialed", true);
}
