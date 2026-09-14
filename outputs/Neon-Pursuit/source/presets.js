export const presets={
 'Game Only':{scale:.8,shadow:256,leaves:0,animals:0,birds:0,grass:0,water:[1,1],reflection:0,reflectionHz:0,anisotropy:1,samples:0,fxaa:false},
 Low:{scale:.7,shadow:512,leaves:80,animals:4,birds:8,grass:0,water:[24,16],reflection:0,reflectionHz:0,anisotropy:1,samples:0,fxaa:false},
 High:{scale:1,shadow:1024,leaves:600,animals:12,birds:24,grass:600,water:[64,48],reflection:256,reflectionHz:8,anisotropy:4,samples:2,postDetail:0,fxaa:true},
 // Ultra is the everyday high-fidelity preset: it keeps the authored close
 // geometry and PBR response while avoiding Ultra+'s supersampling, 4K
 // shadows, dense wildlife and high-frequency reflection schedule.
 Ultra:{scale:.84,shadow:768,leaves:620,animals:8,birds:14,grass:360,water:[40,28],reflection:192,reflectionHz:4,anisotropy:4,samples:1,postDetail:0,fxaa:true},
 'Ultra+':{scale:1.85,shadow:4096,leaves:5200,animals:64,birds:140,grass:3200,water:[256,160],reflection:1536,reflectionHz:24,anisotropy:16,samples:8,postDetail:4,fxaa:true}
};
