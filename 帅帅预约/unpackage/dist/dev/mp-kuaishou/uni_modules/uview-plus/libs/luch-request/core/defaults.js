"use strict";
const defaults = {
  baseURL: "",
  header: {},
  method: "GET",
  dataType: "json",
  responseType: "text",
  custom: {},
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};
exports.defaults = defaults;
