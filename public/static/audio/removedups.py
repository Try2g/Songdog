import os
import hashlib

# Ścieżka do folderu z MP3
AUDIO_DIR = "C:\itunesdownloadsongs\static\audio"

# Funkcja do generowania hasha pliku
def file_hash(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

# Usuwanie duplikatów
def remove_duplicates(directory):
    seen_files = {}
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        
        if filename.endswith(".mp3"):
            file_hash_value = file_hash(file_path)
            if file_hash_value in seen_files:
                print(f"Usuwam duplikat: {file_path}")
                os.remove(file_path)
            else:
                seen_files[file_hash_value] = file_path

# Wywołanie funkcji
remove_duplicates(AUDIO_DIR)