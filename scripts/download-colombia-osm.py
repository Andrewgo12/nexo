from hashlib import md5
from pathlib import Path
from urllib.request import Request, urlopen


BASE_URL = "https://download.geofabrik.de/south-america/"
FILENAME = "colombia-latest.osm.pbf"
DATA_DIRECTORY = Path(__file__).resolve().parents[1] / "ops" / "osrm" / "data"
CHUNK_SIZE = 1024 * 1024


def file_md5(path: Path) -> str:
    checksum = md5()
    with path.open("rb") as source:
        while chunk := source.read(CHUNK_SIZE):
            checksum.update(chunk)
    return checksum.hexdigest()


def download(url: str, destination: Path) -> None:
    request = Request(url, headers={"User-Agent": "ViajaU-OSM-Setup/1.0"})
    with urlopen(request, timeout=60) as response, destination.open("wb") as output:
        expected_size = int(response.headers.get("Content-Length", "0"))
        if expected_size <= 0:
            raise RuntimeError(f"El servidor no indicó un tamaño válido para {url}.")

        received = 0
        while chunk := response.read(CHUNK_SIZE):
            output.write(chunk)
            received += len(chunk)
            if received % (10 * CHUNK_SIZE) < CHUNK_SIZE or received == expected_size:
                print(f"\r{destination.name}: {received / 1024**2:.0f}/{expected_size / 1024**2:.0f} MiB", end="", flush=True)

        print()
        if received != expected_size:
            raise RuntimeError(
                f"Descarga incompleta: se recibieron {received} de {expected_size} bytes."
            )


def main() -> None:
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    destination = DATA_DIRECTORY / FILENAME
    temporary = destination.with_suffix(destination.suffix + ".part")

    try:
        checksum_url = f"{BASE_URL}{FILENAME}.md5"
        with urlopen(Request(checksum_url, headers={"User-Agent": "ViajaU-OSM-Setup/1.0"}), timeout=20) as response:
            expected_md5 = response.read(256).decode("ascii").split()[0].lower()

        if len(expected_md5) != 32:
            raise RuntimeError("Geofabrik devolvió un checksum MD5 inválido.")

        if destination.exists() and file_md5(destination) == expected_md5:
            print(f"El extracto existente ya es válido: {destination}")
            return

        if destination.exists():
            raise RuntimeError(
                f"El extracto existente no coincide con el checksum oficial: {destination}. "
                "Muévelo fuera del directorio antes de volver a descargar."
            )

        print(f"Descargando {BASE_URL}{FILENAME}")
        download(f"{BASE_URL}{FILENAME}", temporary)
        actual_md5 = file_md5(temporary)
        if actual_md5 != expected_md5:
            raise RuntimeError(
                f"Checksum incorrecto: esperado {expected_md5}, recibido {actual_md5}."
            )

        temporary.replace(destination)
        print(f"Extracto verificado y guardado en {destination}")
        print("Atribución requerida: © OpenStreetMap contributors (ODbL).")
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
