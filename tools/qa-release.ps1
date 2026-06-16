param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'
$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure([string]$Message) {
  $script:failures.Add($Message) | Out-Null
}

function Read-Text([string]$Path) {
  return Get-Content -LiteralPath $Path -Raw -Encoding UTF8
}

$mainFile = Join-Path $Root 'sekkei.php'
$readmeFile = Join-Path $Root 'readme.txt'
$main = ''
$headerVersion = ''

if (!(Test-Path -LiteralPath $mainFile)) { Add-Failure 'Missing sekkei.php' }
if (!(Test-Path -LiteralPath $readmeFile)) { Add-Failure 'Missing readme.txt' }

if (Test-Path -LiteralPath $mainFile) {
  $main = Read-Text $mainFile
  if ($main -notmatch 'Version:\s*([0-9]+\.[0-9]+\.[0-9]+)') {
    Add-Failure 'Plugin header version not found.'
  } else {
    $headerVersion = $Matches[1]
    if ($main -notmatch "ITSPC_VERSION',\s*'$([regex]::Escape($headerVersion))'") {
      Add-Failure "ITSPC_VERSION does not match plugin header version $headerVersion."
    }
  }
}

if ((Test-Path -LiteralPath $readmeFile) -and $headerVersion) {
  $readme = Read-Text $readmeFile
  if ($readme -match 'Stable tag:\s*([0-9]+\.[0-9]+\.[0-9]+)') {
    if ($Matches[1] -ne $headerVersion) {
      Add-Failure "readme Stable tag does not match plugin version $headerVersion."
    }
  } else {
    Add-Failure 'readme Stable tag not found.'
  }
}

$zips = Get-ChildItem -LiteralPath $Root -Recurse -File -Filter '*.zip' |
  Where-Object { $_.FullName -notmatch '\\.git\\' }
if ($zips.Count) {
  Add-Failure ('Zip artifact found in plugin source: ' + (($zips | ForEach-Object { $_.Name }) -join ', '))
}

$scanExt = @('.php', '.js', '.css', '.html', '.txt', '.md')
$scanFiles = Get-ChildItem -LiteralPath $Root -Recurse -File |
  Where-Object {
    $_.FullName -notmatch '\\.git\\' -and
    $_.FullName -notmatch '\\tools\\qa-release\.ps1$' -and
    $scanExt -contains $_.Extension.ToLowerInvariant()
  }

$forbidden = @(
  'pagecraft',
  'thereadscope',
  ([string][char]0x00E2),
  ([string][char]0x00F0),
  ([string][char]0x00C3),
  ([string][char]0x00C2)
)
foreach ($file in $scanFiles) {
  $text = Read-Text $file.FullName
  foreach ($needle in $forbidden) {
    if ($text.IndexOf($needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
      Add-Failure ("Forbidden text '$needle' found in " + $file.FullName.Substring($Root.Length + 1))
    }
  }
}

if ($failures.Count) {
  Write-Host 'Sekkei release QA failed:' -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host (' - ' + $failure) -ForegroundColor Red
  }
  exit 1
}

Write-Host 'Sekkei release QA passed.' -ForegroundColor Green
