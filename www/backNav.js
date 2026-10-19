// backNav.js
// Globaler Zurück-Handler für die Hardware-/Gestensteuerung (Android).
//
// Problem: Ohne registrierten Handler beendet Cordova die App, sobald der
// Nutzer die Zurück-Geste ausführt. Gewünscht ist stattdessen:
//   - Auf Spiel-/Unterseiten:  zurück zum Menü (Ziel via data-back-target).
//   - Auf der Menü-Seite:      App beenden (data-back-target="exit").
//
// Ist der In-App-Browser (Tipp/Bibelstelle) geöffnet, fängt dieser das Zurück
// selbst ab (hardwareback=yes) und kehrt zur Frage zurück – dieser Handler
// feuert dann gar nicht, weil das Ereignis an den Browser geht.
//
// Einbindung je Seite:
//   <script src="<pfad>/cordova.js"></script>
//   <script src="<pfad>/backNav.js" data-back-target="<pfad-zum-menu>"></script>
(function () {
  var script = document.currentScript;
  var target = script ? script.getAttribute('data-back-target') : null;

  function onBackButton(event) {
    event.preventDefault();
    // Kein Ziel oder ausdrücklich "exit": App beenden (nur im Hauptmenü gewollt).
    if (!target || target === 'exit') {
      if (navigator.app && typeof navigator.app.exitApp === 'function') {
        navigator.app.exitApp();
      }
      return;
    }
    window.location.href = target;
  }

  // backbutton wird erst nach deviceready zugestellt.
  document.addEventListener(
    'deviceready',
    function () {
      document.addEventListener('backbutton', onBackButton, false);
    },
    false
  );
})();
