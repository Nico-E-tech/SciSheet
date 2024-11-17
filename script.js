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
    ctx = canvas.getContext('2d');

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
