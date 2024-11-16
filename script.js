// Event Listener für Echtzeit-Aktualisierung hinzufügen
document.getElementById("inputText").addEventListener("input", updateOutput);

// Fügt eine Überschrift an der Cursorposition ein
function addHeading() {
    insertAtCursor('<h1></h1>');
    const currentPosition = inputText.selectionStart;

    // Verschiebe den Cursor um 5 Stellen nach links (solange der Cursor nicht an Anfang des Textes ist)
    inputText.setSelectionRange(currentPosition - 5, currentPosition - 5);
    inputText.focus();
    updateOutput();
}

// Fügt fettgedruckten Text an der Cursorposition ein
function addBold() {
    insertAtCursor('<b></b>');
    const currentPosition = inputText.selectionStart;

    // Verschiebe den Cursor um 5 Stellen nach links (solange der Cursor nicht an Anfang des Textes ist)
    inputText.setSelectionRange(currentPosition - 4, currentPosition - 4);
    inputText.focus();
    updateOutput();
}

// Fügt LaTeX-Formatierung als Beispiel ein
function addLatex() {
    insertAtCursor('$$$$');  // Beispiel für einen Bruch
    const currentPosition = inputText.selectionStart;

    // Verschiebe den Cursor um 5 Stellen nach links (solange der Cursor nicht an Anfang des Textes ist)
    inputText.setSelectionRange(currentPosition - 2, currentPosition - 2);
    inputText.focus();
    updateOutput();
}

// Funktion zum Einfügen von Text an der Cursorposition im Textfeld
function insertAtCursor(text) {
    const textarea = document.getElementById("inputText");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Text an der Cursorposition einfügen
    textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);

    // Cursor positionieren
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
}

// Aktualisiert das Ergebnis in Echtzeit und rendert LaTeX
function updateOutput() {
    const input = document.getElementById("inputText").value;
    document.getElementById("output").innerHTML = input;
    MathJax.typeset();  // MathJax rendert die LaTeX-Formeln
}
