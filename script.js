
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
  ctx_overlay.clearRect(0, 0, canvas.width, canvas.height);
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

//---Code für Editor.js---//
// LaTeX Plugin 
class LaTeXBlock {
    static get toolbox() {
        return {
            title: 'LaTeX',
            icon: '∑',
        };
    }

    constructor({ data }) {
        this.data = data || { latex: '' };
        this.wrapper = null;
        this.input = null;
        this.renderedOutput = null;
        this.isEditing = false;

        setTimeout(() => this.enableEditing(), 0);
    }

    render() {
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'latex-block';

        this.renderedOutput = document.createElement('div');
        this.renderedOutput.className = 'latex-output';
        this.renderRenderedOutput();

        this.input = document.createElement('textarea');
        this.input.className = 'latex-input';
        this.input.placeholder = 'Enter LaTeX code...';
        this.input.value = this.data.latex || '';
        this.input.addEventListener('input', () => {
            this.data.latex = this.input.value;
            this.renderRenderedOutput();
        });

        this.input.addEventListener('blur', () => this.disableEditing());

        this.renderedOutput.addEventListener('click', () => this.enableEditing());

        this.wrapper.appendChild(this.renderedOutput);
        this.wrapper.appendChild(this.input);

        return this.wrapper;
    }

    enableEditing() {
        this.isEditing = true;
        this.input.style.display = 'block';
        this.input.focus();
    }

    disableEditing() {
        this.isEditing = false;
        this.input.style.display = 'none';
    }

    renderRenderedOutput() {
        try {
            this.renderedOutput.innerHTML = katex.renderToString(this.data.latex, {
                throwOnError: false,
                displayMode: true,
            });
        } catch (error) {
            this.renderedOutput.innerHTML = `<span style="color: red;">${error.message}</span>`;
        }
    }

    save() {
        return {
            latex: this.data.latex,
        };
    }
}


// Editor Initialization 
document.addEventListener('DOMContentLoaded', () => {
    const editor = new EditorJS({
        holder: 'editor',
        tools: {

            latex: LaTeXBlock,
            header: Header,
            image: SimpleImage,
            list: {
                class: EditorjsList,
                inlineToolbar: true,
                config: {
                    defaultStyle: 'unordered'
                },
            },
            paragraph: {
                class: Paragraph,
                inlineToolbar: true,
            },
        },
        onReady: () => {
            new DragDrop(editor);
        },
    });
});
