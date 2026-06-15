import os
import re
from flask import Flask
from flask import send_file
from flask import abort
from flask import render_template

app = Flask(__name__, template_folder=".")

svgs = {}

@app.before_request
def before_request():
	load_svgs()

@app.context_processor
def inject_svgs():
	return {"svgs": svgs}

def load_svgs():
	#global svgs
	svgs.clear()
	filepath = os.path.join(os.path.dirname(__file__), "panels.md")
	if not os.path.isfile(filepath):
		return
	with open(filepath, "r", encoding="utf-8") as file:
		content = file.read()
	pattern = re.compile(r"<svg\b[^>]*\bdata-label\s*=\s*\"([^\"]+)\"[^>]*>.*?</svg>", re.DOTALL)
	for match in pattern.finditer(content):
		label = match.group(1)
		svgs[label] = match.group(0)

@app.route("/")
def index():
	load_svgs()
	return render_template("main.html")

@app.route("/<path:filename>")
def static_file(filename):
	filepath = os.path.join(os.path.dirname(__file__), filename)
	if os.path.isfile(filepath):
		return send_file(filepath)
	abort(404)

@app.route("/svg/<label>.svg")
def svg_panel(label):
	if label in svgs:
		return svgs[label], 200, {"Content-Type": "image/svg+xml"}
	abort(404)


if __name__ == "__main__":
	app.run(debug=True, port=5000, host="0.0.0.0")