from flask import Flask, render_template, jsonify, request
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from greed_game import GreedGame
from player import Player
from ui import level_payload

app = Flask(__name__)
greed_game = None


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/history')
def history():
    return render_template('history.html')


@app.route('/api/greed/init', methods=['POST'])
def api_greed_init():
    data = request.json or {}
    amount = data.get('amount', 93)
    coins = data.get('coins', None)
    available = data.get('available', None)

    try:
        global greed_game
        greed_game = GreedGame(amount=amount, coins=coins, available=available)
        return jsonify({"success": True, "level": level_payload(greed_game)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route('/api/greed/submit', methods=['POST'])
def api_greed_submit():
    if greed_game is None:
        return jsonify({"success": False, "error": "Greed game not initialized"}), 400

    data = request.json or {}
    choice = data.get('choice', {})
    parsed = Player().submit_choice(choice)
    result = greed_game.validate_player(parsed)
    return jsonify({"success": True, "result": result})


if __name__ == '__main__':
    app.run(debug=True, port=5000)

