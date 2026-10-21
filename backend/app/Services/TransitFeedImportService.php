<?php

namespace App\Services;

use App\Models\TransitFeedImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransitFeedImportService
{
    private const MAX_ROWS = 50000;

    public function import(
        string $feedVersion,
        UploadedFile $stopsFile,
        UploadedFile $routesFile,
        int $userId,
    ): TransitFeedImport {
        $stops = $this->readCsv($stopsFile, [
            'stop_id',
            'stop_name',
            'stop_lat',
            'stop_lon',
        ]);
        $routes = $this->readCsv($routesFile, [
            'route_id',
            'route_short_name',
            'route_long_name',
        ]);

        $validatedStops = $this->validateStops($stops);
        $validatedRoutes = $this->validateRoutes($routes);

        return DB::transaction(function () use ($feedVersion, $validatedStops, $validatedRoutes, $userId): TransitFeedImport {
            $import = TransitFeedImport::create([
                'feed_version' => $feedVersion,
                'status' => 'completed',
                'stops_count' => count($validatedStops),
                'routes_count' => count($validatedRoutes),
                'imported_by_user_id' => $userId,
            ]);
            $timestamp = now();

            foreach (array_chunk($validatedStops, 500) as $chunk) {
                DB::table('transit_stops')->insert(array_map(
                    fn (array $stop): array => [
                        'transit_feed_import_id' => $import->id,
                        ...$stop,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ],
                    $chunk,
                ));
            }
            foreach (array_chunk($validatedRoutes, 500) as $chunk) {
                DB::table('transit_routes')->insert(array_map(
                    fn (array $route): array => [
                        'transit_feed_import_id' => $import->id,
                        ...$route,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ],
                    $chunk,
                ));
            }

            return $import;
        });
    }

    private function readCsv(UploadedFile $file, array $requiredColumns): array
    {
        $handle = fopen($file->getRealPath(), 'rb');
        if ($handle === false) {
            throw ValidationException::withMessages([
                'feed' => ['No fue posible leer uno de los archivos CSV del feed.'],
            ]);
        }

        try {
            $headers = fgetcsv($handle, null, ',', '"', '');
            if ($headers === false) {
                throw ValidationException::withMessages([
                    'feed' => ['El archivo CSV está vacío.'],
                ]);
            }
            $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headers[0]);
            $headers = array_map(fn ($header): string => trim((string) $header), $headers);
            $missingColumns = array_values(array_diff($requiredColumns, $headers));
            if ($missingColumns) {
                throw ValidationException::withMessages([
                    'feed' => ['Faltan columnas GTFS requeridas: '.implode(', ', $missingColumns).'.'],
                ]);
            }

            $records = [];
            $line = 1;
            while (($values = fgetcsv($handle, null, ',', '"', '')) !== false) {
                $line++;
                if ($values === [null] || $values === []) {
                    continue;
                }
                if (count($records) >= self::MAX_ROWS) {
                    throw ValidationException::withMessages([
                        'feed' => ['Cada archivo GTFS puede contener como máximo 50.000 filas.'],
                    ]);
                }
                if (count($values) !== count($headers)) {
                    throw ValidationException::withMessages([
                        'feed' => ["Fila {$line}: el número de columnas no coincide con el encabezado."],
                    ]);
                }

                $records[] = array_combine($headers, array_map(
                    fn ($value): string => trim((string) $value),
                    $values,
                ));
            }

            return $records;
        } finally {
            fclose($handle);
        }
    }

    private function validateStops(array $records): array
    {
        $validated = [];
        $seen = [];
        foreach ($records as $index => $record) {
            $row = $index + 2;
            $id = $record['stop_id'];
            $name = $record['stop_name'];
            $latitude = $record['stop_lat'];
            $longitude = $record['stop_lon'];
            if (
                $id === ''
                || strlen($id) > 120
                || $name === ''
                || strlen($name) > 255
                || ! is_numeric($latitude)
                || (float) $latitude < -90
                || (float) $latitude > 90
                || ! is_numeric($longitude)
                || (float) $longitude < -180
                || (float) $longitude > 180
            ) {
                throw ValidationException::withMessages([
                    'stops' => ["Fila {$row}: identificador, nombre o coordenadas de parada inválidos."],
                ]);
            }
            if (isset($seen[$id])) {
                throw ValidationException::withMessages([
                    'stops' => ["Fila {$row}: stop_id duplicado ({$id})."],
                ]);
            }
            $seen[$id] = true;
            $validated[] = [
                'stop_id' => $id,
                'stop_name' => $name,
                'stop_lat' => (float) $latitude,
                'stop_lon' => (float) $longitude,
            ];
        }

        if (! $validated) {
            throw ValidationException::withMessages(['stops' => ['El archivo no contiene paradas válidas.']]);
        }

        return $validated;
    }

    private function validateRoutes(array $records): array
    {
        $validated = [];
        $seen = [];
        foreach ($records as $index => $record) {
            $row = $index + 2;
            $id = $record['route_id'];
            $shortName = $record['route_short_name'];
            $longName = $record['route_long_name'];
            if (
                $id === ''
                || strlen($id) > 120
                || strlen($shortName) > 120
                || strlen($longName) > 255
                || ($shortName === '' && $longName === '')
            ) {
                throw ValidationException::withMessages([
                    'routes' => ["Fila {$row}: identificador o nombre de ruta inválido."],
                ]);
            }
            if (isset($seen[$id])) {
                throw ValidationException::withMessages([
                    'routes' => ["Fila {$row}: route_id duplicado ({$id})."],
                ]);
            }
            $seen[$id] = true;
            $validated[] = [
                'route_id' => $id,
                'route_short_name' => $shortName !== '' ? $shortName : null,
                'route_long_name' => $longName !== '' ? $longName : null,
            ];
        }

        if (! $validated) {
            throw ValidationException::withMessages(['routes' => ['El archivo no contiene rutas válidas.']]);
        }

        return $validated;
    }
}
