from angle_emb import AnglE
from flask import Flask, request, jsonify
import numpy as np
import torch
from sklearn.metrics.pairwise import cosine_similarity

angle = AnglE.from_pretrained('WhereIsAI/UAE-Large-V1', pooling_strategy='cls').cuda()

def generate_embeddings(sentence, device):
    embedding = angle.encode(sentence, to_numpy=True)
    return torch.tensor(embedding).to(device)

app = Flask(__name__)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

@app.route('/api/similarity', methods=['POST'])
def similarity():
    data = request.get_json()
    sentence_a = data['sentence_a']
    sentence_b = data['sentence_b']

    embeddings_a = generate_embeddings(sentence_a, device)
    embeddings_b = generate_embeddings(sentence_b, device)
    similarities = cosine_similarity(embeddings_a.cpu(), embeddings_b.cpu())

    return jsonify({'similarity': float(similarities.tolist()[0][0])})


@app.route('/api/embeddings', methods=['POST'])
def embeddings():
    data = request.get_json()
    sentence = data['sentence']

    embeddings = generate_embeddings(sentence, device).detach().cpu().numpy()

    return jsonify({'embeddings': embeddings.tolist()[0]})

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=3000)