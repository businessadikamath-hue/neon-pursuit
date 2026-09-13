$ErrorActionPreference = 'Stop'
$browserPath = @('C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe','C:\Program Files\Microsoft\Edge\Application\msedge.exe','C:\Program Files\Google\Chrome\Application\chrome.exe') | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
$gameUri = [Uri]::new((Join-Path $PSScriptRoot 'index.html')).AbsoluteUri
if ($browserPath) { Start-Process -FilePath $browserPath -ArgumentList ('--app="' + $gameUri + '" --window-size=1440,900 --new-window') }
else { Start-Process -FilePath (Join-Path $PSScriptRoot 'index.html') }
