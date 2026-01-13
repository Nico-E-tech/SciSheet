# SciSheet🚀

**SciSheet** ist ein Tool zur intelligenten Erfassung mathematischer Formeln aus Dokumenten. Es wandelt Bildschirminhalte (z. B. aus Vorlesungsskripten oder PDFs) direkt in editierbaren LaTeX-Code um und ermöglicht so den schnellen Aufbau digitaler Formelsammlungen.

> [!WARNING]
> **Projektstatus:** Dies ist ein **Prototyp** (Proof of Concept).

![SciSheet AI Showcase](Bilder/SciSheet_Showcase.drawio.png)

## Features
* **KI-gestützte OCR:** Präzise Erkennung komplexer mathematischer Strukturen (Brüche, Integrale, ...).
* **Direkte LaTeX-Ausgabe:** Erzeugt sofortigen Code, der direkt in Editoren wie Overleaf oder TeXstudio verwendet werden kann.
* **Lokal & Sicher:** Die gesamte Formelerkennung läuft lokal auf deinem Rechner. Es werden keine Daten an externe Cloud-Dienste gesendet.
* **Einfache Bearbeitung:** Der generierte Code kann direkt im integrierten Editor angepasst werden.

## Technische Basis
Der Kern der Formelerkennung basiert auf dem Open-Source-Modell von:
🔗 **Lukas Blecher:** [LaTeX-OCR](https://lukas-blecher.github.io/LaTeX-OCR/)

## Installation & Setup

Folge diesen Schritten, um SciSheet AI lokal zu starten:

### 1. Repository klonen
```bash
git clone [https://github.com/Nico-E-tech/SciSheet.git](https://github.com/Nico-E-tech/SciSheet.git)
cd SciSheet
2. Virtuelle Umgebung (venv) einrichten
Bash

# Umgebung erstellen
python -m venv venv

# Umgebung aktivieren
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
3. Abhängigkeiten installieren
Bash

pip install -r requirements.txt
4. Anwendung starten
Backend: Starte den Python-Server mit python app.py.

Frontend: Öffne die index.html in deinem Browser (empfohlen: VS Code Extension "Live Server" für korrekte Pfad-Verarbeitung).

Bekannte Probleme (Known Issues)
PDF-Export: Die Funktion zum Exportieren der fertigen Sammlung als PDF befindet sich noch in der Entwicklung. Aktuell kann es zu Formatierungsproblemen kommen.