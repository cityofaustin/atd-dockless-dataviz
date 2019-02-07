// Using Bootstrap-Datepicker
// Docs: https://www.eyecon.ro/bootstrap-datepicker/
import "./datepicker/js/bootstrap-datepicker.js";
import "./datepicker/css/datepicker.css";

const today = new Date().getTime();
const startDay = new Date("01/01/2018").getTime();

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

export function convertDateFieldInputToUnixTime(dateInput) {
  let date = new Date(dateInput);
  return date.getTime();
}

export function initializeDatepicker(map) {
  $("#js-start-date-select").datepicker();
  $("#js-end-date-select").datepicker();
  map.startTime = startDay;
  map.endTime = today;
  $("#js-start-date-select").datepicker("setValue", map.startTime);
  $("#js-end-date-select").datepicker("setValue", map.endTime);
}
