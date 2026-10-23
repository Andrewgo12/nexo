param(
    [string]$Image = 'ghcr.io/project-osrm/osrm-backend:26.10-assertions-debian'
)

$ErrorActionPreference = 'Stop'
$dataDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\ops\osrm\data'))
$pbfFiles = @(Get-ChildItem -LiteralPath $dataDirectory -Filter '*.osm.pbf' -File -ErrorAction SilentlyContinue)

if ($pbfFiles.Count -ne 1) {
    throw "Coloca exactamente un archivo .osm.pbf en '$dataDirectory' antes de preparar OSRM."
}

$datasetName = $pbfFiles[0].Name -replace '\.osm\.pbf$', ''
$mount = "type=bind,source=$dataDirectory,target=/data"

function Invoke-Osrm {
    param([string[]]$Arguments)

    & docker run --rm --mount $mount $Image @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Falló el comando OSRM: $($Arguments -join ' ')"
    }
}

Invoke-Osrm @('osrm-extract', '-p', '/opt/car.lua', "/data/$($pbfFiles[0].Name)")
Invoke-Osrm @('osrm-partition', "/data/$datasetName.osrm")
Invoke-Osrm @('osrm-customize', "/data/$datasetName.osrm")

Write-Host "Dataset preparado: $datasetName"
Write-Host "Configura OSRM_DATASET_NAME=$datasetName en el archivo .env de la raíz."
