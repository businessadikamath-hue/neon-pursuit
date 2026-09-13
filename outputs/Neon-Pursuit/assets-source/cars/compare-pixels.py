from PIL import Image
import numpy as np
import json
from pathlib import Path
root=Path(__file__).resolve().parent/'gallery'
reports=[]
for name in ['front','rear','traffic','traffic-rear']:
    a=np.asarray(Image.open(root/f'v9-{name}.png').convert('RGB'),dtype=np.float32)
    b=np.asarray(Image.open(root/f'v9-unbatched-{name}.png').convert('RGB'),dtype=np.float32)
    d=np.abs(a-b);mean=float(d.mean()/255);changed=float((d.max(axis=2)>2).mean())
    reports.append({'view':name,'normalizedMeanAbsoluteDifference':mean,'fractionPixelsOver2Of255':changed,'maxChannelDifference':int(d.max()),'passes':mean<=.005 and changed<=.005})
(root/'batching-pixel-report.json').write_text(json.dumps(reports,indent=2))
print(json.dumps(reports,indent=2))
assert all(x['passes'] for x in reports),'Batching exceeds visual-change threshold'
