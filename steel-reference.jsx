import { useState, useMemo, useCallback, useRef, useEffect } from "react";

/*
 * ═══════════════════════════════════════════════════════════════
 * DATA MODEL:
 * - Each steel grade is a SEPARATE record with its OWN standard
 * - Composition comes from THAT SPECIFIC standard
 * - "analogues" is an array of IDs of similar (NOT identical) grades
 * ═══════════════════════════════════════════════════════════════
 */

const DB = [
  // ─── ГОСТ 380-2005 · Углеродистые обыкновенного качества ───
  { id:"gost-st3sp", name:"Ст3сп", standard:"ГОСТ 380-2005", country:"RU", cat:"Углеродистые", tags:"углеродистые carbon обыкновенного качества конструкционные",
    comp:{C:[0.14,0.22],Mn:[0.40,0.65],Si:[0.15,0.30],P:[0,0.04],S:[0,0.05],Cr:[0,0.30],Ni:[0,0.30],Cu:[0,0.30]},
    mech:{source:"ГОСТ 535-2005",note:"Сортовой и фасонный прокат",
      byThickness:[
        {range:[0,20],yt:245,ts:[370,480],el:26},
        {range:[20,40],yt:235,ts:[370,480],el:25},
        {range:[40,100],yt:225,ts:[370,480],el:23},
      ],
      impact:[{type:"KCU",temp:20,value:49}],
      weldability:{cev:0.35,note:"Без ограничений"}},
    products:["Сортовой","Фасонный (уголок, швеллер, двутавр)","Лист г/к","Труба ВГП","Профильная труба"],
    app:"Строительные конструкции, профили, трубы", analogues:["en-s235jr","en-s235j0"] },

  { id:"gost-st3ps", name:"Ст3пс", standard:"ГОСТ 380-2005", country:"RU", cat:"Углеродистые", tags:"углеродистые carbon обыкновенного качества конструкционные",
    comp:{C:[0.14,0.22],Mn:[0.40,0.65],Si:[0.05,0.15],P:[0,0.04],S:[0,0.05],Cr:[0,0.30],Ni:[0,0.30]},
    mech:{source:"ГОСТ 535-2005",note:"Сортовой и фасонный прокат",
      byThickness:[
        {range:[0,20],yt:245,ts:[370,480],el:26},
        {range:[20,40],yt:235,ts:[370,480],el:25},
        {range:[40,100],yt:225,ts:[370,480],el:23},
      ],
      impact:[{type:"KCU",temp:20,value:49}],
      weldability:{cev:0.35,note:"Без ограничений"}},
    products:["Лист г/к","Лист х/к","Лента","Гнутый профиль"],
    app:"Общие конструкции, листовой прокат", analogues:["en-s235jr"] },

  { id:"gost-st5sp", name:"Ст5сп", standard:"ГОСТ 380-2005", country:"RU", cat:"Углеродистые", tags:"углеродистые carbon обыкновенного качества конструкционные",
    comp:{C:[0.28,0.37],Mn:[0.50,0.80],Si:[0.15,0.30],P:[0,0.04],S:[0,0.05]},
    mech:{source:"ГОСТ 535-2005",note:"Сортовой и фасонный прокат",
      byThickness:[
        {range:[0,20],yt:285,ts:[490,630],el:20},
        {range:[20,40],yt:275,ts:[490,630],el:19},
        {range:[40,100],yt:265,ts:[490,630],el:17},
      ],
      impact:[{type:"KCU",temp:20,value:49}],
      weldability:{cev:0.45,note:"С подогревом 100–120°C"}},
    products:["Круг","Сортовой","Поковка"],
    app:"Крепёж, клинья, прокладки", analogues:["en-s275jr","en-s275j0"] },

  // ─── ГОСТ 1050-2013 · Углеродистые качественные ─────────────
  { id:"gost-10", name:"10", standard:"ГОСТ 1050-2013", country:"RU", cat:"Углеродистые качественные", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.07,0.14],Si:[0.17,0.37],Mn:[0.35,0.65],Cr:[0,0.15],Ni:[0,0.30],Cu:[0,0.30],P:[0,0.030],S:[0,0.035]},
    mech:{source:"ГОСТ 1050-2013",note:"Горячекатаный прокат, нормализованный",
      byThickness:[
        {range:[0,80],yt:205,ts:[330,0],el:31},
      ],
      impact:[{type:"KCU",temp:20,value:49}],
      weldability:{cev:0.17,note:"Без ограничений"}},
    products:["Круг","Лист","Лента","Проволока","Труба"],
    app:"Детали для цементации, втулки, упоры", analogues:["en-c10"] },

  { id:"gost-20", name:"20", standard:"ГОСТ 1050-2013", country:"RU", cat:"Углеродистые качественные", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.17,0.24],Si:[0.17,0.37],Mn:[0.35,0.65],Cr:[0,0.25],Ni:[0,0.30],Cu:[0,0.30],P:[0,0.030],S:[0,0.035]},
    mech:{source:"ГОСТ 1050-2013",note:"Горячекатаный прокат, нормализованный",
      byThickness:[
        {range:[0,80],yt:245,ts:[410,0],el:25},
      ],
      impact:[{type:"KCU",temp:20,value:49}],
      weldability:{cev:0.25,note:"Без ограничений"}},
    products:["Труба б/ш","Круг","Лист","Поковка","Фланцы"],
    app:"Трубы, крепёж, фланцы, шестерни", analogues:["en-c22"] },

  { id:"gost-45", name:"45", standard:"ГОСТ 1050-2013", country:"RU", cat:"Углеродистые качественные", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.42,0.50],Si:[0.17,0.37],Mn:[0.50,0.80],Cr:[0,0.25],Ni:[0,0.30],Cu:[0,0.30],P:[0,0.030],S:[0,0.035]},
    mech:{source:"ГОСТ 1050-2013",note:"Горячекатаный прокат, нормализованный",
      byThickness:[
        {range:[0,80],yt:355,ts:[600,0],el:16},
      ],
      impact:[{type:"KCU",temp:20,value:34}],
      weldability:{cev:0.55,note:"Ограниченная, подогрев 200–300°C"}},
    products:["Круг","Лист","Поковка","Полоса"],
    app:"Валы, шестерни, оси, шпиндели", analogues:["en-c45"] },

  { id:"gost-35", name:"35", standard:"ГОСТ 1050-2013", country:"RU", cat:"Углеродистые качественные", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.32,0.40],Si:[0.17,0.37],Mn:[0.50,0.80],Cr:[0,0.25],Ni:[0,0.30],Cu:[0,0.30],P:[0,0.030],S:[0,0.035]},
    mech:{source:"ГОСТ 1050-2013",note:"Горячекатаный прокат, нормализованный",
      byThickness:[
        {range:[0,80],yt:315,ts:[530,0],el:20},
      ],
      impact:[{type:"KCU",temp:20,value:34}],
      weldability:{cev:0.48,note:"Ограниченная, подогрев 150–200°C"}},
    products:["Круг","Полоса","Поковка"],
    app:"Оси, валы, шатуны, кольца", analogues:["en-c35"] },

  // ─── ГОСТ 19281-2014 · Низколегированные ────────────────────
  { id:"gost-09g2s", name:"09Г2С", standard:"ГОСТ 19281-2014", country:"RU", cat:"Низколегированные", tags:"низколегированные low-alloy конструкционные",
    comp:{C:[0,0.12],Si:[0.50,0.80],Mn:[1.30,1.70],Cr:[0,0.30],Ni:[0,0.30],Cu:[0,0.30],P:[0,0.035],S:[0,0.040],N:[0,0.008]},
    mech:{source:"ГОСТ 19281-2014",note:"Листовой и фасонный прокат",
      byThickness:[
        {range:[0,20],yt:345,ts:[490,0],el:21},
        {range:[20,32],yt:325,ts:[470,0],el:21},
        {range:[32,60],yt:305,ts:[460,0],el:21},
        {range:[60,80],yt:285,ts:[450,0],el:21},
        {range:[80,160],yt:275,ts:[440,0],el:21},
      ],
      impact:[{type:"KCU",temp:-40,value:34},{type:"KCU",temp:-70,value:29}],
      weldability:{cev:0.40,note:"Без ограничений"}},
    products:["Лист","Труба б/ш","Труба э/с","Круг","Фасонный","Фланцы"],
    app:"Трубы, сосуды давления, строительные конструкции", analogues:["en-s355j2","en-s355jr"] },

  // ─── EN 10025-2:2019 · Конструкционные горячекатаные ────────
  { id:"en-s235jr", name:"S235JR", standard:"EN 10025-2", country:"EU", numericName:"1.0038",
    cat:"Конструкционные EN", tags:"углеродистые carbon structural конструкционные",
    comp:{C:[0,0.17],Mn:[0,1.40],Si:[0,0.035],P:[0,0.035],S:[0,0.035],N:[0,0.012],Cu:[0,0.55]},
    mech:{source:"EN 10025-2",note:"Сортовой и листовой прокат",
      byThickness:[
        {range:[0,16],yt:235,ts:[360,510],el:26},{range:[16,40],yt:225,ts:[360,510],el:25},
        {range:[40,63],yt:215,ts:[360,510],el:24},{range:[63,80],yt:215,ts:[360,510],el:24},
        {range:[80,100],yt:215,ts:[360,510],el:24},{range:[100,150],yt:195,ts:[350,500],el:22},
        {range:[150,200],yt:185,ts:[340,490],el:21},{range:[200,250],yt:175,ts:[340,490],el:21},
      ],
      impact:[{type:"KV",temp:20,value:27}],
      weldability:{cev:0.35,note:"Без подогрева"}},
    products:["Лист","Полоса","Сортовой","Фасонный"],
    app:"Строительные конструкции, KV +20°C ≥27J", analogues:["gost-st3sp","gost-st3ps"] },

  { id:"en-s235j0", name:"S235J0", standard:"EN 10025-2", country:"EU", numericName:"1.0114",
    cat:"Конструкционные EN", tags:"углеродистые carbon structural конструкционные",
    comp:{C:[0,0.17],Mn:[0,1.40],P:[0,0.030],S:[0,0.030],N:[0,0.012],Cu:[0,0.55]},
    mech:{source:"EN 10025-2",note:"Сортовой и листовой прокат",
      byThickness:[
        {range:[0,16],yt:235,ts:[360,510],el:26},{range:[16,40],yt:225,ts:[360,510],el:25},
        {range:[40,63],yt:215,ts:[360,510],el:24},{range:[63,100],yt:215,ts:[360,510],el:24},
        {range:[100,150],yt:195,ts:[350,500],el:22},{range:[150,250],yt:175,ts:[340,490],el:21},
      ],
      impact:[{type:"KV",temp:0,value:27}],
      weldability:{cev:0.35,note:"Без подогрева"}},
    products:["Лист","Полоса","Сортовой","Фасонный"],
    app:"Конструкции, KV 0°C ≥27J", analogues:["gost-st3sp"] },

  { id:"en-s235j2", name:"S235J2", standard:"EN 10025-2", country:"EU", numericName:"1.0117",
    cat:"Конструкционные EN", tags:"углеродистые carbon structural конструкционные",
    comp:{C:[0,0.17],Mn:[0,1.40],P:[0,0.025],S:[0,0.025],Cu:[0,0.55]},
    mech:{source:"EN 10025-2",note:"Сортовой и листовой прокат",
      byThickness:[
        {range:[0,16],yt:235,ts:[360,510],el:26},{range:[16,40],yt:225,ts:[360,510],el:25},
        {range:[40,63],yt:215,ts:[360,510],el:24},{range:[63,100],yt:215,ts:[360,510],el:24},
        {range:[100,150],yt:195,ts:[350,500],el:22},{range:[150,250],yt:175,ts:[340,490],el:21},
      ],
      impact:[{type:"KV",temp:-20,value:27}],
      weldability:{cev:0.35,note:"Без подогрева"}},
    products:["Лист","Полоса","Сортовой","Фасонный"],
    app:"Конструкции, KV -20°C ≥27J", analogues:["gost-st3sp"] },

  { id:"en-s275jr", name:"S275JR", standard:"EN 10025-2", country:"EU", numericName:"1.0044",
    cat:"Конструкционные EN", tags:"углеродистые carbon structural конструкционные",
    comp:{C:[0,0.21],Mn:[0,1.50],P:[0,0.035],S:[0,0.035],N:[0,0.012],Cu:[0,0.55]},
    mech:{source:"EN 10025-2",note:"Сортовой и листовой прокат",
      byThickness:[
        {range:[0,16],yt:275,ts:[410,560],el:23},{range:[16,40],yt:265,ts:[410,560],el:22},
        {range:[40,63],yt:255,ts:[410,560],el:21},{range:[63,100],yt:245,ts:[410,560],el:20},
        {range:[100,150],yt:225,ts:[400,540],el:18},{range:[150,250],yt:205,ts:[380,540],el:17},
      ],
      impact:[{type:"KV",temp:20,value:27}],
      weldability:{cev:0.40,note:"Без подогрева до 25мм"}},
    products:["Лист","Сортовой","Фасонный"],
    app:"Конструкции средней нагрузки, KV +20°C ≥27J", analogues:["gost-st5sp"] },

  { id:"en-s275j0", name:"S275J0", standard:"EN 10025-2", country:"EU", numericName:"1.0143",
    cat:"Конструкционные EN", tags:"углеродистые carbon structural конструкционные",
    comp:{C:[0,0.18],Mn:[0,1.50],P:[0,0.030],S:[0,0.030],N:[0,0.012],Cu:[0,0.55]},
    mech:{source:"EN 10025-2",note:"Сортовой и листовой прокат",
      byThickness:[
        {range:[0,16],yt:275,ts:[410,560],el:23},{range:[16,40],yt:265,ts:[410,560],el:22},
        {range:[40,63],yt:255,ts:[410,560],el:21},{range:[63,100],yt:245,ts:[410,560],el:20},
        {range:[100,150],yt:225,ts:[400,540],el:18},{range:[150,250],yt:205,ts:[380,540],el:17},
      ],
      impact:[{type:"KV",temp:0,value:27}],
      weldability:{cev:0.40,note:"Без подогрева до 25мм"}},
    products:["Лист","Сортовой","Фасонный"],
    app:"Конструкции средней нагрузки, KV 0°C ≥27J", analogues:["gost-st5sp"] },

  { id:"en-s355jr", name:"S355JR", standard:"EN 10025-2", country:"EU", numericName:"1.0045",
    cat:"Конструкционные EN", tags:"углеродистые низколегированные carbon low-alloy structural конструкционные",
    comp:{C:[0,0.24],Mn:[0,1.60],Si:[0,0.55],P:[0,0.035],S:[0,0.035],N:[0,0.012],Cu:[0,0.55]},
    mech:{source:"EN 10025-2",note:"Сортовой и листовой прокат",
      byThickness:[
        {range:[0,16],yt:355,ts:[470,630],el:22},{range:[16,40],yt:345,ts:[470,630],el:21},
        {range:[40,63],yt:335,ts:[470,630],el:20},{range:[63,100],yt:325,ts:[470,630],el:19},
        {range:[100,150],yt:315,ts:[450,600],el:17},{range:[150,250],yt:295,ts:[450,600],el:17},
      ],
      impact:[{type:"KV",temp:20,value:27}],
      weldability:{cev:0.45,note:"Без подогрева до 25мм"}},
    products:["Лист","Полоса","Сортовой","Фасонный","Hollow sections"],
    app:"Высоконагруженные конструкции, KV +20°C ≥27J", analogues:["gost-09g2s"] },

  { id:"en-s355j2", name:"S355J2", standard:"EN 10025-2", country:"EU", numericName:"1.0577",
    cat:"Конструкционные EN", tags:"углеродистые низколегированные carbon low-alloy structural конструкционные",
    comp:{C:[0,0.22],Mn:[0,1.60],Si:[0,0.55],P:[0,0.025],S:[0,0.025],Cu:[0,0.55]},
    mech:{source:"EN 10025-2",note:"Сортовой и листовой прокат",
      byThickness:[
        {range:[0,16],yt:355,ts:[470,630],el:22},{range:[16,40],yt:345,ts:[470,630],el:21},
        {range:[40,63],yt:335,ts:[470,630],el:20},{range:[63,100],yt:325,ts:[470,630],el:19},
        {range:[100,150],yt:315,ts:[450,600],el:17},{range:[150,250],yt:295,ts:[450,600],el:17},
      ],
      impact:[{type:"KV",temp:-20,value:27}],
      weldability:{cev:0.47,note:"Без подогрева до 25мм"}},
    products:["Лист","Полоса","Сортовой","Фасонный","Hollow sections"],
    app:"Высоконагруженные конструкции, KV -20°C ≥27J", analogues:["gost-09g2s"] },

  // ─── EN 10083-2:2006 · Качественные для закалки ─────────────
  { id:"en-c10", name:"C10", standard:"EN 10083-2", country:"EU", numericName:"1.0301",
    cat:"Качественные EN", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.07,0.13],Si:[0,0.40],Mn:[0.30,0.60],P:[0,0.045],S:[0,0.045],Cr:[0,0.40],Ni:[0,0.40],Mo:[0,0.10]},
    mech:{source:"EN 10083-2",note:"Нормализованный (+N), ø/толщ. ≤16мм",
      byThickness:[{range:[0,16],yt:220,ts:[340,470],el:30}],
      impact:[],weldability:{cev:0.18,note:"Без ограничений"}},
    app:"Детали для цементации", analogues:["gost-10"] },

  { id:"en-c22", name:"C22", standard:"EN 10083-2", country:"EU", numericName:"1.0402",
    cat:"Качественные EN", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.17,0.24],Si:[0,0.40],Mn:[0.40,0.70],P:[0,0.045],S:[0,0.045],Cr:[0,0.40],Ni:[0,0.40],Mo:[0,0.10]},
    mech:{source:"EN 10083-2",note:"Нормализованный (+N), ø/толщ. ≤16мм",
      byThickness:[{range:[0,16],yt:240,ts:[410,540],el:24}],
      impact:[],weldability:{cev:0.26,note:"Без ограничений"}},
    app:"Крепёж, трубы, фланцы", analogues:["gost-20"] },

  { id:"en-c35", name:"C35", standard:"EN 10083-2", country:"EU", numericName:"1.0501",
    cat:"Качественные EN", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.32,0.39],Si:[0,0.40],Mn:[0.50,0.80],P:[0,0.045],S:[0,0.045],Cr:[0,0.40],Ni:[0,0.40],Mo:[0,0.10]},
    mech:{source:"EN 10083-2",note:"Нормализованный (+N), ø/толщ. ≤16мм",
      byThickness:[{range:[0,16],yt:300,ts:[520,640],el:18}],
      impact:[],weldability:{cev:0.47,note:"Ограниченная, подогрев 150–200°C"}},
    app:"Оси, валы, рычаги", analogues:["gost-35"] },

  { id:"en-c45", name:"C45", standard:"EN 10083-2", country:"EU", numericName:"1.0503",
    cat:"Качественные EN", tags:"углеродистые качественные carbon quality",
    comp:{C:[0.42,0.50],Si:[0,0.40],Mn:[0.50,0.80],P:[0,0.045],S:[0,0.045],Cr:[0,0.40],Ni:[0,0.40],Mo:[0,0.10]},
    mech:{source:"EN 10083-2",note:"Нормализованный (+N), ø/толщ. ≤16мм",
      byThickness:[{range:[0,16],yt:340,ts:[580,710],el:14}],
      impact:[],weldability:{cev:0.56,note:"Ограниченная, подогрев 200–300°C"}},
    app:"Валы, шестерни, шпиндели", analogues:["gost-45"] },

  // ─── AISI 316 family ───────────────────────────────────────────
  // ASTM A240 Type 316 (UNS S31600)
  { id:"astm-316", name:"316", standard:"ASTM A240 (UNS S31600)", country:"US", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.08],Mn:[0,2.00],Si:[0,0.75],P:[0,0.045],S:[0,0.030],Cr:[16.0,18.0],Ni:[10.0,14.0],Mo:[2.0,3.0],N:[0,0.10]},
    mech:{source:"ASTM A240",note:"Лист и полоса, отожжённый",
      byThickness:[{range:[0,75],yt:205,ts:[515,0],el:40}],
      impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Хим. промышленность, морское оборудование, пищевая", analogues:["en-14401","gost-08x17n13m2","jis-sus316","gb-0cr17ni12mo2"] },

  // ASTM A240 Type 316L (UNS S31603)
  { id:"astm-316l", name:"316L", standard:"ASTM A240 (UNS S31603)", country:"US", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.03],Mn:[0,2.00],Si:[0,0.75],P:[0,0.045],S:[0,0.030],Cr:[16.0,18.0],Ni:[10.0,14.0],Mo:[2.0,3.0],N:[0,0.10]},
    mech:{source:"ASTM A240",note:"Лист и полоса, отожжённый",byThickness:[{range:[0,75],yt:170,ts:[485,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Сварные конструкции, хим. и фарм. промышленность", analogues:["en-14404","gost-03x17n14m3","jis-sus316l","gb-00cr17ni14mo2"] },

  // EN 10088-2 X5CrNiMo17-12-2 / 1.4401 (≈316)
  { id:"en-14401", name:"X5CrNiMo17-12-2", standard:"EN 10088-2", country:"EU", numericName:"1.4401",
    cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.07],Mn:[0,2.00],Si:[0,1.00],P:[0,0.045],S:[0,0.015],Cr:[16.5,18.5],Ni:[10.0,13.0],Mo:[2.0,2.5],N:[0,0.11]},
    mech:{source:"EN 10088-2",note:"Холоднокатаный, отожжённый",byThickness:[{range:[0,75],yt:220,ts:[520,680],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Хим. оборудование, морское дело", analogues:["astm-316","gost-08x17n13m2","jis-sus316"] },

  // EN 10088-2 X2CrNiMo17-12-2 / 1.4404 (≈316L)
  { id:"en-14404", name:"X2CrNiMo17-12-2", standard:"EN 10088-2", country:"EU", numericName:"1.4404",
    cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.03],Mn:[0,2.00],Si:[0,1.00],P:[0,0.045],S:[0,0.015],Cr:[16.5,18.5],Ni:[10.0,13.0],Mo:[2.0,2.5],N:[0,0.11]},
    mech:{source:"EN 10088-2",note:"Холоднокатаный, отожжённый",byThickness:[{range:[0,75],yt:220,ts:[520,680],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Сварные конструкции в агрессивных средах", analogues:["astm-316l","gost-03x17n14m3","jis-sus316l"] },

  // EN 10088-2 X6CrNiMoTi17-12-2 / 1.4571 (≈316Ti)
  { id:"en-14571", name:"X6CrNiMoTi17-12-2", standard:"EN 10088-2", country:"EU", numericName:"1.4571",
    cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.08],Mn:[0,2.00],Si:[0,1.00],P:[0,0.045],S:[0,0.015],Cr:[16.5,18.5],Ni:[10.5,13.5],Mo:[2.0,2.5],Ti:[0.3,0.7],N:[0,0.11]},
    mech:{source:"EN 10088-2",note:"Холоднокатаный, отожжённый",byThickness:[{range:[0,75],yt:220,ts:[520,680],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Стабилизированная Ti, сварные конструкции", analogues:["gost-10x17n13m2t"] },

  // ГОСТ 5632-2014 08Х17Н13М2 (≈316)
  { id:"gost-08x17n13m2", name:"08Х17Н13М2", standard:"ГОСТ 5632-2014", country:"RU", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.08],Mn:[0,2.00],Si:[0,0.80],P:[0,0.035],S:[0,0.020],Cr:[16.0,18.0],Ni:[12.0,14.0],Mo:[2.0,3.0]},
    mech:{source:"ГОСТ 5632-2014",note:"Прокат, закалка 1050°C",byThickness:[{range:[0,60],yt:205,ts:[510,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Хим. оборудование, реакторы", analogues:["astm-316","en-14401","jis-sus316"] },

  // ГОСТ 5632-2014 03Х17Н14М3 (≈316L)
  { id:"gost-03x17n14m3", name:"03Х17Н14М3", standard:"ГОСТ 5632-2014", country:"RU", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.03],Mn:[0,2.00],Si:[0,0.80],P:[0,0.035],S:[0,0.020],Cr:[16.0,18.0],Ni:[13.0,15.0],Mo:[2.5,3.0]},
    mech:{source:"ГОСТ 5632-2014",note:"Прокат, закалка 1050°C",byThickness:[{range:[0,60],yt:175,ts:[480,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Сварные конструкции в агрессивных средах", analogues:["astm-316l","en-14404","jis-sus316l"] },

  // ГОСТ 5632-2014 10Х17Н13М2Т (≈316Ti)
  { id:"gost-10x17n13m2t", name:"10Х17Н13М2Т", standard:"ГОСТ 5632-2014", country:"RU", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.10],Mn:[0,2.00],Si:[0,0.80],P:[0,0.035],S:[0,0.020],Cr:[16.0,18.0],Ni:[12.0,14.0],Mo:[2.0,3.0],Ti:[0.3,0.7]},
    mech:{source:"ГОСТ 5632-2014",note:"Прокат, закалка 1050°C",byThickness:[{range:[0,60],yt:205,ts:[510,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Стабилизированная Ti, хим. оборудование", analogues:["en-14571"] },

  // JIS G4303 SUS316
  { id:"jis-sus316", name:"SUS316", standard:"JIS G4303", country:"JP", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.08],Mn:[0,2.00],Si:[0,1.00],P:[0,0.045],S:[0,0.030],Cr:[16.0,18.0],Ni:[10.0,14.0],Mo:[2.0,3.0]},
    mech:{source:"JIS G4303",note:"Отожжённый",byThickness:[{range:[0,75],yt:205,ts:[520,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Хим., пищевая промышленность", analogues:["astm-316","en-14401","gost-08x17n13m2"] },

  // JIS G4303 SUS316L
  { id:"jis-sus316l", name:"SUS316L", standard:"JIS G4303", country:"JP", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.03],Mn:[0,2.00],Si:[0,1.00],P:[0,0.045],S:[0,0.030],Cr:[16.0,18.0],Ni:[12.0,15.0],Mo:[2.0,3.0]},
    mech:{source:"JIS G4303",note:"Отожжённый",byThickness:[{range:[0,75],yt:175,ts:[480,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Сварные хим. конструкции", analogues:["astm-316l","en-14404","gost-03x17n14m3"] },

  // GB/T 1220 0Cr17Ni12Mo2 (≈316)
  { id:"gb-0cr17ni12mo2", name:"0Cr17Ni12Mo2", standard:"GB/T 1220", country:"CN", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.08],Mn:[0,2.00],Si:[0,1.00],P:[0,0.035],S:[0,0.030],Cr:[16.0,18.0],Ni:[10.0,14.0],Mo:[2.0,3.0]},
    mech:{source:"GB/T 1220",note:"Отожжённый",byThickness:[{range:[0,60],yt:205,ts:[515,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Хим. аппаратура", analogues:["astm-316","en-14401","gost-08x17n13m2"] },

  // GB/T 1220 00Cr17Ni14Mo2 (≈316L)
  { id:"gb-00cr17ni14mo2", name:"00Cr17Ni14Mo2", standard:"GB/T 1220", country:"CN", cat:"Аустенитные нержавеющие", tags:"нержавеющие нержавейка stainless austenitic аустенитные 316",
    comp:{C:[0,0.03],Mn:[0,2.00],Si:[0,1.00],P:[0,0.035],S:[0,0.030],Cr:[16.0,18.0],Ni:[12.0,15.0],Mo:[2.0,3.0]},
    mech:{source:"GB/T 1220",note:"Отожжённый",byThickness:[{range:[0,60],yt:175,ts:[480,0],el:40}],impact:[],weldability:{cev:null,note:"Без ограничений (аустенитная)"}},
    app:"Сварные конструкции в агрессивных средах", analogues:["astm-316l","en-14404","gost-03x17n14m3"] },
];

const ELEMENTS_ALL = [...new Set(DB.flatMap(s=>Object.keys(s.comp)))];

const rangeStr = (lo,hi) => lo===hi ? `${lo}` : lo===0 ? `≤${hi}` : `${lo}–${hi}`;
const displayName = s => s.numericName ? `${s.name} / ${s.numericName}` : s.name;
const flagEmoji = c => ({RU:"🇷🇺",EU:"🇪🇺",US:"🇺🇸",DE:"🇩🇪",JP:"🇯🇵",CN:"🇨🇳"}[c]||"");

function matchComp(steel, search) {
  for (const [el,val] of Object.entries(search)) {
    if (!val && val !== 0) continue;
    const num = parseFloat(val);
    if (isNaN(num)) continue;
    const r = steel.comp[el];
    if (!r) return false;
    if (num < r[0]-0.5 || num > r[1]+0.5) return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════
export default function SteelReference() {
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(null);
  const [cmpIds, setCmpIds] = useState(new Set());
  const [view, setView] = useState("card");
  const [compSearch, setCompSearch] = useState({});
  const [compResults, setCompResults] = useState(null);
  const [showCompSearch, setShowCompSearch] = useState(false);
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState(1); // 0=compact, 1=normal, 2=large
  const [leftW, setLeftW] = useState(460);
  const dragging = useRef(false);
  const inputRef = useRef(null);

  // Font scale: [compact, normal, large]
  const fs = [
    { xs:10, sm:11, base:13, md:14, lg:15, xl:22, mono:13, monoLg:15, input:13, label:"Аa" },
    { xs:12, sm:13, base:14, md:15, lg:16, xl:26, mono:15, monoLg:16, input:14, label:"Aa" },
    { xs:13, sm:14, base:15, md:16, lg:18, xl:28, mono:16, monoLg:18, input:15, label:"AA" },
  ][fontSize];
  const cycleFontSize = () => setFontSize(p => (p+1) % 3);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const onDragStart = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev) => {
      if (!dragging.current) return;
      const x = ev.clientX || (ev.touches?.[0]?.clientX);
      if (x) setLeftW(Math.max(280, Math.min(x, window.innerWidth - 300)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const toggleCmp = useCallback(id => {
    setCmpIds(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  }, []);

  const selectById = useCallback(id => {
    const found = DB.find(s => s.id === id);
    if (found) { setSel(found); setView("card"); }
    setTimeout(() => {
      const el = document.getElementById(`row-${id}`);
      if (el) el.scrollIntoView({behavior:"smooth",block:"center"});
    }, 60);
  }, []);

  const doCompSearch = () => {
    const has = Object.values(compSearch).some(v => v!=="" && v!==undefined);
    if (!has) { setCompResults(null); return; }
    setCompResults(DB.filter(s => matchComp(s, compSearch)));
  };

  const filtered = useMemo(() => {
    let list = compResults || DB;
    if (query.length >= 2) {
      const q = query.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.numericName||"").toLowerCase().includes(q) ||
        s.standard.toLowerCase().includes(q) ||
        s.app.toLowerCase().includes(q) ||
        s.cat.toLowerCase().includes(q) ||
        (s.tags||"").toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, compResults]);

  const cmpSteels = [...cmpIds].map(id => DB.find(s=>s.id===id)).filter(Boolean);
  const allCmpEls = [...new Set(cmpSteels.flatMap(s=>Object.keys(s.comp)))];

  const t = dark ? {
    bg:"#141414", bg2:"#1c1c1c", bg3:"#242424", fg:"#e4e4e4", fg2:"#999", fg3:"#666", fg4:"#444",
    border:"#2a2a2a", border2:"#333", accent:"#e4e4e4", accentBg:"#e4e4e4", accentFg:"#141414",
    hover:"#2a2a2a", active:"#333", muted:"#555", link:"#8ab4f8", inputBg:"#1c1c1c",
    badgeBg:"#242424", scrollThumb:"#444", feBox:"#e4e4e4"
  } : {
    bg:"#fafafa", bg2:"#fff", bg3:"#f0f1f4", fg:"#1a1a1a", fg2:"#888", fg3:"#aaa", fg4:"#ccc",
    border:"#eee", border2:"#e0e0e0", accent:"#1a1a1a", accentBg:"#1a1a1a", accentFg:"#fff",
    hover:"#f0f1f4", active:"#e8e8e8", muted:"#bbb", link:"#4a6fa5", inputBg:"#fafafa",
    badgeBg:"#fff", scrollThumb:"#ddd", feBox:"#1a1a1a"
  };

  const thS = {padding:"8px 12px",textAlign:"center",fontWeight:600,color:t.fg,fontSize:11,borderBottom:`2px solid ${t.border}`,background:t.bg2,position:"sticky",top:0};
  const tdS = {padding:"5px 12px",borderBottom:`1px solid ${t.border}`,fontSize:12,borderLeft:`1px solid ${t.border}`};

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:t.bg,color:t.fg,fontFamily:"'DM Sans','SF Pro Display',system-ui,sans-serif",overflow:"hidden",transition:"background 0.25s,color 0.25s",
      zoom:[0.9, 1.0, 1.15][fontSize]}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${t.scrollThumb};border-radius:3px}
        ::placeholder{color:${t.fg3}}
        .row-item{transition:background 0.1s} .row-item:hover{background:${t.hover}!important}
        .pill{display:inline-flex;align-items:center;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:500;
          border:1px solid ${t.border2};cursor:pointer;transition:all 0.12s;user-select:none;background:${t.bg2};color:${t.fg2}}
        .pill:hover{border-color:${t.fg3};color:${t.fg}} .pill-on{background:${t.accentBg};color:${t.accentFg};border-color:${t.accentBg}}
        .analogue-link{cursor:pointer;padding:4px 10px;border-radius:6px;border:1px solid ${t.border2};background:${t.bg2};
          font-family:'DM Mono',monospace;font-size:13px;font-weight:600;color:${t.fg};transition:all 0.15s;display:inline-flex;align-items:center;gap:6px}
        .analogue-link:hover{border-color:${t.fg};background:${t.hover}}
        .filter-link{cursor:pointer;border-bottom:1px dashed ${t.fg4};transition:all 0.15s;padding-bottom:1px}
        .filter-link:hover{color:${t.fg};border-bottom-color:${t.fg}}
        .nav-tab{padding:6px 12px;font-size:13px;font-weight:500;border:none;background:none;color:${t.fg3};cursor:pointer;
          border-bottom:2px solid transparent;transition:all 0.15s}
        .nav-tab:hover{color:${t.fg2}} .nav-tab-on{color:${t.fg};border-bottom-color:${t.fg}}
        .comp-inp{width:100%;padding:5px 8px;border:1px solid ${t.border2};border-radius:6px;font-family:'DM Mono',monospace;
          font-size:12px;color:${t.fg};background:${t.bg2};outline:none;transition:border-color 0.15s}
        .comp-inp:focus{border-color:${t.fg}}
        input[type=number]::-webkit-inner-spin-button{opacity:0.3}
        @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        .detail-anim{animation:slideIn 0.2s ease}
        .resizer-handle:hover .resizer-dot{opacity:1}
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{padding:"10px 20px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:14,background:t.bg2,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:6,background:t.feBox,display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:700,color:dark?"#141414":"#fff"}}>Fe</div>
          <div style={{fontSize:14,fontWeight:600,letterSpacing:"-0.02em"}}>Марочник стали</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,fontSize:11,color:t.fg3}}>
          <span><b style={{color:t.fg2,fontFamily:"'DM Mono',monospace"}}>{DB.length}</b> {DB.length%10===1&&DB.length%100!==11?"марка":DB.length%10>=2&&DB.length%10<=4&&(DB.length%100<10||DB.length%100>=20)?"марки":"марок"}</span>
          <span style={{color:t.border2}}>·</span>
          <span><b style={{color:t.fg2,fontFamily:"'DM Mono',monospace"}}>{[...new Set(DB.map(s=>s.standard.split(" ")[0]))].length}</b> стандартов</span>
          <span style={{color:t.border2}}>·</span>
          <span><b style={{color:t.fg2,fontFamily:"'DM Mono',monospace"}}>{[...new Set(DB.map(s=>s.country))].length}</b> стран</span>
        </div>
        <div style={{width:1,height:20,background:t.border}}/>
        <button onClick={cycleFontSize} title={["Компактный","Обычный","Крупный"][fontSize]}
          style={{padding:"5px 10px",border:`1px solid ${t.border2}`,borderRadius:7,background:t.bg2,
            fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'DM Mono',monospace",color:t.fg2,letterSpacing:"-0.02em",lineHeight:1,
            display:"flex",alignItems:"center",gap:4}}>
          {fs.label}
          <span style={{fontSize:9,opacity:0.5}}>{["S","M","L"][fontSize]}</span>
        </button>
        <button onClick={()=>setDark(!dark)} title={dark?"Светлая тема":"Тёмная тема"}
          style={{padding:"5px 8px",border:`1px solid ${t.border2}`,borderRadius:7,background:t.bg2,
            fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      {/* ═══ MAIN ═══ */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ─── LEFT PANEL ─── */}
        <div style={{width:leftW,minWidth:280,borderRight:`1px solid ${t.border}`,display:"flex",flexDirection:"column",background:t.bg2,flexShrink:0}}>
          {/* Search bar */}
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${t.border}`}}>
            <div style={{position:"relative"}}>
              <svg style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",opacity:0.3}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={inputRef} type="text" value={query} onChange={e=>setQuery(e.target.value)}
                placeholder="Поиск: Ст3сп, S355J2, 1.0577…"
                style={{width:"100%",padding:"6px 28px 6px 30px",border:`1px solid ${t.border2}`,borderRadius:7,
                  fontSize:13,color:t.fg,background:t.inputBg,outline:"none",fontFamily:"inherit"}}
                onFocus={e=>{e.target.style.borderColor=t.fg;e.target.style.background=t.bg2}}
                onBlur={e=>{e.target.style.borderColor=t.border2;e.target.style.background=t.inputBg}}
              />
              {query && <button onClick={()=>{setQuery("");inputRef.current?.focus();}}
                style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",
                  cursor:"pointer",padding:0,color:t.muted,fontSize:16,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}
                onMouseEnter={e=>e.currentTarget.style.color=t.fg2}
                onMouseLeave={e=>e.currentTarget.style.color=t.muted}>×</button>}
            </div>
          </div>
          {/* Compact filter bar */}
          <div style={{padding:"6px 14px",borderBottom:`1px solid ${t.border}`,display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setShowCompSearch(!showCompSearch)}
              style={{fontSize:11,color:showCompSearch?t.fg:t.fg3,background:"none",border:"none",cursor:"pointer",
                fontFamily:"inherit",fontWeight:showCompSearch?600:400,display:"flex",alignItems:"center",gap:4,padding:0}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.5}}><path d="M9 3h6v7l5 8a1 1 0 0 1-.8 1.6H4.8A1 1 0 0 1 4 18l5-8V3"/><path d="M7 3h10"/></svg>
              По хим. составу
            </button>
            {compResults && <span style={{fontSize:10,color:"#4a9",fontWeight:500}}>{compResults.length}</span>}
            {compResults && <button onClick={()=>{setCompSearch({});setCompResults(null);}} style={{fontSize:10,color:t.fg3,background:"none",border:"none",cursor:"pointer",padding:0}}>✕</button>}
          </div>

          {showCompSearch && (
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${t.border}`,background:t.bg}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(68px,1fr))",gap:5,marginBottom:8}}>
                {ELEMENTS_ALL.filter(e=>!["P","S"].includes(e)).map(el=>(
                  <div key={el}>
                    <label style={{fontSize:9.5,fontWeight:600,color:t.fg2,fontFamily:"'DM Mono',monospace"}}>{el}</label>
                    <input type="number" step="0.01" placeholder="—" className="comp-inp"
                      value={compSearch[el]||""} onChange={e=>setCompSearch(p=>({...p,[el]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              <button onClick={doCompSearch} style={{padding:"5px 18px",background:t.accentBg,color:t.accentFg,border:"none",borderRadius:5,fontSize:12,fontWeight:500,cursor:"pointer"}}>Найти</button>
            </div>
          )}

          {/* Steel list */}
          <div style={{flex:1,overflow:"auto"}}>
            {filtered.map(s => {
              const active = sel?.id===s.id;
              return (
                <div key={s.id} id={`row-${s.id}`} className="row-item"
                  onClick={()=>{setSel(s);setView("card");}}
                  style={{padding:"9px 14px",cursor:"pointer",borderBottom:`1px solid ${t.border}`,
                    background:active?t.hover:"transparent",
                    borderLeft:active?`3px solid ${t.fg}`:"3px solid transparent"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0,flex:1}}>
                      <input type="checkbox" checked={cmpIds.has(s.id)}
                        onChange={()=>toggleCmp(s.id)} onClick={e=>e.stopPropagation()}
                        style={{width:14,height:14,accentColor:t.accent,cursor:"pointer",flexShrink:0}} title="Сравнить"/>
                      <span style={{fontSize:11,opacity:0.5}}>{flagEmoji(s.country)}</span>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,color:t.fg}}>{s.name}</span>
                      {s.numericName && <span style={{fontSize:11,color:t.fg3}}>/ {s.numericName}</span>}
                    </div>
                  </div>
                  <div style={{fontSize:10.5,color:t.fg3,marginTop:2}}>{s.standard} · {s.app}</div>
                </div>
              );
            })}
            {filtered.length===0 && <div style={{padding:30,textAlign:"center",color:t.fg4,fontSize:13}}>Ничего не найдено</div>}
          </div>
        </div>

        {/* ─── RESIZER ─── */}
        <div onMouseDown={onDragStart}
          style={{width:5,cursor:"col-resize",background:"transparent",flexShrink:0,position:"relative",zIndex:10,
            display:"flex",alignItems:"center",justifyContent:"center"}}
          onMouseEnter={e=>e.currentTarget.style.background=t.border2}
          onMouseLeave={e=>{if(!dragging.current)e.currentTarget.style.background="transparent"}}>
          <div style={{width:3,height:32,borderRadius:2,background:t.border2,opacity:0.5}}/>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:t.bg}}>
          <div style={{padding:"0 20px",borderBottom:`1px solid ${t.border}`,display:"flex",gap:4,background:t.bg2,flexShrink:0}}>
            <button className={`nav-tab ${view!=='compare'?'nav-tab-on':''}`} onClick={()=>setView('card')}>Карточка</button>
            <button className={`nav-tab ${view==='compare'?'nav-tab-on':''}`} onClick={()=>setView('compare')}>
              Сравнение{cmpIds.size>0 && <span style={{marginLeft:4,fontSize:11}}>{cmpIds.size}</span>}
            </button>
          </div>

          <div style={{flex:1,overflow:"auto",padding:20}}>

            {/* ── CARD ── */}
            {view !== 'compare' && (
              !sel ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:t.fg4}}>
                  <div style={{fontSize:14,fontWeight:500}}>Выберите марку из списка</div>
                </div>
              ) : (
                <div className="detail-anim" key={sel.id}>
                  {/* Header */}
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:2}}>
                      <span style={{fontSize:14}}>{flagEmoji(sel.country)}</span>
                      <h1 style={{fontSize:26,fontWeight:700,letterSpacing:"-0.03em",fontFamily:"'DM Mono',monospace",color:t.fg}}>{displayName(sel)}</h1>
                    </div>
                    <div style={{fontSize:12,color:t.fg2}}>
                      <span className="filter-link" onClick={()=>{setQuery(sel.standard);setCompResults(null);}}>{sel.standard}</span>
                      <span style={{margin:"0 5px",color:"#ccc"}}>·</span>
                      <span className="filter-link" onClick={()=>{setQuery(sel.cat);setCompResults(null);}}>{sel.cat}</span>
                    </div>
                    <div style={{fontSize:12,color:t.fg3,marginTop:2}}>{sel.app}</div>
                  </div>

                  {/* Analogues FIRST */}
                  <Section title="Аналоги (близкие, но не идентичные марки)">
                    {(!sel.analogues || sel.analogues.length===0) ? (
                      <div style={{fontSize:12,color:t.muted}}>Аналоги не указаны</div>
                    ) : (
                      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                        {sel.analogues.map(aid => {
                          const a = DB.find(x=>x.id===aid);
                          if (!a) return null;
                          return (
                            <div key={aid} className="analogue-link" onClick={()=>selectById(aid)}>
                              <span style={{fontSize:11,opacity:0.5}}>{flagEmoji(a.country)}</span>
                              <span>{a.name}</span>
                              {a.numericName && <span style={{fontSize:11,color:t.fg3,fontWeight:400}}>/ {a.numericName}</span>}
                              <span style={{fontSize:10,color:t.muted}}>→</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{fontSize:10,color:t.fg4,marginTop:8,fontStyle:"italic"}}>
                      ⚠ Аналог ≠ идентичная замена. Хим. состав отличается — сверяйтесь с НД.
                    </div>
                  </Section>

                  {/* Composition as TABLE */}
                  <Section title="Химический состав, %">
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead>
                        <tr>
                          {Object.keys(sel.comp).map(el=>(
                            <th key={el} style={{padding:"5px 10px",fontSize:11,fontWeight:600,color:t.fg3,fontFamily:"'DM Mono',monospace",
                              textAlign:"center",borderBottom:`2px solid ${t.border}`,background:t.bg2}}>{el}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {Object.entries(sel.comp).map(([el,[lo,hi]])=>(
                            <td key={el} style={{padding:"6px 10px",fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:600,
                              color:t.fg,textAlign:"center",borderBottom:`1px solid ${t.border}`}}>{rangeStr(lo,hi)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </Section>

                  {/* Mechanical properties */}
                  {sel.mech && (
                    <Section title="Механические свойства">
                      <div style={{fontSize:10,color:t.fg3,marginBottom:8}}>
                        {sel.mech.source} · {sel.mech.note}
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse"}}>
                        <thead>
                          <tr>
                            <th style={{padding:"5px 8px",fontSize:10,fontWeight:600,color:t.fg3,textAlign:"left",borderBottom:`2px solid ${t.border}`,background:t.bg2}}>
                              Толщина, мм</th>
                            <th title="Предел текучести — нагрузка, при которой сталь начинает необратимо деформироваться"
                              style={{padding:"5px 8px",fontSize:10,fontWeight:600,color:t.fg3,textAlign:"center",borderBottom:`2px solid ${t.border}`,background:t.bg2,cursor:"help",borderBottom:"2px dashed "+t.fg3}}>
                              σ₀.₂, МПа</th>
                            <th title="Временное сопротивление — максимальная нагрузка до разрушения"
                              style={{padding:"5px 8px",fontSize:10,fontWeight:600,color:t.fg3,textAlign:"center",borderBottom:`2px solid ${t.border}`,background:t.bg2,cursor:"help",borderBottom:"2px dashed "+t.fg3}}>
                              σᵥ, МПа</th>
                            <th title="Относительное удлинение — насколько растянется перед разрывом"
                              style={{padding:"5px 8px",fontSize:10,fontWeight:600,color:t.fg3,textAlign:"center",borderBottom:`2px solid ${t.border}`,background:t.bg2,cursor:"help",borderBottom:"2px dashed "+t.fg3}}>
                              δ₅, %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sel.mech.byThickness.map((row,i)=>(
                            <tr key={i} onMouseEnter={e=>e.currentTarget.style.background=t.hover}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <td style={{padding:"5px 8px",fontSize:12,color:t.fg2,borderBottom:`1px solid ${t.border}`}}>
                                {row.range[0]===0?"≤ ":""}{row.range[0]===0?row.range[1]:`${row.range[0]}–${row.range[1]}`}</td>
                              <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:t.fg,textAlign:"center",borderBottom:`1px solid ${t.border}`}}>
                                ≥ {row.yt}</td>
                              <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:t.fg,textAlign:"center",borderBottom:`1px solid ${t.border}`}}>
                                {row.ts[1]===0?`≥ ${row.ts[0]}`:`${row.ts[0]}–${row.ts[1]}`}</td>
                              <td style={{padding:"5px 8px",fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,color:t.fg,textAlign:"center",borderBottom:`1px solid ${t.border}`}}>
                                ≥ {row.el}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sel.mech.impact && sel.mech.impact.length > 0 && (
                        <div style={{marginTop:8,fontSize:12,color:t.fg2}}>
                          {sel.mech.impact.map((imp,i)=>(
                            <span key={i} title="Ударная вязкость — стойкость к удару при указанной температуре" style={{cursor:"help"}}>
                              🔨 <span style={{fontFamily:"'DM Mono',monospace",fontWeight:600}}>{imp.type} ≥ {imp.value} Дж</span>
                              <span style={{color:t.fg3}}> при {imp.temp>0?"+":""}{imp.temp}°C</span>
                              {i < sel.mech.impact.length-1 ? <span style={{margin:"0 8px",color:t.border2}}>·</span> : null}
                            </span>
                          ))}
                        </div>
                      )}
                      {sel.mech.weldability && (
                        <div style={{marginTop:6,fontSize:12,color:t.fg2}} title="Свариваемость — CEV (углеродный эквивалент) определяет необходимость подогрева">
                          ⚡ Свариваемость: <span style={{fontWeight:600}}>{sel.mech.weldability.note}</span>
                          {sel.mech.weldability.cev != null && <span style={{color:t.fg3}}> · CEV ≤ {sel.mech.weldability.cev}</span>}
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Products */}
                  {sel.products && sel.products.length > 0 && (
                    <Section title="Виды продукции">
                      <div style={{fontSize:13,color:t.fg2,lineHeight:1.6}}>{sel.products.join(", ")}</div>
                    </Section>
                  )}
                </div>
              )
            )}

            {/* ── COMPARE ── */}
            {view === 'compare' && (
              cmpSteels.length < 2 ? (
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:t.fg4,fontSize:13}}>
                  Отметьте ☑ минимум 2 марки для сравнения составов
                </div>
              ) : (
                <div className="detail-anim">
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr>
                          <th style={thS}></th>
                          {cmpSteels.map(s=>(
                            <th key={s.id} style={{...thS,cursor:"pointer",borderLeft:"1px solid #eee"}}
                              onClick={()=>selectById(s.id)}
                              onMouseEnter={e=>e.currentTarget.style.color=t.link}
                              onMouseLeave={e=>e.currentTarget.style.color=t.fg}>
                              <span style={{fontSize:11,marginRight:4}}>{flagEmoji(s.country)}</span>
                              <span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:14}}>{s.name}</span>
                              {s.numericName && <span style={{fontSize:10,color:t.fg3,fontWeight:400,marginLeft:4}}>/ {s.numericName}</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <TRow label="Стандарт">{cmpSteels.map(s=><td key={s.id} style={{...tdS,textAlign:"center"}}><span className="filter-link" onClick={()=>{setQuery(s.standard);setCompResults(null);}}>{s.standard}</span></td>)}</TRow>
                        <TRow label="Категория">{cmpSteels.map(s=><td key={s.id} style={{...tdS,textAlign:"center"}}><span className="filter-link" onClick={()=>{setQuery(s.cat);setCompResults(null);}}>{s.cat}</span></td>)}</TRow>
                        <tr><td colSpan={cmpSteels.length+1} style={{padding:"10px 12px 4px",fontSize:10,fontWeight:600,color:t.fg3,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${t.border}`}}>Химический состав, %</td></tr>
                        {allCmpEls.map(el=>(
                          <TRow key={el} label={el} mono>{cmpSteels.map(s=>{
                            const r=s.comp[el];
                            return <td key={s.id} style={{...tdS,fontFamily:"'DM Mono',monospace",fontWeight:600,color:r?t.fg:t.fg4,textAlign:"center"}}>
                              {r?rangeStr(r[0],r[1]):"—"}
                            </td>;
                          })}</TRow>
                        ))}
                        <tr><td colSpan={cmpSteels.length+1} style={{padding:"10px 12px 4px",fontSize:10,fontWeight:600,color:t.fg3,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${t.border}`}}>Механические свойства <span style={{fontWeight:400,textTransform:"none"}}>(мин. толщина)</span></td></tr>
                        {(()=>{
                          const vals = (fn) => cmpSteels.map(fn);
                          const best = (arr,mode) => { const nums = arr.map(v=>typeof v==="number"?v:null).filter(v=>v!=null); return nums.length?Math[mode](...nums):null; };
                          const ytVals = vals(s=>s.mech?.byThickness?.[0]?.yt);
                          const tsVals = vals(s=>{const r=s.mech?.byThickness?.[0]?.ts; return r?r[0]:null;});
                          const elVals = vals(s=>s.mech?.byThickness?.[0]?.el);
                          const bestYt = best(ytVals,"max");
                          const bestTs = best(tsVals,"max");
                          const bestEl = best(elVals,"max");
                          return <>
                            <TRow label="σ₀.₂, МПа">{cmpSteels.map((s,i)=>{const v=ytVals[i]; return <td key={s.id} style={{...tdS,fontFamily:"'DM Mono',monospace",fontWeight:600,textAlign:"center",color:v===bestYt&&bestYt?"#2a7":t.fg}}>{v!=null?`≥ ${v}`:"—"}</td>})}</TRow>
                            <TRow label="σᵥ, МПа">{cmpSteels.map((s,i)=>{const r=s.mech?.byThickness?.[0]?.ts; const v=tsVals[i]; return <td key={s.id} style={{...tdS,fontFamily:"'DM Mono',monospace",fontWeight:600,textAlign:"center",color:v===bestTs&&bestTs?"#2a7":t.fg}}>{r?r[1]===0?`≥ ${r[0]}`:`${r[0]}–${r[1]}`:"—"}</td>})}</TRow>
                            <TRow label="δ₅, %">{cmpSteels.map((s,i)=>{const v=elVals[i]; return <td key={s.id} style={{...tdS,fontFamily:"'DM Mono',monospace",fontWeight:600,textAlign:"center",color:v===bestEl&&bestEl?"#2a7":t.fg}}>{v!=null?`≥ ${v}`:"—"}</td>})}</TRow>
                            <TRow label="Ударн. вязк.">{cmpSteels.map(s=>{const imp=s.mech?.impact?.[0]; return <td key={s.id} style={{...tdS,fontFamily:"'DM Mono',monospace",fontSize:11,textAlign:"center",color:t.fg2}}>{imp?`${imp.type}≥${imp.value} ${imp.temp>0?"+":""}${imp.temp}°C`:"—"}</td>})}</TRow>
                            <TRow label="Свариваемость">{cmpSteels.map(s=>{const w=s.mech?.weldability; return <td key={s.id} style={{...tdS,fontSize:11,textAlign:"center",color:t.fg2}}>{w?w.note:"—"}</td>})}</TRow>
                          </>;
                        })()}
                        <tr><td colSpan={cmpSteels.length+1} style={{padding:"10px 12px 4px",fontSize:10,fontWeight:600,color:t.fg3,textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:`1px solid ${t.border}`}}>Виды продукции</td></tr>
                        <TRow label="Прокат">{cmpSteels.map(s=><td key={s.id} style={{...tdS,fontSize:11,color:t.fg2,textAlign:"center"}}>{(s.products||[]).join(", ")||"—"}</td>)}</TRow>                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{padding:"4px 20px",borderTop:`1px solid ${t.border}`,background:t.bg2,display:"flex",justifyContent:"space-between",fontSize:10,color:t.muted,flexShrink:0}}>
        <span>⚠ Справочные данные — аналог ≠ замена, сверяйтесь с НД и сертификатами</span>
        <span>ЕМК · Марочник v2.0</span>
      </footer>
    </div>
  );
}

const Section = ({title,children}) => (
  <div style={{marginBottom:24}}>
    <h3 style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",color:"inherit",opacity:0.45,marginBottom:8}}>{title}</h3>
    {children}
  </div>
);

function TRow({label,children,mono}) {
  return (
    <tr>
      <td style={{padding:"5px 12px",fontWeight:600,color:"inherit",opacity:mono?0.9:0.5,fontSize:mono?13:11,
        fontFamily:mono?"'DM Mono',monospace":"inherit",borderBottom:"1px solid currentColor",borderBottomColor:"inherit",
        whiteSpace:"nowrap",borderBottomWidth:1,borderBottomStyle:"solid",borderColor:"transparent"}}>{label}</td>
      {children}
    </tr>
  );
}
