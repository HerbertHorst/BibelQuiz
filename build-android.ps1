<#
.SYNOPSIS
    Baut das Android-APK fuer das Bibel-Quizz (Cordova / cordova-android 15).

.DESCRIPTION
    Setzt die noetigen Umgebungsvariablen (JDK aus Android Studio JBR, Android SDK),
    synchronisiert www/ in die Android-Plattform und ruft den Gradle-Wrapper direkt auf.

    Warum nicht "cordova build android"? Dessen Vorab-Check sucht ein *System*-Gradle,
    um den Wrapper zu erzeugen, und bricht ab ("Could not find an installed version of
    Gradle"). Der Wrapper existiert aber bereits und zeigt auf die lokale Gradle-
    Distribution. Daher wird hier gradlew direkt aufgerufen.

.PARAMETER Release
    Baut assembleRelease statt assembleDebug (unsigniert -> muss separat signiert werden).

.PARAMETER SkipPrepare
    Ueberspringt "cordova prepare android" (kein erneutes Kopieren von www/).

.PARAMETER Clean
    Fuehrt vor dem Build "gradlew clean" aus.

.EXAMPLE
    .\build-android.ps1
    .\build-android.ps1 -Release
    .\build-android.ps1 -Clean
#>
[CmdletBinding()]
param(
    [switch]$Release,
    [switch]$SkipPrepare,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'
$ProjectDir  = $PSScriptRoot
$PlatformDir = Join-Path $ProjectDir 'platforms\android'

function Resolve-JavaHome {
    if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) { return $env:JAVA_HOME }
    $candidates = @(
        "$env:ProgramFiles\Android\Android Studio\jbr",
        "${env:ProgramFiles(x86)}\Android\Android Studio\jbr",
        "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
    )
    foreach ($c in $candidates) { if (Test-Path "$c\bin\java.exe") { return $c } }
    throw "Kein JDK gefunden. Bitte JAVA_HOME setzen oder Android Studio installieren."
}

function Resolve-AndroidSdk {
    foreach ($v in @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)) {
        if ($v -and (Test-Path $v)) { return $v }
    }
    $default = "$env:LOCALAPPDATA\Android\Sdk"
    if (Test-Path $default) { return $default }
    throw "Kein Android SDK gefunden. Bitte ANDROID_HOME setzen oder SDK via Android Studio installieren."
}

# --- Umgebung einrichten ---------------------------------------------------
$env:JAVA_HOME        = Resolve-JavaHome
$env:ANDROID_HOME     = Resolve-AndroidSdk
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path             = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

Write-Host "JAVA_HOME    = $env:JAVA_HOME"     -ForegroundColor DarkGray
Write-Host "ANDROID_HOME = $env:ANDROID_HOME"  -ForegroundColor DarkGray

if (-not (Test-Path (Join-Path $PlatformDir 'gradlew.bat'))) {
    throw "Gradle-Wrapper fehlt unter $PlatformDir. Zuerst 'cordova platform add android' ausfuehren."
}

# --- www/ synchronisieren (best effort) ------------------------------------
if (-not $SkipPrepare) {
    Write-Host "`n==> cordova prepare android" -ForegroundColor Cyan
    Push-Location $ProjectDir
    try {
        cordova prepare android
        if ($LASTEXITCODE -ne 0) { Write-Warning "cordova prepare meldete Exit-Code $LASTEXITCODE - Build wird trotzdem versucht." }
    } catch {
        Write-Warning "cordova prepare fehlgeschlagen ($_). Build wird mit vorhandenem www-Stand fortgesetzt."
    } finally { Pop-Location }
}

# --- Gradle-Build ----------------------------------------------------------
$task = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }
Push-Location $PlatformDir
try {
    if ($Clean) {
        Write-Host "`n==> gradlew clean" -ForegroundColor Cyan
        & .\gradlew.bat clean --console=plain
        if ($LASTEXITCODE -ne 0) { throw "gradlew clean fehlgeschlagen (Exit $LASTEXITCODE)." }
    }
    Write-Host "`n==> gradlew $task" -ForegroundColor Cyan
    & .\gradlew.bat $task --console=plain
    if ($LASTEXITCODE -ne 0) { throw "gradlew $task fehlgeschlagen (Exit $LASTEXITCODE)." }
} finally { Pop-Location }

# --- Ergebnis melden -------------------------------------------------------
$variant = if ($Release) { 'release' } else { 'debug' }
$outDir  = Join-Path $PlatformDir "app\build\outputs\apk\$variant"
$apk     = Get-ChildItem $outDir -Filter *.apk -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

Write-Host ""
if ($apk) {
    $mb = [math]::Round($apk.Length / 1MB, 2)
    Write-Host "BUILD OK  ->  $($apk.FullName)  ($mb MB)" -ForegroundColor Green
    if ($Release -and $apk.Name -like '*unsigned*') {
        Write-Warning "Release-APK ist UNSIGNIERT. Vor der Installation/Verteilung mit apksigner signieren."
    }
} else {
    Write-Warning "Build lief durch, aber kein APK in $outDir gefunden."
}
