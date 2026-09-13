"""Generate original 11-minute biome soundscapes; no input audio recordings."""
import json, math, pathlib, subprocess, sys, wave, hashlib
import numpy as np
sys.path.insert(0,str(pathlib.Path(__file__).parent/'audio-tools'))
import imageio_ffmpeg

BASE=pathlib.Path(__file__).resolve().parent
OUT=BASE/'next-stage'/'audio'
OUT.mkdir(parents=True,exist_ok=True)
SR=24000
DURATION=660
N=SR*DURATION
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
DESIGNS={
 'coastline':'Long ocean swells, breaking wash and foam, low distant surf, gusting tree wind, scattered gull/tern-like calls.',
 'tundra':'Soft snow wind, narrow ice whistles, sparse ice crackles and drifting snow hiss, distant northern bird-like calls.',
 'desert':'Dry broad wind with slow gusts, sand hiss, irregular insect pulses, sparse raven/dove/hawk-like calls.',
 'jungle':'Layered rain canopy and leaf drips, low distant rain wash, insect choruses with independent pulses, tropical bird-like calls.'
}
BANK={
 'coastline':[(1100,650,.85,3),(2400,3200,.18,4),(260,175,.27,3)],
 'tundra':[(420,320,.70,2),(2900,1900,.12,5),(640,480,.19,5)],
 'desert':[(2200,1150,.75,1),(540,330,.28,3),(470,390,.65,3)],
 'jungle':[(1200,700,.46,3),(850,1240,.18,5),(620,430,.40,2)]}

def smoothed(data,size):
    # All calls include 1024 carried samples, keeping chunk joins continuous.
    accum=np.concatenate(([0.0],np.cumsum(data,dtype=np.float64)))
    avg=(accum[size:]-accum[:-size])/size
    return avg[1024-size+1:].astype(np.float32)

def generate(name,index):
    random=np.random.default_rng(97391+index*3107)
    events=[];cursor=0.0
    while cursor<DURATION:
        cursor+=random.uniform(6,17) if name=='coastline' else random.uniform(2.5,11)
        events.append((cursor,random.uniform(3,9) if name=='coastline' else random.uniform(.06,1.4),random.uniform(.10,.38),random.uniform(-.85,.85)))
    birds=[];cursor=5.0
    while cursor<DURATION:
        cursor+=random.uniform(11,34) if name!='jungle' else random.uniform(5,19)
        k=int(random.integers(3));a,b,d,repeats=BANK[name][k]
        for call in range(repeats):birds.append((cursor+call*(d+.13),a,b,d,random.uniform(-.85,.85),random.uniform(.008,.022)))
    pcm=OUT/(name+'.wav');tail=random.normal(0,1,(2,1024)).astype(np.float32)
    peak=0.0;power=0.0;samples=0;previous=None;max_boundary_jump=0.0
    with wave.open(str(pcm),'wb') as out:
        out.setnchannels(2);out.setsampwidth(2);out.setframerate(SR)
        for offset in range(0,N,SR*8):
            count=min(SR*8,N-offset);t=(offset+np.arange(count,dtype=np.float64))/SR
            output=np.empty((count,2),dtype=np.float32)
            for channel in range(2):
                data=np.concatenate((tail[channel],random.normal(0,1,count).astype(np.float32)));tail[channel]=data[-1024:]
                white=data[1024:];soft=smoothed(data,16)*4;low=smoothed(data,180)*13.4;deep=smoothed(data,800)*28.28
                phase=channel*.41;gust=.63+.19*np.sin(t*.063+phase)+.12*np.sin(t*.137+1.9)+.06*np.sin(t*.021+4)
                if name=='coastline':
                    signal=deep*.044+low*.029*gust+soft*.012*gust
                elif name=='tundra':
                    whistle=np.sin(TAU*(270*t+23*np.sin(t*.015)))+.40*np.sin(TAU*(517*t+21*np.sin(t*.019)))
                    signal=low*.050*gust+soft*.009+whistle*.004*(.5+.5*np.sin(t*.041)**2)
                elif name=='desert':
                    insects=np.sin(TAU*(2810*t+2*np.sin(t*2.7)))*np.maximum(0,np.sin(t*13.7+np.sin(t*.061)))**5
                    signal=low*.055*gust+soft*.018*gust+insects*.012*(.3+.7*np.sin(t*.073+phase)**2)
                else:
                    rain=.68+.20*np.sin(t*.019+phase)+.12*np.sin(t*.053)
                    insects=(np.sin(TAU*3600*t)*np.maximum(0,np.sin(t*18.2+phase))**6+np.sin(TAU*5900*t)*np.maximum(0,np.sin(t*24.3+2))**7)
                    signal=white*.036*rain+soft*.037*rain+low*.042+insects*.009*(.6+.4*np.sin(t*.029)**2)
                for start,length,amplitude,pan in events:
                    if start+length<t[0] or start>t[-1]:continue
                    mask=(t>=start)&(t<start+length);u=(t[mask]-start)/length;panning=math.sqrt((1+pan*(1 if channel else -1))/2)
                    if name=='coastline':
                        swell=np.sin(np.pi*u)**1.7;foam=np.maximum(0,np.sin(np.pi*np.clip((u-.16)/.84,0,1)))**.55
                        signal[mask]+=(low[mask]*swell*.65+soft[mask]*foam*.40+white[mask]*foam*.10)*amplitude*panning
                    elif name=='tundra':
                        envelope=np.exp(-u*8)*(1-u)
                        signal[mask]+=(white[mask]*.55+np.sin(TAU*(1300*u+170*u*u))*.22)*envelope*amplitude*panning
                    elif name=='desert':signal[mask]+=soft[mask]*np.sin(np.pi*u)**2*amplitude*.15*panning
                    else:
                        envelope=np.exp(-u*14)
                        signal[mask]+=(np.sin(TAU*(940*u-310*u*u))*.22+white[mask]*.12)*envelope*amplitude*panning
                for start,a,b,length,pan,amplitude in birds:
                    if start+length<t[0] or start>t[-1]:continue
                    mask=(t>=start)&(t<start+length);u=t[mask]-start
                    envelope=np.sin(np.pi*u/length)**1.4
                    tone=np.sin(TAU*(a*u+(b-a)*u*u/(2*length)))+.22*np.sin(TAU*(2*a*u+(b-a)*u*u/length))
                    signal[mask]+=tone*envelope*amplitude*math.sqrt((1+pan*(1 if channel else -1))/2)
                # Gentle headroom compression, not a hard-clipped noise file.
                output[:,channel]=np.tanh(signal*.95)*.92
            edge=np.minimum(1,np.minimum(t/2,(DURATION-t)/2));output*=np.maximum(0,edge[:,None])
            peak=max(peak,float(np.max(np.abs(output))));power+=float(np.sum(output.astype(np.float64)**2));samples+=output.size
            if previous is not None:max_boundary_jump=max(max_boundary_jump,float(np.max(np.abs(output[0]-previous))))
            previous=output[-1].copy();out.writeframes((output*32767).astype('<i2').tobytes())
    target=OUT/(name+'.mp3')
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(pcm),'-codec:a','libmp3lame','-b:a','112k','-metadata','title='+name.title()+' - original procedural nature soundscape','-metadata','comment=Original synthesis; no source recordings; 660 seconds.',str(target)],check=True)
    # Decode the delivered encoding to verify the actual recording duration.
    verify=OUT/(name+'-verify.wav')
    subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(target),'-acodec','pcm_s16le',str(verify)],check=True)
    with wave.open(str(verify),'rb') as read:verified_duration=read.getnframes()/read.getframerate()
    verify.unlink();pcm.unlink()
    result={'file':target.name,'durationSeconds':verified_duration,'sampleRate':SR,'channels':2,'encoding':'MP3 112 kbit/s','bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'source':'Original seeded procedural synthesis; no downloaded audio','design':DESIGNS[name],'discreteTextureEvents':len(events),'birdPhrases':len(birds),'preEncodingPeak':peak,'preEncodingRms':math.sqrt(power/samples),'maxChunkBoundaryJump':max_boundary_jump}
    print(json.dumps(result),flush=True);return result

TAU=math.tau
manifest={'description':'Four original eleven-minute recordings, not downloaded field recordings. Runtime adds the existing twelve species bird profiles and crossfades randomized playback positions.','durationTargetSeconds':DURATION,'redistribution':'Generated from mathematical signals and seeded noise without third-party recordings; included for local offline redistribution with Neon Pursuit.','recordings':{name:generate(name,index) for index,name in enumerate(DESIGNS)}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
