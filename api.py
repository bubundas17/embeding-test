from transformers import AutoModel
from flask import Flask, request, jsonify
import numpy as np
import torch
from sklearn.metrics.pairwise import cosine_similarity

model = AutoModel.from_pretrained('jinaai/jina-embeddings-v2-base-en', trust_remote_code=True).cuda()

def generate_embeddings(sentence, device):
    embedding = model.encode([sentence], max_length=8192)
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

    embeddings = generate_embeddings(sentence, device)
    # print(embeddings)
    return jsonify({'embeddings': embeddings.tolist()[0]})

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=3000)