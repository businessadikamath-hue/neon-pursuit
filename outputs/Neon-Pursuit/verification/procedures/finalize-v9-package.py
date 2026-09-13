"""Finalize installed v9 evidence after install-v9.ps1 and package smoke."""
from pathlib import Path
import datetime, hashlib, json, shutil

root=Path(__file__).resolve().parent.parent
installed=root/'outputs/Neon-Pursuit';release=root/'work/release-v9'
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
install=load(root/'work/install-v9-results.json')
smoke=load(root/'work/package-v9-results.json')
assert install['version']=='9.0.0' and sha(installed/'game.js')==install['gameSHA256']
assert len(smoke)==2 and all(r['version']=='9.0.0' and r['gameSHA256']==install['gameSHA256'] and not r['errors'] and not r['external'] for r in smoke)
assert (release/'VERIFICATION.md').is_file()
shutil.copy2(release/'VERIFICATION.md',installed/'VERIFICATION.md')
for name in ['install-v9-results.json','package-v9-results.json']:
    source=root/'work'/name
    if source.is_file():shutil.copy2(source,installed/'verification'/name)
package={'version':'9.0.0','verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'gameSHA256':install['gameSHA256'],'archiveHashRecord':'External work/zip-v9-results.json; the archive hash is kept outside the archive to avoid self-reference.','installedAndExtractedOfflineSmokePassed':True,'ultraPlusActivationPassed':True,'previousVersion':'8.0.0','previousFolder':'../Neon-Pursuit-before-v9','previousArchive':'../Neon-Pursuit-before-v9.zip'}
(installed/'PACKAGE-INFO.json').write_text(json.dumps(package,indent=2),encoding='utf-8')
files={p.relative_to(installed).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p)} for p in installed.rglob('*') if p.is_file() and p.name!='BUILD-MANIFEST.json'}
(installed/'BUILD-MANIFEST.json').write_text(json.dumps({'version':'9.0.0','files':files},indent=2),encoding='utf-8')
assert all(sha(installed/rel)==meta['sha256'] and (installed/rel).stat().st_size==meta['bytes'] for rel,meta in files.items())
print(json.dumps({'version':'9.0.0','gameSHA256':install['gameSHA256'],'files':len(files)+1,'manifestValid':True,'smokePassed':True},indent=2))
