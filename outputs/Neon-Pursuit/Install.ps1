$ErrorActionPreference = 'Stop'
$gameDir = $PSScriptRoot
$edgePaths = @('C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe','C:\Program Files\Microsoft\Edge\Application\msedge.exe','C:\Program Files\Google\Chrome\Application\chrome.exe')
$browserPath = $edgePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!$browserPath) { throw 'Microsoft Edge or Google Chrome is required for app-window launch. You can still open index.html in your browser.' }
$menuPath = Join-Path ([Environment]::GetFolderPath('Programs')) 'Neon Pursuit.lnk'
$shellObject = New-Object -ComObject WScript.Shell
$shortcut = $shellObject.CreateShortcut($menuPath)
$shortcut.TargetPath = $browserPath
$gameUri = [Uri]::new((Join-Path $gameDir 'index.html')).AbsoluteUri
$shortcut.Arguments = '--app="' + $gameUri + '" --window-size=1440,900 --new-window'
$shortcut.WorkingDirectory = $gameDir
$shortcut.IconLocation = Join-Path $gameDir 'Neon-Pursuit.ico'
$shortcut.Description = 'Neon Pursuit — eight-car, four-world driving'
$shortcut.Save()
Write-Output "Installed Start Menu shortcut: $menuPath"
Write-Output 'Open Start and search Neon Pursuit to play.'
