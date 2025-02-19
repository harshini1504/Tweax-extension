from flask import Flask, request, jsonify
import google.generativeai as genai
import time
import os
import psutil  # For CPU & memory usage

# Set up Gemini API key
genai.configure(api_key="AIzaSyCTT3yvUykioJKo9tMqZDB6VcdDQWCXfiE")

app = Flask(__name__)

@app.route('/optimize', methods=['POST'])
def suggest_optimization():
    code_snippet = request.json.get('code')
    prompt = f"""
    Analyze the following Python code and suggest performance improvements.
    Provide explanations and optimized code if possible.

    Code:

    {code_snippet}

    Suggested optimizations:
    """

    model = genai.GenerativeModel("gemini-1.5-flash")

    for attempt in range(3):
        try:
            # First call: Get the optimized code
            response = model.generate_content(prompt)
            optimized_code = response.text

            # Second call: Get the explanation for the optimized code
            explanation_prompt = f"Explain the improvements in the following optimized code:\n{optimized_code}"
            explanation_response = model.generate_content(explanation_prompt)

            # Third call: Get the time complexity of the optimized code
            time_complexity_prompt = f"Provide the time complexity (Big-O) of the following optimized code:\n{optimized_code}"
            time_complexity_response = model.generate_content(time_complexity_prompt)

            # Fourth call: Get the space complexity of the optimized code
            space_complexity_prompt = f"Provide the space complexity (Big-O) of the following optimized code:\n{optimized_code}"
            space_complexity_response = model.generate_content(space_complexity_prompt)

            # Measure CPU and memory usage before and after optimization
            cpu_usage_before, memory_usage_before = measure_usage(code_snippet)
            cpu_usage_after, memory_usage_after = measure_usage(optimized_code)

            return jsonify({
                'optimized_code': optimized_code,
                'explanation': explanation_response.text,
                'time_complexity': time_complexity_response.text,
                'space_complexity': space_complexity_response.text,
                'cpu_usage_before': cpu_usage_before,
                'cpu_usage_after': cpu_usage_after,
                'memory_usage_before': memory_usage_before,
                'memory_usage_after': memory_usage_after
            })
        except Exception as e:
            if "grpc_wait_for_shutdown_with_timeout" in str(e) or "Resource has been exhausted" in str(e):
                time.sleep(30)
            else:
                return jsonify({'error': str(e)})

    return jsonify({'error': 'Failed to generate a response due to timeout or quota limits.'})

def measure_usage(code_snippet):
    """Measure CPU and memory usage for the given code snippet."""
    process = psutil.Process(os.getpid())

    # Measure CPU usage
    cpu_usage = process.cpu_percent(interval=0.1)

    # Measure memory usage
    memory_usage = process.memory_info().rss / (1024 * 1024)  # Convert to MB

    return f"{cpu_usage:.2f}%", f"{memory_usage:.2f} MB"

if __name__ == "__main__":
    app.run(port=5000)
