# Run the Game Arena site with Flask

This project is primarily static HTML/CSS/JS. The included `app.py` is a minimal Flask app that serves the existing files from the project root. Use the steps below to run it locally on Windows PowerShell.

PowerShell steps:

```powershell
# 1) create a virtual environment
python -m venv .\venv

# 2) activate it (PowerShell)
.\venv\Scripts\Activate.ps1

# 3) install dependencies
pip install -r requirements.txt

# 4) run the Flask app
python app.py
```

Open http://127.0.0.1:5000 in your browser. The app serves `index.html` at `/` and will serve other files (styles, pages, scripts, images) by their path.

Notes:
- `app.py` runs with debug=True for local development. Turn that off in production.
- If you prefer, you can set FLASK_APP=app.py and run `flask run` after installing the dependencies.
