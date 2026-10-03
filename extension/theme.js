// Picks the colour scheme before the first paint.
//
// The options page used to ignore the OS theme: opening it from the dark side
// panel flashed white. Bootstrap 5.3 keys its component palette off
// data-bs-theme, and that attribute has to be set before options.css paints,
// which a script at the end of <body> is too late for (and MV3 forbids inline).
(function () {
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var apply = function () {
    document.documentElement.dataset.bsTheme = mq.matches ? "dark" : "light";
  };
  apply();
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else mq.addListener(apply);
})();
