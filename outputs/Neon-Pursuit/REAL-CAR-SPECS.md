# Real-car references

Reference facts were checked on 12 September 2026. The eight original car designs use the following real vehicles as references; the current garage displays the reference names. All packaged models, textures and audio are original; manufacturer assets are not included.

**Current driving tune:** the latest user direction overrides the earlier manufacturer-matched acceleration and speed calibration. Actual game acceleration and top speeds are boosted. The published figures below are reference specifications, not promises about in-game performance. Current game measurements belong in the separate fast-drive verification report.

| Original design name (legacy) | Real-world reference | Published power / torque | Reference mass and basis | Drive / gears | Published top speed | Published launch reference |
|---|---|---|---|---|---|---|
| Blackline R | McLaren 720S Coupe, 2017–2023 | 720 PS / 710 bhp; 770 Nm | 1419 kg DIN kerb, no driver | RWD / 7 | 212 mph | 0–100 km/h: 2.9 s in specification table |
| Ghost GT | Aston Martin DB12 Coupe, 2023 base V8 | 680 PS; 800 Nm | 1788 kg EU kerb with lightweight options | RWD / 8 | 202 mph | 0–100 km/h: 3.6 s |
| Koenigsegg Jesko Attack | Koenigsegg Jesko Attack, 2024 technical specification | 1280 bhp gasoline / 1600 bhp E85; 1500 Nm max | 1320 kg dry / 1420 kg curb, manufacturer | RWD / 9 LST | Not certified by manufacturer | Not published by manufacturer |
| Switchback RX | Toyota GR Yaris 6MT, 2020 launch model | 261 DIN hp / 257 bhp; 360 Nm | 1280 kg kerb, without driver | AWD / 6 | 143 mph | 0–100 km/h: under 5.5 s |
| Iron V8 | Ford Mustang GT Fastback 10AT, 2024 European model | 446 PS / 328 kW; 540 Nm | 1836 kg is an authored kerb estimate; markets/equipment vary | RWD / 10 | 155 mph | 0–100 km/h: 4.9 s, UK automatic specification |
| Aero S | Mazda MX-5 2.0 Roadster 6MT, 2025 UK 184 PS soft top | 184 PS; 205 Nm | 1053 kg reference: brochure maximum of 1128 kg less its included 75 kg driver | RWD / 6 | 136 mph | 0–100 km/h: 6.5 s |
| Vector E | Tesla Model S Plaid with 200 mph hardware | 1020 hp peak; combined torque not published in cited manufacturer source | 2178 kg, converted from 4802 lb manufacturer curb mass | Tri-motor AWD / 1 | 200 mph with upgrade; 163 mph standard limit | 0–60 mph: 1.99 s manufacturer figure with rollout |
| Outrider 4 | Land Rover Defender 110 P400, 2025 five-seat, standard wheels | 400 PS / 294 kW; 550 Nm | 2326 kg DIN unladen, five seats, no driver | AWD / 8 | 119 mph standard wheels | 0–60 mph: 5.8 s; 0–100 km/h: 6.1 s |

## Braking reference basis

McLaren publishes **100–0 km/h in 30 m**. The Jesko Attack entry uses a simulation estimate because Koenigsegg publishes the carbon-ceramic brake hardware but no stopping distance. The other dry-road brake-distance inputs are authored **60–0 mph estimates**: DB12 33 m, GR Yaris 34 m, Mustang 36 m, MX-5 35 m, Plaid 33.5 m and Defender 42 m. These are reference inputs; use the current game verification report for measured gameplay stopping behavior.

## Sources and version caveats

- **McLaren 720S:** the page introduction says 2.8 s to 100 km/h while its detailed table says 2.9 s; this reference uses the table. [McLaren specifications](https://cars.mclaren.com/en/super-series/720s).
- **Aston Martin DB12:** base DB12, not DB12 S. The published mass includes lightweight options. [Aston Martin specifications](https://www.astonmartin.com/en/models/db12).
- **Koenigsegg Jesko Attack:** gasoline and E85 output, 1500 Nm maximum torque, 9-speed LST, dimensions and 1320 kg dry / 1420 kg curb weights are taken from Koenigsegg's technical specification. Koenigsegg does not publish a certified top speed or 0–100 km/h time for the Attack; the game cap remains separately labeled arcade tuning. [Jesko Attack technical specifications](https://www.koenigsegg.com/technical-specifications-jesko-attack), [Jesko Attack model page](https://www.koenigsegg.com/model/jesko-attack).
- **Toyota GR Yaris:** original 261 DIN hp model, not the later 280 hp version. [Toyota launch technical specifications](https://media.toyota.co.uk/the-new-toyota-gr-yaris-forged-in-the-heat-of-world-rally-competition/).
- **Ford Mustang GT:** European 446 PS GT, not the US 480 hp model or Dark Horse. The mass estimate uses Ford's published GT automatic mass from another market. [European output](https://media.ford.com/content/fordmedia/feu/gb/en/news/2024/02/01/new-ford-mustang-is-an-icon-reborn-.html), [UK drivetrain/performance](https://www.ford.co.uk/support/how-tos/support-search-only/vehicle-index/ford-mustang-2024), [Brazilian GT automatic mass](https://www.ford.com.br/content/dam/Ford/website-assets/latam/br/nameplate/2024/mustang/pdf/fbr-mustang-gt-performance-ficha-tecnica.pdf).
- **Mazda MX-5:** 2.0 soft top, not RF. The brochure includes a 75 kg driver in its mass figure. [Mazda UK September 2025 guide, page 22](https://media-assets.mazda.eu/raw/upload/mazdauk/globalassets/uk/pdfs/fy160/p2.5/mx-5/mazda-mx-5-ps-guide-sept-25.pdf?rnd=4a45a8).
- **Tesla Model S Plaid:** 200 mph requires the hardware upgrade. Rollout-assisted and full standing-start acceleration measurements are different. Current manufacturer mass and MotorTrend's 2022 test describe separate reference configurations. No unpublished torque value is invented. [Tesla specifications and footnotes](https://www.tesla.com/models?source=homepage), [MotorTrend instrumented test](https://www.motortrend.com/reviews/2022-tesla-model-s-plaid-first-test-review).
- **Land Rover Defender:** 119 mph is the standard-wheel configuration; 22-inch wheels permit the manufacturer's 130 mph figure. [2025 technical data, pages 15–16](https://www.landrover.com/defender-wltp/), [Defender 110 transmission data](https://jlrnewsroom.media/wp-content/uploads/2020/09/Land-Rover-Defender-110_TECH-DATA_21MY_090920.pdf).

## Simulation limits

Published mass, power units, acceleration procedures and equipment bases differ between manufacturers. Torque curves, gearing calibration, aerodynamic drag, delivered-power factors, traction, stability, rank scores and shift duration remain authored approximations. Manual gearboxes shift automatically. The game does not model full tire/chassis dynamics, clutch control, dynamic axle loads, tire temperature, brake fade, battery conditioning or complete regeneration. The latest boosted acceleration/top-speed tune is deliberately game-oriented, while the named vehicles remain references for identity and mechanical character.
