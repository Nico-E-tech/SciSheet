from flask import Flask, request, jsonify
from flask_cors import CORS
from pix2tex import cli
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Erlaubt Cross-Origin-Anfragen

model = cli.LatexOCR()

@app.route('/convert', methods=['POST'])
def convert_image():
    try:
        # Bilddaten aus der Anfrage lesen
        file = request.files['image']
        image = Image.open(file.stream).convert("RGB")

        # Konvertiere das Bild zu LaTeX
        latex_code = model(image)

        return jsonify({'latex': latex_code})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
