export const presets={
 'Game Only':{scale:.8,shadow:256,leaves:0,animals:0,birds:0,grass:0,water:[1,1],reflection:0,reflectionHz:0,anisotropy:1,samples:0,fxaa:false},
 Low:{scale:.7,shadow:512,leaves:80,animals:4,birds:8,grass:0,water:[24,16],reflection:0,reflectionHz:0,anisotropy:1,samples:0,fxaa:false},
 High:{scale:1,shadow:1024,leaves:600,animals:12,birds:24,grass:600,water:[64,48],reflection:256,reflectionHz:8,anisotropy:4,samples:2,fxaa:true},
 // Ultra is the everyday high-fidelity preset: it keeps the authored close
 // geometry and PBR response while avoiding Ultra+'s supersampling, 4K
 // shadows, dense wildlife and high-frequency reflection schedule.
 Ultra:{scale:1.0,shadow:1536,leaves:1350,animals:16,birds:32,grass:850,water:[64,48],reflection:384,reflectionHz:8,anisotropy:4,samples:2,fxaa:true},
 'Ultra+':{scale:1.4,shadow:4096,leaves:3600,animals:40,birds:80,grass:2000,water:[144,96],reflection:768,reflectionHz:15,anisotropy:16,samples:4,fxaa:true}
};
