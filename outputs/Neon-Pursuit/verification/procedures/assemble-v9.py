"""Prepare v9 release only. --freeze records inputs; neither mode installs.
Run --freeze after component/source completion, then final game QA, then this
script without arguments. Failed builds remain in release-v9-building for review.
Other v9 packaging scripts load the utility functions with runpy; main is guarded.
"""
from pathlib import Path, PurePosixPath
import datetime, hashlib, html, json, os, re, shutil, sys

ROOT=Path(__file__).resolve().parent.parent
WORK=ROOT/'work'; STAGE=WORK/'stage-v9'; RELEASE=WORK/'release-v9'
VERSION='9.0.0'
ASSETS={'cars':'car-assets-v9','scenery':'scenery-assets-v9','wildlife':'wildlife-assets-v9'}

def require(ok,message):
    if not ok:raise RuntimeError(message)
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def contained(p,base=ROOT):
    p=Path(p).resolve();require(p!=Path(base).resolve() and p.is_relative_to(Path(base).resolve()),'Path outside expected directory: '+str(p));return p
def atomic_json(p,value):
    p=contained(p);tmp=p.with_name(p.name+'.tmp');require(not tmp.exists(),'Temporary evidence already exists: '+str(tmp));tmp.parent.mkdir(parents=True,exist_ok=True)
    tmp.write_text(json.dumps(value,indent=2),encoding='utf-8');os.replace(tmp,p)
def inventory(folder):
    folder=Path(folder);result={};seen=set()
    for p in sorted(folder.rglob('*')):
        require(not p.is_symlink(),'Symbolic link not permitted in package: '+str(p))
        if not p.is_file():continue
        contained(p,folder);rel=p.relative_to(folder).as_posix();require(rel.casefold() not in seen,'Case-colliding package path: '+rel);seen.add(rel.casefold())
        result[rel]={'bytes':p.stat().st_size,'sha256':sha(p)}
    return result
def write_manifest(folder):
    files=inventory(folder);files.pop('BUILD-MANIFEST.json',None)
    atomic_json(Path(folder)/'BUILD-MANIFEST.json',{'version':VERSION,'files':files});return files
def validate_manifest(folder,version=VERSION):
    folder=Path(folder);m=read(folder/'BUILD-MANIFEST.json');require(m.get('version')==version,'Wrong manifest version')
    files=m.get('files');require(isinstance(files,dict) and files,'Empty manifest')
    for rel,meta in files.items():
        require(not '\\' in rel and not PurePosixPath(rel).is_absolute() and '..' not in PurePosixPath(rel).parts,'Unsafe manifest path: '+rel)
        contained(folder/rel,folder);require(isinstance(meta.get('bytes'),int) and meta['bytes']>=0 and re.fullmatch('[0-9a-f]{64}',meta.get('sha256','')),'Invalid manifest metadata: '+rel)
    actual=inventory(folder);actual.pop('BUILD-MANIFEST.json',None);require(actual==files,'Manifest file set or bytes changed: '+str(folder));return files
def validate_smoke(rows,folders,game_hash):
    require(isinstance(rows,list) and len(rows)==2,'Expected exactly two independent package smoke results')
    actual=[str(Path(r.get('folder','')).resolve()).casefold() for r in rows]
    wanted=[str(Path(p).resolve()).casefold() for p in folders]
    require(len(set(actual))==2 and set(actual)==set(wanted),'Smoke folders do not match the installed/candidate and independently extracted copies')
    for r in rows:
        require(r.get('version')==VERSION and r.get('gameSHA256')==game_hash and r.get('ultra',{}).get('quality')=='Ultra+' and r.get('errors')==[] and r.get('external')==[],'Package smoke did not pass exact bundle/offline/Ultra+ checks')
def accepted_asset(p):
    name=p.name.lower()
    return p.is_file() and not any(x in name for x in ['checkpoint','.blend1','failure','failed','intermediate','root-preview']) and not any(x in {'node_modules','__pycache__'} for x in p.parts) and (p.suffix.lower() in {'.blend','.json','.py','.mjs','.cjs','.js','.md','.png','.jpg','.html'} or name.endswith('.json.gz'))
def frozen_inputs():
    paths=list((WORK/'engine-v9').glob('*.js'))+[WORK/'engine-v9/package.json']+[STAGE/n for n in ['index.html','style.css','game.js']]
    paths.extend(p for p in (STAGE/'photographic').rglob('*') if p.is_file())
    paths+=list((STAGE/'audio').rglob('*'))
    for folder in ASSETS.values():paths.extend(p for p in (WORK/folder).rglob('*') if accepted_asset(p))
    result={}
    for p in sorted(set(paths)):
        if not p.is_file():continue
        contained(p);result[p.relative_to(ROOT).as_posix()]={'bytes':p.stat().st_size,'sha256':sha(p)}
    require('work/engine-v9/vehicleCanopyV9.js' in result,'New canopy module missing')
    require(len(list((STAGE/'audio').glob('*.mp3')))>=4,'Four local nature recordings required')
    return result
def component_checks():
    for rel,key in [('car-assets-v9/ultraplus-validation.json','pass'),('car-assets-v9/body-validation-report.json','pass'),('car-assets-v9/canopy-validation.json','passed'),('car-assets-v9/gallery/browser-report.json','passed'),('car-assets-v9/baseline-reproduction.json','passed'),('scenery-assets-v9/data-validation.json','passed'),('scenery-assets-v9/component-validation.json','passed'),('wildlife-assets-v9/detail-qa.json','passed'),('wildlife-assets-v9/morphology-qa.json','passed'),('wildlife-assets-v9/browser-qa.json','passed')]:
        require(read(WORK/rel).get(key) is True,'Final component report did not pass: '+rel)
    require(all(r.get('passes') is True for r in read(WORK/'car-assets-v9/gallery/batching-pixel-report.json')),'Car batching fidelity failed')
    for group in ASSETS.values():require(any((WORK/group).glob('*.blend')),'Original Blender source missing: '+group)
def freeze():
    component_checks();require(not (WORK/'v9-source-freeze.json').exists(),'Source freeze already exists; retain/review it before creating another')
    value={'version':VERSION,'sourceStable':True,'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'gameSHA256':sha(STAGE/'game.js'),'installedV8GameSHA256':sha(ROOT/'outputs/Neon-Pursuit/game.js'),'files':frozen_inputs()}
    atomic_json(WORK/'v9-source-freeze.json',value);print(json.dumps({'freezeOnly':True,'files':len(value['files']),'gameSHA256':value['gameSHA256']}))
def validate_final_inputs():
    component_checks();f=read(WORK/'v9-source-freeze.json');game_hash=sha(STAGE/'game.js')
    require(f.get('version')==VERSION and f.get('sourceStable') and f.get('gameSHA256')==game_hash and f.get('files')==frozen_inputs(),'Inputs changed after v9 source freeze')
    for name in ['EXTRA-V9-QA.json','LIFECYCLE-V9-QA.json','INTEGRATED-AUDIO-V9-QA.json']:
        r=read(STAGE/name);require(r.get('passed') is True and r.get('gameSHA256')==game_hash and r.get('errors')==[] and r.get('external')==[],'Final bundle QA missing/stale: '+name)
    driving=read(STAGE/'DRIVING-V9-QA.json');require(driving.get('gameSHA256')==game_hash and len(driving.get('cars',[]))==8 and driving.get('persisted') and driving.get('errors')==[] and driving.get('external')==[],'Driving report incomplete/stale')
    physics=read(STAGE/'FAST-DRIVE-V9.json');require(physics.get('passed') is True and len(physics.get('cars',[]))==8 and physics.get('vehiclePhysicsSHA256')==sha(WORK/'engine-v9/vehiclePhysics.js'),'Powertrain report incomplete/stale')
    matrix=read(WORK/'qa-v9-matrix.json');require(matrix.get('passed') is True,'UI matrix failed')
    for name in ['index.html','style.css','game.js']:require(matrix['files'][name]['sha256']==sha(STAGE/name),'Matrix does not match '+name)
    perf=read(WORK/'efficiency-v9/sustained-report.json');require(perf.get('passed') is True and perf.get('bundleUnchanged') is True and perf.get('gameSha256')==game_hash and perf.get('finalGameSha256')==game_hash and perf.get('browserClosed') is True,'Sustained report incomplete/stale')
    before=read(WORK/'graphics-v9/before/report.json');after=read(WORK/'graphics-v9/after/report.json')
    for label,r,h in [('before',before,f['installedV8GameSHA256']),('after',after,game_hash)]:require(r.get('passed') is True and r.get('browserClosed') is True and r.get('gameSHA256')==h and r.get('errors')==[] and r.get('external')==[],'Matched graphics report incomplete/stale: '+label)
    key=lambda r:(r['biome'],r['quality'],r['name']);b={key(r):r for r in before['cases']};a={key(r):r for r in after['cases']}
    require(set(a)==set(b) and len(a)>=16,'Full-game matched case set differs')
    for k in a:require(a[k]['view']==b[k]['view'],'Full-game cameras differ: '+str(k))
    return f
def copy(src,dst):
    require(Path(src).is_file(),'Required release file missing: '+str(src));contained(src);contained(dst);Path(dst).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
def gallery_page(folder):
    cards=[]
    for p in sorted(folder.rglob('*.png')):
        rel=p.relative_to(folder).as_posix()
        if not (rel.startswith('gallery/') or rel.startswith('assets-source/')):continue
        if any(x in p.name.lower() for x in ['unbatched','failure','failed','intermediate','root-preview']):continue
        if '/retained-v8/' in rel:kind='Retained original v8 component proof; unchanged asset, not a new v9 rendering'
        elif '/matched/before/' in rel:kind='Matched installed v8 baseline — actual game renderer'
        elif '/matched/after/' in rel:kind='Matched v9 candidate — actual game renderer'
        elif 'blender' in p.name or 'assembled' in p.name:kind='Original Blender component study — not an in-game screenshot or photograph'
        else:kind='Runtime/component verification capture; filename identifies before/after and view'
        url=html.escape(rel,quote=True);cards.append(f'<figure><a href="{url}"><img loading="lazy" src="{url}" alt="{html.escape(p.stem)}"></a><figcaption>{html.escape(p.stem)}<small>{kind}</small></figcaption></figure>')
    (folder/'GALLERY.html').write_text('<!doctype html><meta charset="utf-8"><title>Neon Pursuit v9 gallery</title><style>body{margin:32px;background:#111a20;color:#e4edf0;font:16px system-ui}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:24px}figure{margin:0}img{width:100%;display:block}small{display:block;color:#a0b3bd}</style><h1>Neon Pursuit · v9</h1><p>Actual game captures and original component studies, labeled separately. These procedural assets do not claim photographic or manufacturer-exact fidelity.</p><main>'+''.join(cards)+'</main>',encoding='utf-8')
def assemble():
    frozen=validate_final_inputs();building=WORK/'release-v9-building'
    require(not RELEASE.exists() and not building.exists(),'Refusing to mix with an existing release/build directory')
    for name in ['README.md','FAST-DRIVE.md','AUDIO-SOURCES.md','REAL-CAR-SPECS.md']:require((STAGE/name).is_file(),'Final version-9 document missing: '+name)
    building.mkdir()
    for name in ['index.html','style.css','game.js','Launch.cmd','Launch.ps1','Install.cmd','Install.ps1','Neon-Pursuit.ico','THREE-LICENSE.txt','README.md','FAST-DRIVE.md','AUDIO-SOURCES.md','REAL-CAR-SPECS.md']:copy(STAGE/name,building/name)
    for p in (STAGE/'audio').rglob('*'):
        if p.is_file():copy(p,building/'audio'/p.relative_to(STAGE/'audio'))
    for p in (STAGE/'photographic').rglob('*'):
        if p.is_file():copy(p,building/'photographic'/p.relative_to(STAGE/'photographic'))
    for p in (WORK/'engine-v9').glob('*.js'):copy(p,building/'source'/p.name)
    copy(WORK/'engine-v9/package.json',building/'source/package.json')
    require(read(building/'source/package.json').get('version')==VERSION,'Source package version is not v9')
    for dest,folder in ASSETS.items():
        source=WORK/folder
        for p in source.rglob('*'):
            if accepted_asset(p):copy(p,building/'assets-source'/dest/p.relative_to(source))
    retained={'cars':['build_hero_details.py','neon-ultraplus-parts.blend','blender-ultraplus-wheel.png','hero-parts-report.json'],'scenery':['original-scenery-v8.blend','scenery-blender8.py','original-ultra-scenery-v8.blend','generate-ultra-scenery.py','ultra-blender-report.json'],'wildlife':['original-wildlife-components-v8.blend','wildlife-blender8.py']}
    for group,names in retained.items():
        for name in names:
            if not (building/'assets-source'/group/name).exists():
                fallback=ROOT/'outputs/Neon-Pursuit/assets-source'/group/name
                if not fallback.is_file():fallback=ROOT/'outputs/Neon-Pursuit/assets-source'/'retained-v8'/group/name
                copy(fallback,building/'assets-source/retained-v8'/group/name)
    (building/'assets-source/README.md').write_text('''# Original source and provenance

cars/, scenery/, wildlife/ contain the final original v9 Blender sources, generators, component comparisons and reports. Runtime source is in ../source/. The source manifest records the original workspace hashes; these files are copied without path rewriting.

retained-v8/ contains only explicitly named unchanged original components needed by v9 (wheel proof, base/Ultra+ scenery projects and base wildlife projects). It is not a copy of the v8 runtime or its full verification archive. Captions label retained evidence as v8.

Generation and QA scripts are preserved research/development procedures. They retain recorded Windows workspace paths and imports; adjust those paths to this package's source/ and asset folders before rerunning. They are not portable launchers and are not required to play. The editable .blend files can be opened directly in Blender. To rebuild runtime, use the pinned packages in source/package.json. No tool installation is performed by the game.

Runtime includes local Poly Haven CC0 PBR scans and an original generated feather texture alongside authored procedural geometry and recordings. No manufacturer CAD, game models, scans of vehicles or animals, or logos were copied. Reference vehicle names label original approximations. Blender preview materials differ from runtime materials; no photographic/Forza-equivalence claim is made.
''',encoding='utf-8')
    copy(WORK/'generate-long-ambience.py',building/'assets-source/retained-audio/generate-long-ambience.py')
    (building/'assets-source/retained-audio/README.md').write_text('The unchanged original four 660-second recordings are retained from v8. This procedural generator retains its recorded workspace output path; adjust it before rerunning. No downloaded recording is an input.\n',encoding='utf-8')
    for name in ['DRIVING-V9-QA.json','EXTRA-V9-QA.json','LIFECYCLE-V9-QA.json','INTEGRATED-AUDIO-V9-QA.json','FAST-DRIVE-V9.json']:copy(STAGE/name,building/'verification'/name)
    copy(WORK/'v9-source-freeze.json',building/'verification/v9-source-freeze.json');copy(WORK/'qa-v9-matrix.json',building/'verification/qa-v9-matrix.json')
    for p in (WORK/'efficiency-v9').glob('*'):
        if p.is_file() and p.suffix.lower() in {'.json','.md','.png'} and 'fail' not in p.name.lower():copy(p,building/'verification/performance'/p.name)
    for label in ['before','after']:
        for p in (WORK/'graphics-v9'/label).glob('*'):
            if p.is_file() and p.suffix.lower() in {'.json','.png','.md'}:copy(p,building/'gallery/matched'/label/p.name)
    for p in WORK.glob('qa-v9-*.png'):copy(p,building/'gallery/game-qa'/p.name)
    for name in ['edge-impact.png','crash-observable.png','police-ram-side.png']:
        if (STAGE/name).is_file():copy(STAGE/name,building/'gallery/game-qa'/name)
    for pattern in ['qa-v9-*.cjs','qa-v9-*.mjs','capture-v9-matched.cjs','package-v9-smoke.cjs','*v9*VERIFICATION.md']:
        for p in WORK.glob(pattern):copy(p,building/'verification/procedures'/p.name)
    for name in ['assemble-v9.py','prepare-v9-install.py','install-v9.ps1','zip-v9.py','finalize-v9-package.py','write-v9-verification.py']:copy(WORK/name,building/'verification/procedures'/name)
    (building/'verification/procedures/README.md').write_text('Recorded workspace verification/delivery procedures. Adjust paths before reuse; these are not user-facing game launchers. Read the script sequence in assemble-v9.py and the final delivery records.\n',encoding='utf-8')
    gallery_page(building);write_manifest(building);validate_manifest(building)
    require(frozen['files']==frozen_inputs(),'Source changed while assembling')
    require(not RELEASE.exists(),'Release appeared during assembly');building.rename(RELEASE)
    print(json.dumps({'release':str(RELEASE),'version':VERSION,'gameSHA256':frozen['gameSHA256'],'files':len(inventory(RELEASE)),'installed':False},indent=2))

if __name__=='__main__':
    require(sys.argv[1:] in [[],['--freeze']],'Usage: assemble-v9.py [--freeze]')
    freeze() if '--freeze' in sys.argv else assemble()
