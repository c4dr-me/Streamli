from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

# Load a pre-trained toxic comment classification model
toxic_model = pipeline("text-classification", model="unitary/toxic-bert")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    comment = data.get("comment")

    if not comment:
        return jsonify({"error": "No comment provided"}), 400

    # Run the prediction
    result = toxic_model(comment)
    toxicity_score = result[0]['score']

    # Define a threshold (e.g., 0.5 means the model considers the message toxic)
    is_toxic = toxicity_score > 0.5

    return jsonify({"toxic": is_toxic, "score": toxicity_score})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
