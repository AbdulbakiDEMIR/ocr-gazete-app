param (
    [string]$ProjectName
)

if ([string]::IsNullOrWhiteSpace($ProjectName)) {
    $ProjectName = Read-Host "Yeni Projenin Adı"
}

if ([string]::IsNullOrWhiteSpace($ProjectName)) {
    Write-Error "Proje adı boş bırakılamaz."
    exit 1
}

$indexPath = ".knowledge/index.md"

if (Test-Path $indexPath) {
    $content = Get-Content -Path $indexPath -Raw -Encoding UTF8
    $newContent = $content -replace '\{\{PROJECT_NAME\}\}', $ProjectName
    [System.IO.File]::WriteAllText((Resolve-Path $indexPath).Path, $newContent, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "'$ProjectName' için bilgi grafiği ve kurallar başlatıldı. Sıradaki adım: AI asistanına 'Projeyi kuralım' diyerek onboarding'i başlat." -ForegroundColor Green
} else {
    Write-Error "$indexPath dosyası bulunamadı."
    exit 1
}
