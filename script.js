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
    overlaycanvas = document.querySelector('#overlayScreenshot'), //Overlaycanvas auf dem der Gestrichelte Auswahlrahmen gezeichnet wird
    ctx_overlay = overlaycanvas.getContext('2d');

function matchOverlayToBaseCanvas() {
    overlaycanvas.width = canvas.width;
    overlaycanvas.height = canvas.height;
    overlaycanvas.style.width = canvas.style.width;
    overlaycanvas.style.height = canvas.style.height;
}
//1. Get Document
pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
    pdfDoc = pdfDoc_;   //Mache PDF Objekt Global indem die Lokale Variable pdfDoc_ pdfDoc zugewiesen wird
    document.querySelector('#page-count').textContent = pdfDoc.numPages;
    renderPage(pageNum);
}).catch(err => {
    //Display Error
    alert('PDF nicht gefunden!');
});

//2. Render the page
const renderPage = num => {
    pageIsRendering = true;
    // Get page
    pdfDoc.getPage(num).then(page => {
        //Set scale
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderCtx = {
            canvasContext: ctx,
            viewport
        };
        page.render(renderCtx).promise.then(() => {
            pageIsRendering = false;
            matchOverlayToBaseCanvas();

            if (pageNumIsPending !== null) {
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
    if (pageIsRendering) {
        pageNumIsPending = num;
    } else {
        renderPage(num)
    }
}

//Show Prev Page
const showPrevPage = () => {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}

//Show Next Page
const showNextPage = () => {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}
//Button Events
document.querySelector('#prev-page').addEventListener('click', showPrevPage);
document.querySelector('#next-page').addEventListener('click', showNextPage);

//----Auswahl zwischen Bild und Latex Snipped----//
togglePixMathSwitch = "math";
document.addEventListener('DOMContentLoaded', function () {

    // Handle switch toggle
    const toggleSwitch = document.getElementById('toggle-switch');
    toggleSwitch.addEventListener('change', function () {
        if (toggleSwitch.checked) {
            togglePixMathSwitch = "pix";
        } else {
            togglePixMathSwitch = "math";
        }
    });
});

//----Screenshot Funktionalität----//
const screenshotCanvas = document.getElementById('screenshotCanvas');
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
    // Aktualisiere den Editor-Inhalt mit dem Canvas-Bild
    if (togglePixMathSwitch === "pix") {
        exportCanvasImage(screenshotCanvas);
    }
    //Convertiere Canvas2Latex Code
    if (togglePixMathSwitch === "math") {
        LatexCode_Promise = Canvas2Latex(screenshotCanvas);
        if (LatexCode_Promise instanceof Promise) {
            LatexCode_Promise.then((LatexCode) => {
                console.log("LaTeX code:", LatexCode);
                // Jetzt können Sie den resultierenden String verwenden
                // result enthält den Wert: "\\operatorname{rot}{\\vec{e}}"
                LatexCode2Editor(LatexCode);
            }).catch((error) => {
                console.error("Fehler beim Abrufen des LaTeX-Codes:", error);
            });
        } else {
            console.error("LatexCode ist kein Promise.");
        }
    }
});

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
        let content = this.data.latex;
        this.renderedOutput.innerHTML = `\\[${content}\\]`;
        // Use MathJax to typeset the content
        MathJax.typesetPromise([this.renderedOutput]).catch((err) => {
            console.error('MathJax typesetting error:', err.message);
            this.renderedOutput.innerHTML = `<span style="color: red;">${err.message}</span>`;
        });
    }

    save() {
        return {
            latex: this.data.latex,
        };
    }
}

// Definiere den CustomBlock für das Canvas-Bild ohne Toolbox-Eintrag
class CanvasImageBlock {
    constructor({ data }) {
        this.data = data;
    }

    render() {
        const container = document.createElement('div');
        const img = document.createElement('img');
        img.src = this.data.url || '';
        container.appendChild(img);
        return container;
    }

    save(blockContent) {
        const img = blockContent.querySelector('img');
        return {
            url: img.src,
        };
    }
}

// Editor Initialization
let global_editor = null;
document.addEventListener('DOMContentLoaded', () => {
    const editor = new EditorJS({
        holder: 'editor',
        tools: {
            latex: LaTeXBlock,
            header: Header,
            // Definiere canvasImage, aber ohne Toolbox-Eintrag
            canvasImage: {
                class: CanvasImageBlock,
                // Keine toolbox-Eigenschaft bedeutet, dass es nicht in der Toolbox angezeigt wird
            },
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
    global_editor = editor;

    // Beispiel-Funktion, um ein Bild von einem Canvas zu exportieren
    window.exportCanvasImage = function (canvas) {
        // Exportiere das Canvas als Bild
        const dataURL = canvas.toDataURL();

        editor.isReady.then(() => {
            // Der CanvasImage-Block kann hier programmgesteuert eingefügt werden
            editor.blocks.insert('canvasImage', {
                url: dataURL
            });
        }).catch((reason) => {
            console.error(`Editor.js init failed: ${reason}`);
        });
    };
    window.LatexCode2Editor = function (LatexCode) {
        editor.isReady.then(() => {
            // Assuming editor is an instance of EditorJS
            editor.blocks.insert('latex', {
                latex: LatexCode
            });
        }).catch(() => {
            console.error(`Editor.js init failed.`);
        });
    };
});

//----Hier Canvas to Latex Funktionalität----//
const latexDiv = document.getElementById('latex');
async function Canvas2Latex(canvas) {
    // Überprüfen, ob das Canvas existiert
    if (!canvas) {
        console.error("Canvas-Element ist nicht definiert.");
        return;
    }

    // Konvertiere das Canvas zu einem Blob
    const imageBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
    });

    if (!imageBlob) {
        console.error("Fehler beim Konvertieren des Canvas zu einem Blob.");
        return;
    }

    // Erstelle das FormData-Objekt für die Anfrage
    const formData = new FormData();
    formData.append("image", imageBlob, "formula.png");

    try {
        // Sende das Bild an das Backend
        const response = await fetch("http://127.0.0.1:5000/convert", {
            method: "POST",
            body: formData,
        });

        // Überprüfe die Antwort
        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }

        const data = await response.json();

        // Gibt den LaTeX-Code zurück
        if (data.latex) {
            return data.latex;
        } else {
            console.error("Fehler beim Umwandeln:", data.error || "Unbekannter Fehler");
        }
    } catch (error) {
        console.error("Anfrage fehlgeschlagen:", error.message);
    }
}

//ToDo
//Erstelle Funktion um editor inhalt als pdf zu exportieren
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    global_editor.save().then((outputData) => {
        let yOffset = 20; // Initial Y offset
        const promises = [];

        outputData.blocks.forEach((block) => {
            if (block.text === "") {
                block.text = " ";
            }

            /*
            if (!block.data || (!block.data.text && !block.data.latex)) {
                console.error(`Block «${block.type}» skipped because saved data is invalid:`, block.data);
                return;
            }*/

            if (block.type === "header") {
                pdf.setFontSize(40);
                pdf.text(block.data.text, 10, yOffset);
                yOffset += 20; // Adjust Y offset for next block
            } else if (block.type === "paragraph") {
                pdf.setFontSize(12);
                pdf.text(block.data.text, 10, yOffset);
                yOffset += 10; // Adjust Y offset for next block
            } else if (block.type === "list") {
                const list = block.data.style === "unordered" ? "ul" : "ol";
                block.data.items.forEach((item) => {
                    pdf.setFontSize(12);
                    pdf.text(`• ${item.content}`, 10, yOffset);
                    yOffset += 10; // Adjust Y offset for next item
                });
            } else if (block.type === "latex") {
                const latexContent = block.data.latex;
                console.log("LaTeX content:", latexContent);
                if (!latexContent) {
                    console.error(`Block «${block.type}» skipped because saved data is invalid:`, block.data);
                    return;
                }

                const latexContainer = document.createElement('div');
                latexContainer.style.display = 'inline-block';
                latexContainer.innerHTML = `(\\(${latexContent}\\)`;
                document.body.appendChild(latexContainer);
                // Save the original MathJax configuration
                const originalConfig = window.MathJax.config;

                // Temporarily set MathJax to use the SVG output processor
                window.MathJax = {
                    ...originalConfig,
                    svg: {
                        fontCache: 'global'
                    },
                    options: {
                        renderActions: {
                            addMenu: []
                        }
                    }
                };
                // ToDo: MathJax docu lesen
                // Convert LaTeX to SVG
                const svg = MathJax.tex2svg(latexContent, { display: false });
                if (svg) {
                    svg2pdf(svg, pdf, {
                        xOffset: 10,
                        yOffset: yOffset,
                        scale: 1
                    });
                    yOffset += svg.getBoundingClientRect().height * 0.264583; // Convert px to mm
                } else {
                    console.error("SVG not found after converting LaTeX.");
                }

                // Restore the original MathJax configuration
                window.MathJax = originalConfig;
            }
        });

        Promise.all(promises).then(() => {
            pdf.save('editor_content.pdf');
        }).catch(error => {
            console.error("Error processing LaTeX blocks:", error);
        });
    }).catch(error => {
        console.error("Error saving editor content:", error);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('export-pdf').addEventListener('click', exportPDF);
});

//----