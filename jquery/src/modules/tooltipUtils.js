export function setTooltip(selector, placement = "right", title, callback) {
  $(selector)
    .attr("data-toggle", "tooltip")
    .attr("data-placement", placement)
    .attr("data-trigger", "manual")
    .attr("title", title);

  if (callback) callback();
}

export function showTooltip(selector = "button.mapbox-gl-draw_polygon") {
  $(selector).tooltip("show");
}
