# python/code_optimizer.py
from flask import Flask, request, jsonify
import google.generativeai as genai
import time
import os

# Set up Gemini API key
genai.configure(api_key="AIzaSyCTT3yvUykioJKo9tMqZDB6VcdDQWCXfiE")

app = Flask(__name__)

@app.route('/optimize', methods=['POST'])
def suggest_optimization():
    code_snippet = request.json.get('code')
    prompt = f"""
    Analyze the following Python code and provide the optimized code.
    Provide explanations and suggest performance improvements.

    Code:

    {code_snippet}

    Suggested optimizations:
    """

    model = genai.GenerativeModel("gemini-1.5-flash")

    for attempt in range(3):
        try:
            response = model.generate_content(prompt)
            return jsonify({'optimized_code': response.text})
        except Exception as e:
            if "grpc_wait_for_shutdown_with_timeout" in str(e) or "Resource has been exhausted" in str(e):
                time.sleep(30)
            else:
                return jsonify({'error': str(e)})

    return jsonify({'error': 'Failed to generate a response due to timeout or quota limits.'})

if __name__ == "__main__":
    app.run(port=5000)
