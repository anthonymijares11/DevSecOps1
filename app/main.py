from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    # Clean, secure code returning a 200 OK
    return jsonify({"status": "healthy", "version": "1.0.0"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)