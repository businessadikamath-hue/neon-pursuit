# Run only after candidate and separately extracted candidate UI smoke checks.
# This keeps the existing shortcut and preserves the full verified v8 folder/ZIP.
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$workspacePath=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputsPath=Join-Path $workspacePath 'outputs'
$candidatePath=Join-Path $PSScriptRoot 'install-v9-candidate'
$candidateZipPath=Join-Path $PSScriptRoot 'Neon-Pursuit-v9-candidate.zip'
$extractPath=Join-Path $PSScriptRoot 'preflight-v9-extract\Neon-Pursuit'
$installedPath=Join-Path $outputsPath 'Neon-Pursuit'
$backupPath=Join-Path $outputsPath 'Neon-Pursuit-before-v9'
$currentZipPath=Join-Path $outputsPath 'Neon-Pursuit.zip'
$backupZipPath=Join-Path $outputsPath 'Neon-Pursuit-before-v9.zip'
$failedPath=Join-Path $PSScriptRoot 'install-v9-failed'
$failedZipPath=Join-Path $PSScriptRoot 'install-v9-failed.zip'
$resultPath=Join-Path $PSScriptRoot 'install-v9-results.json'
$failureRecordPath=Join-Path $PSScriptRoot 'install-v9-failure.json'
function Same-Path([string]$Left,[string]$Right){return [IO.Path]::GetFullPath($Left).Equals([IO.Path]::GetFullPath($Right),[StringComparison]::OrdinalIgnoreCase)}
function File-SHA([string]$Path){return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()}
foreach($targetPath in @($candidatePath,$candidateZipPath,$extractPath,$installedPath,$backupPath,$currentZipPath,$backupZipPath,$failedPath,$failedZipPath,$resultPath,$failureRecordPath)){
 $resolvedPath=[IO.Path]::GetFullPath($targetPath)
 if(!$resolvedPath.StartsWith($workspacePath+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw "Path outside named workspace: $resolvedPath"}
}
foreach($targetPath in @($installedPath,$backupPath,$currentZipPath,$backupZipPath)){
 if(!(Same-Path ([IO.Path]::GetDirectoryName($targetPath)) $outputsPath)){throw 'Unexpected installation parent'}
}
foreach($targetPath in @($backupPath,$backupZipPath,$failedPath,$failedZipPath,$resultPath,$failureRecordPath,($resultPath+'.tmp'))){if(Test-Path -LiteralPath $targetPath){throw "Refusing to overwrite prior backup or evidence: $targetPath"}}
function Test-Inventory([string]$Folder,[string]$Version){
 $manifestPath=Join-Path $Folder 'BUILD-MANIFEST.json'
 $manifest=Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
 if($manifest.version -ne $Version){throw 'Wrong manifest version'}
 $allowed=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
 [void]$allowed.Add('BUILD-MANIFEST.json')
 foreach($entry in $manifest.files.PSObject.Properties){
  if($entry.Name.Contains('\') -or $entry.Name.Split('/') -contains '..' -or [IO.Path]::IsPathRooted($entry.Name)){throw 'Unsafe manifest path'}
  $filePath=[IO.Path]::GetFullPath((Join-Path $Folder $entry.Name))
  if(!$filePath.StartsWith($Folder+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Manifest escapes package'}
  if(!$allowed.Add($entry.Name)){throw 'Duplicate manifest path'}
  $info=Get-Item -Force -LiteralPath $filePath
  if($info.PSIsContainer -or ($info.Attributes -band [IO.FileAttributes]::ReparsePoint) -or $info.Length -ne $entry.Value.bytes -or (File-SHA $filePath) -ne $entry.Value.sha256){throw "Package file mismatch: $filePath"}
 }
 $count=0
 foreach($item in Get-ChildItem -Force -Recurse -LiteralPath $Folder){
  if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){throw "Package reparse point rejected: $($item.FullName)"}
  if(!$item.PSIsContainer){$count++;$relative=$item.FullName.Substring($Folder.Length+1).Replace('\','/');if(!$allowed.Contains($relative)){throw "Unmanifested file: $relative"}}
 }
 if($count -ne $allowed.Count){throw 'Package file count mismatch'}
 return $count
}
$ready=Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'install-v9-ready.json') | ConvertFrom-Json
$smoke=@(Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'package-v9-preinstall-results.json') | ConvertFrom-Json | ForEach-Object {$_})
if($ready.version -ne '9.0.0' -or $ready.previousVersion -ne '8.0.0' -or !$ready.allEntriesMatch -or !$ready.crcCheck -or $smoke.Count -ne 2){throw 'Candidate verification incomplete'}
if(!(Same-Path $ready.candidate $candidatePath) -or !(Same-Path $ready.archive $candidateZipPath) -or !(Same-Path $ready.extract $extractPath)){throw 'Ready-record target mismatch'}
$smokeFolders=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach($result in $smoke){
 if($result.gameSHA256 -ne $ready.gameSHA256 -or $result.version -ne '9.0.0' -or @($result.errors).Count -ne 0 -or @($result.external).Count -ne 0 -or $result.ultra.quality -ne 'Ultra+'){throw 'Candidate offline/Ultra+ smoke failed'}
 [void]$smokeFolders.Add([IO.Path]::GetFullPath($result.folder))
}
if($smokeFolders.Count -ne 2 -or !$smokeFolders.Contains($candidatePath) -or !$smokeFolders.Contains($extractPath)){throw 'Smoke did not cover the exact candidate and independent extraction'}
if((File-SHA $candidateZipPath) -ne $ready.archiveSHA256 -or (File-SHA (Join-Path $candidatePath 'BUILD-MANIFEST.json')) -ne $ready.manifestSHA256){throw 'Candidate archive or manifest changed'}
$candidateFiles=Test-Inventory $candidatePath '9.0.0'
if($candidateFiles -ne $ready.files -or (File-SHA (Join-Path $candidatePath 'game.js')) -ne $ready.gameSHA256){throw 'Candidate bundle/file count differs'}
[void](Test-Inventory $extractPath '9.0.0')
if((File-SHA (Join-Path $extractPath 'BUILD-MANIFEST.json')) -ne $ready.manifestSHA256){throw 'Extracted manifest changed after smoke'}
if((Get-Content -Raw -LiteralPath (Join-Path $installedPath 'PACKAGE-INFO.json') | ConvertFrom-Json).version -ne '8.0.0'){throw 'Expected preserved v8 installation missing'}
[void](Test-Inventory $installedPath '8.0.0')
if((File-SHA (Join-Path $installedPath 'game.js')) -ne $ready.previousGameSHA256 -or (File-SHA (Join-Path $installedPath 'BUILD-MANIFEST.json')) -ne $ready.previousManifestSHA256 -or (File-SHA $currentZipPath) -ne $ready.previousArchiveSHA256){throw 'Verified v8 changed since preflight'}
# Reading the existing shortcut never calls Save or writes outside the workspace.
$shortcutPath=Join-Path ([Environment]::GetFolderPath('Programs')) 'Neon Pursuit.lnk'
if(!(Test-Path -LiteralPath $shortcutPath)){throw 'Existing Start Menu shortcut missing'}
$shellObject=New-Object -ComObject WScript.Shell
$shortcut=$shellObject.CreateShortcut($shortcutPath)
$uri=[Uri]::new((Join-Path $installedPath 'index.html')).AbsoluteUri
if(!$shortcut.Arguments.Contains($uri) -or !(Same-Path $shortcut.WorkingDirectory $installedPath) -or !(Test-Path -LiteralPath $shortcut.TargetPath)){throw 'Shortcut does not target the stable installed path'}
$oldFolderMoved=$false;$oldZipMoved=$false;$newFolderMoved=$false;$newZipMoved=$false
try{
 Move-Item -LiteralPath $installedPath -Destination $backupPath
 $oldFolderMoved=$true
 Move-Item -LiteralPath $currentZipPath -Destination $backupZipPath
 $oldZipMoved=$true
 Move-Item -LiteralPath $candidatePath -Destination $installedPath
 $newFolderMoved=$true
 Move-Item -LiteralPath $candidateZipPath -Destination $currentZipPath
 $newZipMoved=$true
 [void](Test-Inventory $installedPath '9.0.0')
 if((File-SHA (Join-Path $installedPath 'game.js')) -ne $ready.gameSHA256 -or (File-SHA $currentZipPath) -ne $ready.archiveSHA256){throw 'Installed readback mismatch'}
 if((File-SHA (Join-Path $backupPath 'game.js')) -ne $ready.previousGameSHA256 -or (File-SHA $backupZipPath) -ne $ready.previousArchiveSHA256){throw 'Preserved v8 backup readback mismatch'}
 $record=[ordered]@{version='9.0.0';installed=$installedPath;backup=$backupPath;backupZip=$backupZipPath;previousVersion='8.0.0';previousGameSHA256=$ready.previousGameSHA256;previousArchiveSHA256=$ready.previousArchiveSHA256;gameSHA256=$ready.gameSHA256;archiveSHA256=$ready.archiveSHA256;shortcut=$shortcutPath;target=$shortcut.TargetPath;arguments=$shortcut.Arguments;workingDirectory=$shortcut.WorkingDirectory;allManifestFilesVerified=$true;candidateSmokeVerified=$true;verifiedAt=[DateTime]::UtcNow.ToString('o')}
 $record | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath ($resultPath+'.tmp')
 Move-Item -LiteralPath ($resultPath+'.tmp') -Destination $resultPath
}catch{
 $installError=$_.ToString();$rollbackErrors=[Collections.Generic.List[string]]::new()
 # Attempt every independent restoration even if an earlier move is blocked.
 if($newFolderMoved){try{Move-Item -LiteralPath $installedPath -Destination $failedPath}catch{$rollbackErrors.Add($_.ToString())}}
 if($newZipMoved){try{Move-Item -LiteralPath $currentZipPath -Destination $failedZipPath}catch{$rollbackErrors.Add($_.ToString())}}
 if($oldFolderMoved){try{if(Test-Path -LiteralPath $installedPath){throw 'Cannot restore v8 folder over occupied destination'};Move-Item -LiteralPath $backupPath -Destination $installedPath}catch{$rollbackErrors.Add($_.ToString())}}
 if($oldZipMoved){try{if(Test-Path -LiteralPath $currentZipPath){throw 'Cannot restore v8 ZIP over occupied destination'};Move-Item -LiteralPath $backupZipPath -Destination $currentZipPath}catch{$rollbackErrors.Add($_.ToString())}}
 try{[ordered]@{error=$installError;rollbackErrors=@($rollbackErrors);backup=$backupPath;backupZip=$backupZipPath;failed=$failedPath;failedZip=$failedZipPath;recordedAt=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 -LiteralPath $failureRecordPath}catch{$rollbackErrors.Add($_.ToString())}
 throw "v9 installation failed: $installError. Rollback errors: $($rollbackErrors -join ' | '). Preserved backup paths: $backupPath ; $backupZipPath"
}
Write-Output 'Verified v9 folder and ZIP installed; previous v8 folder and ZIP preserved. Existing shortcut read back without modification.'
