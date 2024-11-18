//-----JavaScript Für Texteditor-----//

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

//-----JavaScript für PDF Viewer-----//
const url = 'PDF.pdf';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;
    PDFViewportWidth = 0;

const scale = 1.5,
    canvas = document.querySelector('#pdf-render'),
    ctx = canvas.getContext('2d'),
    overlaycanvas = document.querySelector('#overlayScreenshot'),
    ctx_overlay = overlaycanvas.getContext('2d');

function matchOverlayToBaseCanvas() {
    overlaycanvas.width = canvas.width;
    overlaycanvas.height = canvas.height;
    overlaycanvas.style.width = canvas.style.width;
    overlaycanvas.style.height = canvas.style.height;
}

//Render the page
const renderPage = num => {
    pageIsRendering = true;
    // Get page
    pdfDoc.getPage(num).then(page =>{
        //Set scale
        const viewport = page.getViewport({scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderCtx = {
            canvasContext: ctx,
            viewport
        };
        page.render(renderCtx).promise.then(()=>{
            pageIsRendering = false;
            matchOverlayToBaseCanvas();

            if(pageNumIsPending !== null){
                renderPage(pageNumIsPending);
                pageNumIsPending = null;
            };
        });

        // Output current page
        document.querySelector('#page-num').textContent = num;
    });
};

// Check for pages rendering
const queueRenderPage = num => {
    if(pageIsRendering){
        pageNumIsPending = num;
    }else{
        renderPage(num)
    }
}

//Show Prev Page
const showPrevPage = () =>{
    if(pageNum<=1){
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}
//Show Next Page
const showNextPage = () =>{
    if(pageNum>=pdfDoc.numPages){
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}

//Get Document
pdfjsLib.getDocument(url).promise.then(pdfDoc_ =>{
    pdfDoc = pdfDoc_;
    console.log(pdfDoc);
    
    document.querySelector('#page-count').textContent = pdfDoc.numPages;

    renderPage(pageNum)
}).catch(err=>{
    //Display Error
    const div = document.createElement('div');
    div.className = 'error';
    div.appendChild(document.createTextNode(err.message));
    document.querySelector('body').insertBefore(div, canvas);
    //Remove Top Bar
    document.querySelector('.top-bar').style.display = 'none';
});
//Button Events
document.querySelector('#prev-page').addEventListener('click', showPrevPage);
document.querySelector('#next-page').addEventListener('click', showNextPage);


//----Screenshot Funktionalität----//
//const drawingCanvas = document.getElementById('drawingCanvas');
const screenshotCanvas = document.getElementById('screenshotCanvas');
//const ctx_draw = drawingCanvas.getContext('2d');
const screenshotCtx = screenshotCanvas.getContext('2d');

let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };

// Bereichsauswahl starten
overlaycanvas.addEventListener('mousedown', (e) => {
  isSelecting = true;
  const rect = canvas.getBoundingClientRect();
  selectionStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
});

// Bereichsauswahl bewegen
overlaycanvas.addEventListener('mousemove', (e) => {
  if (!isSelecting) return;
  const rect = canvas.getBoundingClientRect();
  selectionEnd = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  
  // Auswahlbereich zeichnen

  ctx_overlay.clearRect(0, 0, canvas.width, canvas.height);
  ctx_overlay.strokeStyle = 'black';
  ctx_overlay.lineWidth = 2;
  ctx_overlay.setLineDash([5, 5]);
  ctx_overlay.strokeRect(
    selectionStart.x,
    selectionStart.y,
    selectionEnd.x - selectionStart.x,
    selectionEnd.y - selectionStart.y
  );
});
// Bereichsauswahl beenden und Screenshot machen
overlaycanvas.addEventListener('mouseup', () => {
  if (!isSelecting) return;
  isSelecting = false;

  const x = Math.min(selectionStart.x, selectionEnd.x);
  const y = Math.min(selectionStart.y, selectionEnd.y);
  const width = Math.abs(selectionEnd.x - selectionStart.x);
  const height = Math.abs(selectionEnd.y - selectionStart.y);

  if (width === 0 || height === 0) {
    alert('Bitte einen gültigen Bereich auswählen!');
    return;
  }

  const imageData = ctx.getImageData(x, y, width, height);
  screenshotCanvas.width = width;
  screenshotCanvas.height = height;
  screenshotCtx.putImageData(imageData, 0, 0);

  // Zeichne den Auswahlrahmen zurück, um die ursprüngliche Anzeige zu erhalten
  ctx.setLineDash([]);
});

