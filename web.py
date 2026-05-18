from flask import Flask, render_template, send_from_directory, abort

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/games/<game>')
def game_page(game):
	return render_template('game.html', game_js=game, game_class=game)

@app.route('/<path:path>')
def serve_file(path):
#	try:
	return send_from_directory('.', path)
#	except:
#		abort(404)

if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0', port=5000)
