import "../../node_modules/@chenfengyuan/datepicker/dist/datepicker.min.js";
import "../../node_modules/@chenfengyuan/datepicker/dist/datepicker.min.css";

const today = new Date();
const startDay = "01/01/2018";

const startOptions = {
  date: startDay,
  autoHide: true,
  startDate: startDay,
  endDate: today,
  autoPick: true
};

const endOptions = {
  date: today,
  autoHide: true,
  startDate: startDay,
  endDate: today,
  autoPick: true
};

export function convertDateStringToUnix(dateString) {
  let date = new Date(dateString);
  return date.getTime();
}

export function initializeDatepicker(map) {
  $("#js-start-date-select").datepicker(startOptions);
  $("#js-end-date-select").datepicker(endOptions);
  map.startTime = convertDateStringToUnix(startDay);
  map.endTime = convertDateStringToUnix(today);
}
