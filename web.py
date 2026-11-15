import os
from flask import Flask, render_template, send_from_directory, abort

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

# Every game's .js lives somewhere under apps/: directly in apps/ (the base
# library), in its own subfolder once it needs its own assets (apps/Shooters/),
# or in apps/drafts/ (everything else). '/games/<name>' is just the page URL —
# unrelated to any of these real folder names — so there's no collision with
# static file serving to special-case here.
GAME_SEARCH_DIRS = ['apps/{game}', 'apps', 'apps/drafts']

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/games/<game>')
def game_page(game):
	for d in GAME_SEARCH_DIRS:
		d = d.format(game=game)
		if os.path.isfile(os.path.join(d, f'{game}.js')):
			return render_template('game.html', game_js=game, game_class=game, game_dir=d)
	abort(404)

@app.route('/<path:path>')
def serve_file(path):
#	try:
	return send_from_directory('.', path)
#	except:
#		abort(404)

if __name__ == '__main__':
	app.run(debug=True, host='0.0.0.0', port=5000)
