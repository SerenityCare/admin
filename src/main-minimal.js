import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;
globalThis.bootstrap = bootstrap;

import './main.scss';

import './js/helpers/smartresize.js';
import './js/sidebar.js';
import './js/init.js';

import Chart from 'chart.js/auto';
window.Chart = Chart;
globalThis.Chart = Chart;

// NOTE:
// The old Gentelella dashboard initializer has been removed.
// We now use our custom system via /src/js/main.js

function initializeGlobalWidgets() {
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );

  tooltipTriggerList.forEach((element) => {
    new bootstrap.Tooltip(element);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeGlobalWidgets();
});