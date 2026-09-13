"""Build and byte-verify a fresh candidate/ZIP/extraction; never install."""
from pathlib import Path
import json, runpy, shutil, zipfile
H=runpy.run_path(str(Path(__file__).with_name('assemble-v9.py')))
ROOT=H['ROOT'];WORK=H['WORK'];require=H['require'];read=H['read'];sha=H['sha'];inventory=H['inventory'];validate=H['validate_manifest'];atomic_json=H['atomic_json']

def main():
    release=WORK/'release-v9';candidate=WORK/'install-v9-candidate';archive=WORK/'Neon-Pursuit-v9-candidate.zip';extract=WORK/'preflight-v9-extract';ready_path=WORK/'install-v9-ready.json';installed=ROOT/'outputs/Neon-Pursuit';old_zip=ROOT/'outputs/Neon-Pursuit.zip'
    for p in [release,candidate,archive,extract,ready_path,installed,old_zip]:H['contained'](p)
    require(all(not p.exists() for p in [candidate,archive,extract,ready_path]),'Candidate/archive/extraction/ready evidence already exists')
    require((release/'VERIFICATION.md').is_file(),'Write final staged v9 verification narrative before candidate preparation')
    frozen=read(release/'verification/v9-source-freeze.json');require(frozen['gameSHA256']==sha(release/'game.js'),'Release bundle differs from frozen QA bundle')
    # Assembly is immutable except for the explicitly subsequent verification file.
    prior=read(release/'BUILD-MANIFEST.json');current=inventory(release);current.pop('BUILD-MANIFEST.json',None)
    require(prior.get('version')=='9.0.0','Wrong release version')
    for rel,meta in prior['files'].items():require(current.get(rel)==meta,'Assembled release was changed: '+rel)
    require(set(current)-set(prior['files'])<={'VERIFICATION.md'},'Unreviewed files added after assembly')
    H['write_manifest'](release);validate(release)
    require(read(installed/'PACKAGE-INFO.json').get('version')=='8.0.0','Expected verified v8 install is missing')
    validate(installed,'8.0.0');require(old_zip.is_file(),'Preserved v8 ZIP missing')
    require(sha(installed/'game.js')==frozen['installedV8GameSHA256'],'Installed v8 changed since matching baseline')
    shutil.copytree(release,candidate);validate(candidate)
    files=inventory(candidate)
    with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED,compresslevel=7) as z:
        for rel in sorted(files):z.write(candidate/rel,'Neon-Pursuit/'+rel)
    with zipfile.ZipFile(archive) as z:
        require(z.testzip() is None,'Candidate ZIP CRC check failed')
        require(set(z.namelist())=={'Neon-Pursuit/'+rel for rel in files} and len(z.namelist())==len(files),'Candidate ZIP entry set differs')
        for rel in files:require(z.read('Neon-Pursuit/'+rel)==(candidate/rel).read_bytes(),'ZIP bytes differ: '+rel)
        extract.mkdir()
        for name in z.namelist():H['contained'](extract/name,extract)
        z.extractall(extract)
    validate(extract/'Neon-Pursuit');require(inventory(extract/'Neon-Pursuit')==files,'Extracted candidate differs')
    ready={'version':'9.0.0','candidate':str(candidate),'archive':str(archive),'extract':str(extract/'Neon-Pursuit'),'gameSHA256':sha(candidate/'game.js'),'manifestSHA256':sha(candidate/'BUILD-MANIFEST.json'),'archiveSHA256':sha(archive),'files':len(files),'archiveBytes':archive.stat().st_size,'allEntriesMatch':True,'crcCheck':True,'previousVersion':'8.0.0','previousGameSHA256':sha(installed/'game.js'),'previousManifestSHA256':sha(installed/'BUILD-MANIFEST.json'),'previousArchiveSHA256':sha(old_zip)}
    atomic_json(ready_path,ready);print(json.dumps(ready,indent=2))

if __name__=='__main__':main()
