"""Rebuild and byte-check the installed Neon Pursuit v9 archive."""
from pathlib import Path
import hashlib, json, sys, zipfile

root=Path(__file__).resolve().parent.parent
folder=(root/'outputs/Neon-Pursuit').resolve()
archive=(root/'outputs/Neon-Pursuit.zip').resolve()
files=sorted(p for p in folder.rglob('*') if p.is_file())
assert (folder/'game.js').is_file() and files
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
    for p in files:z.write(p,'Neon-Pursuit/'+p.relative_to(folder).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist())=={'Neon-Pursuit/'+p.relative_to(folder).as_posix() for p in files}
    for p in files:assert z.read('Neon-Pursuit/'+p.relative_to(folder).as_posix())==p.read_bytes(),p
report={'version':'9.0.0','archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'files':len(files),'crcCheck':True,'allEntriesMatchInstalledBytes':True,'gameSHA256':hashlib.sha256((folder/'game.js').read_bytes()).hexdigest()}
(root/'work/zip-v9-results.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
