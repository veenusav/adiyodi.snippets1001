from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/data', methods=['GET'])
def get_plot_data():
    data = {
        "x": [-5, 2, 5, 3],
        "y": [10, 10, 10, 10, 10, 10, 20, 20, 12, 12, 12, 12, 12, 12, 12, 12, 0, 0, 0, 0, 0, 0, 0, 0],
        "z": [1000, 400, 0]
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
