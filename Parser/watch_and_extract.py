"""
watch_and_extract.py

Configurado para ver se tem entrada no folder Downloads e depois extrai todo o 
texto do .html para um arquivo de .txt

Para instalar precisa rodar um pip install com
watchdog
beautifulsoup4
"""

import time
from pathlib import Path

from bs4 import BeautifulSoup
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

# --- Configuration ---
WATCH_FOLDER = Path("./Downloads")           # Caminho que o WatchDog espera novos items
OUTPUT_FOLDER = WATCH_FOLDER / "extracted_text"     # onde o .txt extraido fica
OUTPUT_FOLDER.mkdir(exist_ok=True)

# Tags que normalmente não contem texto (scripts, styles, etc.)
TAGS_TO_STRIP = ["script", "style", "noscript", "svg", "template"]


def extract_text(html_path: Path) -> str:
    with open(html_path, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f, "html.parser")

    for tag in soup(TAGS_TO_STRIP):
        tag.decompose()

    raw_text = soup.get_text(separator="\n", strip=True)
    # Retira todos os espaços.
    lines = [line for line in raw_text.splitlines() if line.strip()]
    return "\n".join(lines)


class HTMLHandler(FileSystemEventHandler):
    def __init__(self):
        self._recently_processed = set()

    def _handle(self, path: Path):
        if path.suffix.lower() != ".html":
            return

        # Verifica se ja foi processado recentemente, para evitar workers com o mesmo arquivo .html
        if path in self._recently_processed:
            return
        self._recently_processed.add(path)

        # Mimir, deixa um computador devagar salvar um documento a tempo
        time.sleep(0.5)

        if not path.exists():
            return  # Foi detectado um arquivo temp, não o verdadeiro tente de novo.

        try:
            text = extract_text(path)
        except Exception as e:
            print(f"Failed to parse {path.name}: {e}")
            return

        out_path = OUTPUT_FOLDER / f"{path.stem}.txt"
        out_path.write_text(text, encoding="utf-8")
        print(f"Extracted: {path.name} -> {out_path.relative_to(WATCH_FOLDER)}")

    def on_created(self, event):
        if not event.is_directory:
            self._handle(Path(event.src_path))

    def on_moved(self, event):
        # Chrome quando vai baixar um arquivo usa nomes temporarios, 
        # e depois renomeia com o nome final quando o download finaliza.
        # MAS esta renomeiacao e um evento de categoria MOVE, e nao de CREATE
        # Entao ficamos monitorando os dois eventos
        if not event.is_directory:
            self._handle(Path(event.dest_path))


if __name__ == "__main__":
    handler = HTMLHandler()
    observer = Observer()
    observer.schedule(handler, str(WATCH_FOLDER), recursive=False)
    observer.start()
    print(f"Watching {WATCH_FOLDER} for new .html files... (Ctrl+C to stop)")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
