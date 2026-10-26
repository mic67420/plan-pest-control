// Tests automatiques de non-régression (v2.1-102) — à lancer avant chaque grosse modification :
//   LIBS=/chemin/vers/node_modules PLAYWRIGHT=/chemin/vers/playwright CHROME=/chemin/vers/chrome node tests/smoke.js
// LIBS doit contenir konva, jspdf, pptxgenjs, jszip, pdfjs-dist@3.11.174 (mêmes versions que le CDN). Aucun réseau n'est utilisé.
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const L = (process.env.LIBS || path.join(__dirname, 'node_modules')) + '/';
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
let fails = 0;
const ok = (cond, msg)=>{ console.log((cond ? 'OK   ' : 'ÉCHEC ') + msg); if (!cond) fails++; };
(async()=>{
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  try{
    const ctx = await b.newContext({ viewport:{ width:430, height:900 }, hasTouch:true, acceptDownloads:true });
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e=>errs.push(e.message));
    await pg.route('**/*', r=>{
      const u = r.request().url();
      if (u.includes('konva')) return r.fulfill({ path:L+'konva/konva.min.js', contentType:'application/javascript' });
      if (u.includes('jspdf')) return r.fulfill({ path:L+'jspdf/dist/jspdf.umd.min.js', contentType:'application/javascript' });
      if (u.includes('pptxgen')) return r.fulfill({ path:L+'pptxgenjs/dist/pptxgen.bundle.js', contentType:'application/javascript' });
      if (u.includes('jszip')) return r.fulfill({ path:L+'jszip/dist/jszip.min.js', contentType:'application/javascript' });
      if (u.includes('pdf.worker.min.js')) return r.fulfill({ path:L+'pdfjs-dist/build/pdf.worker.min.js', contentType:'application/javascript', headers:{ 'access-control-allow-origin':'*' } });
      if (u.includes('pdf.min.js')) return r.fulfill({ path:L+'pdfjs-dist/build/pdf.min.js', contentType:'application/javascript' });
      if (u.startsWith('file:')) return r.continue(); return r.abort();
    });
    await pg.goto(FILE); await pg.waitForTimeout(1500);

    // 1. Démarrage
    ok(await pg.evaluate(()=>document.querySelectorAll('#mobileTileBar .mtile.active').length===0 && activeTool===null), 'démarrage : aucune tuile active, aucun outil');
    // 2. Éléments de coin (portrait puis paysage) = préréglages
    const corners = ()=>pg.evaluate(()=>{const r=n=>Math.round(n*100)/100;const co=model.logos.find(l=>l.which==='entreprise'),cl=model.logos.find(l=>l.which==='client'),dt=model.textes.find(t=>t.id==='text-update-date'),ad=model.textes.find(t=>t.id==='text-client-address');return JSON.stringify([co&&[r(co.x),r(co.y),r(co.width)],cl&&[r(cl.x),r(cl.y)],[r(dt.x),r(dt.y)],[r(ad.x),r(ad.y)],[r(model.legend.x),r(model.legend.y)]]);});
    ok(await corners()==='[[1.09,-6.96,210.26],[594,40],[7.77,1092.91],[607.9,149],[483.52,1048.15]]', 'coins : emplacements portrait = documents de test');
    await pg.evaluate(()=>document.getElementById('btnLandscape').click()); await pg.waitForTimeout(300);
    ok(await corners()==='[[1.09,-6.96,233.48],[923,40],[7.77,763.91],[941.99,154.37],[812.52,719.15]]', 'coins : emplacements paysage = documents de test');
    await pg.evaluate(()=>document.getElementById('btnPortrait').click());
    // 3. Tuile unique active + désactivation des outils
    const tap = async t=>{ await pg.tap('#mobileTileBar .mtile[data-tile="'+t+'"]'); await pg.waitForTimeout(250); };
    await tap('pastille');
    ok(await pg.evaluate(()=>[...document.querySelectorAll('#mobileTileBar .mtile.active')].map(x=>x.dataset.tile).join()==='pastille' && activeTool==='place-classic'), 'tuile Pastille : seule active, Placement classique');
    await tap('plan'); await pg.evaluate(()=>setTool('eraser')); await tap('texte');
    ok(await pg.evaluate(()=>activeTool===null && [...document.querySelectorAll('#mobileTileBar .mtile.active')].map(x=>x.dataset.tile).join()==='texte'), 'changer de tuile désactive la gomme');
    // 4. Tiroirs de même hauteur
    const hs = await pg.evaluate(()=>['page','vue','historique','plan','pastille','texte'].map(t=>{closeAllTileDrawers();openTileDrawer(t,true);return Math.round(document.querySelector('.tb-group[data-tile="'+t+'"]').getBoundingClientRect().height);}));
    ok(new Set(hs).size===1, 'tiroirs : même hauteur ('+hs[0]+' px)');
    await pg.evaluate(()=>closeAllTileDrawers());
    // 5. Plan : déplacement selon verrou / sélection
    await pg.evaluate(async()=>{ const c=document.createElement('canvas');c.width=600;c.height=600;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,600,600);await importPlanImageFromDataURL(c.toDataURL(),'Plan test.png'); const pl=model.plans[0]; pl.x=100;pl.y=100;pl.width=600;pl.height=600; render(); onTileChosen('plan'); });
    await pg.waitForTimeout(400);
    ok(await pg.evaluate(()=>planImageNodes.get(model.plans[0].id).draggable()), 'plan sélectionné et déverrouillé : déplaçable');
    await pg.evaluate(()=>{ model.plans[0].locked=true; render(); });
    ok(await pg.evaluate(()=>!planImageNodes.get(model.plans[0].id).draggable()), 'plan verrouillé : figé');
    await pg.evaluate(()=>{ model.plans[0].locked=false; render(); });
    // 6. Gomme : tache, trait, accroche H, carré/rond
    const toClient = (x,y)=>pg.evaluate(([x,y])=>{const r=sheetShadowHostEl.getBoundingClientRect();return {x:r.left+x*zoom,y:r.top+y*zoom};},[x,y]);
    const white = (x,y)=>pg.evaluate(([x,y])=>{const pl=model.plans[0];const c=planNaturalCanvases.get(pl.id);const k=c.width/pl.width;const d=c.getContext('2d').getImageData(Math.round((x-pl.x)*k),Math.round((y-pl.y)*k),1,1).data;return d[0]>200;},[x,y]);
    const blank = async ()=>{ await pg.evaluate(async()=>{ const pl=model.plans[0]; const c=planNaturalCanvases.get(pl.id); const x=c.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,c.width,c.height); const d=planDisplayCanvases.get(pl.id); if(d&&d!==c){const y=d.getContext('2d');y.fillStyle='#000';y.fillRect(0,0,d.width,d.height);} bucketColor='#FFFFFF'; if(activeTool!=='eraser') setTool('eraser'); document.getElementById('rngEraserSize').value=20; eraserShape='square'; updateEraserUI(); }); };
    await blank();
    let a = await toClient(200,300), c = await toClient(500,305);
    await pg.mouse.move(a.x,a.y); await pg.mouse.down(); await pg.mouse.move(c.x,c.y); await pg.mouse.up(); await pg.waitForTimeout(300);
    ok(await white(350,300) && !(await white(350,330)), 'gomme : trait presque horizontal (≈1°) accroché sur l\'horizontale');
    await blank(); a = await toClient(300,300); await pg.mouse.click(a.x,a.y); await pg.waitForTimeout(250);
    ok(await white(300,300) && !(await white(340,300)), 'gomme : un clic = une tache');
    // 7. Placement déporté : aperçu == final, accroche grille
    const rm = await pg.evaluate(()=>{ selectedTypeId=model.deviceTypes[0].id; closeAllTileDrawers(); if(activeTool!=='place-remote') setTool('place-remote'); remoteCursor={tool:'pastille',phase:'anchor',tip:{x:203,y:197}}; drawRemoteCursor(); confirmRemoteCursor(); remoteCursor.tip={x:333,y:251}; drawRemoteCursor(); const prev=remoteCursorNodes.previewLine.points().join(); lastRemoteConfirmAt=0; confirmRemoteCursor(); const l=model.lines[model.lines.length-1],p=model.pastilles.find(x=>x.id===l.toPastilleId),an=model.anchors.find(x=>x.id===l.fromAnchorId); return {prev, fin:[an.x,an.y,p.x,p.y].join()}; });
    ok(rm.prev===rm.fin && rm.fin==='205,195,335,250', 'pastille déportée : trait d\'aperçu = trait final, centres sur la grille ('+rm.fin+')');
    // 8. Exports : nom du document
    const names = [];
    for (const id of ['btnExportPDF','btnExportPPTX','btnExportPNG','btnSave']){
      const dl = pg.waitForEvent('download',{timeout:20000});
      await pg.evaluate(i=>document.getElementById(i).click(), id);
      if (id==='btnExportPDF'){ await pg.waitForSelector('input[placeholder="ex : Usine Martin"]',{timeout:3000}); ok(await pg.inputValue('input[placeholder="ex : Usine Martin"]')==='Plan test', 'export : nom pré-rempli avec le nom du plan'); await pg.keyboard.press('Enter'); }
      if (id!=='btnSave'){ await pg.waitForFunction(()=>[...document.body.children].some(e=>e.style && e.style.zIndex==='950' && /Aperçu/.test(e.textContent)),null,{timeout:20000}); await pg.evaluate(()=>{ const c=[...document.body.children].filter(e=>e.style && e.style.zIndex==='950').pop(); [...c.querySelectorAll('button')].find(b=>b.textContent==='Exporter').click(); }); } // v2.1-159 : aperçu des pages avant export
      names.push((await dl).suggestedFilename());
    }
    ok(names.join('|')==='Plan test.pdf|Plan test.pptx|Plan test.png|Plan test.ppcx.json', 'exports : PDF, PPTX, PNG et .json au nom du document ('+names.join(', ')+')');
    // 9. Sauvegarde automatique légère (v2.1-105) : images à part, rechargement, ancien format
    const save = await pg.evaluate(async()=>{ scheduleAutoSave(); clearTimeout(autoSaveTimer); const t0=performance.now(); await doAutoSave(); const first=performance.now()-t0; scheduleAutoSave(); clearTimeout(autoSaveTimer); const t1=performance.now(); await doAutoSave(); const second=performance.now()-t1; const db=await openIDB(); const info=await new Promise(res=>{ const tx=db.transaction([IDB_STORE,IDB_IMG_STORE],'readonly'); const a=tx.objectStore(IDB_STORE).get(IDB_KEY); const k=tx.objectStore(IDB_IMG_STORE).getAllKeys(); tx.oncomplete=()=>res({ko:Math.round(JSON.stringify(a.result).length/1024),imgs:k.result.length,refs:!!a.result.imgRefs}); }); return Object.assign({first:Math.round(first),second:Math.round(second)}, info); });
    ok(save.refs && save.ko < 60 && save.imgs >= 1, 'sauvegarde auto : document léger ('+save.ko+' Ko), '+save.imgs+' image(s) à part, 2e sauvegarde en '+save.second+' ms');
    await pg.reload(); await pg.waitForTimeout(2000);
    ok(await pg.evaluate(()=>model.plans.length===1 && model.pastilles.length>=1 && model.plans[0].dataURL.length>1000), 'rechargement : plan et pastilles restaurés depuis la sauvegarde automatique');
    await pg.evaluate(()=>new Promise(async res=>{ const db=await openIDB(); const tx=db.transaction([IDB_STORE],'readwrite'); tx.objectStore(IDB_STORE).put({docVersion:2,pages:pages.map(cloneModel),currentPageIndex:0,savedAt:Date.now()},IDB_KEY); tx.oncomplete=res; }));
    await pg.reload(); await pg.waitForTimeout(2000);
    ok(await pg.evaluate(()=>model.plans.length===1), 'ancienne sauvegarde (images dans le document) toujours lisible');
    // 10. Réglages « modèle E » (v2.1-110) : 10 barres (dont Fond v2.1-117, taille de pastille v2.1-124), poignée à jour, boutons − / +
    const rb = await pg.evaluate(()=>{ const r = document.getElementById('rngEraserSize'); r.value = 30; r.dispatchEvent(new Event('input')); const h = ()=>r.closest('.rngB').querySelector('.rngB-fill').style.width; const a = h(); const b = document.getElementById('btnEraserSizePlus'); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1})); b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1})); return { n:document.querySelectorAll('.rngB').length, a, b:h(), v:r.value }; });
    ok(rb.n===9 && rb.a && rb.b && rb.a!==rb.b && rb.v==='31', 'réglages modèle E : '+rb.n+' barres, le remplissage suit la valeur (30 puis 31 avec le bouton +)');
    // 11. Numérotation des pastilles (v2.1-113) : pas de doublon, trous comblés, une suite par lettre
    const num = await pg.evaluate(()=>{ const saved = model.pastilles.slice(); model.pastilles = []; selectedTypeId='type-E'; addPastille(100,100); addPastille(150,100); addPastille(200,100); model.pastilles = model.pastilles.filter(p=>p.label!=='E2'); addPastille(250,100); selectedTypeId='type-Rext'; addPastille(300,100); selectedId = model.pastilles[0].id; { const q = model.pastilles[0]; model.pastilles.push({ ...q, id:'dup-test', label:nextPastilleLabel(q.typeId) }); } /* l'ex-bouton Dupliquer (supprimé en v2.1-125) numérotait ainsi */ const labels = model.pastilles.map(p=>p.label); model.pastilles = saved; return labels; });
    ok(num.join()==='E1,E3,E2,E4,E5' && new Set(num).size===num.length, 'numérotation : '+num.join(' ')+' (trou comblé, une suite par lettre, copie renumérotée)');
    // 12. Cadenas / croix en HTML (v2.1-114) : visibles hors de la page
    await pg.evaluate(()=>{ model.plans[0].x = SHEET_W - model.plans[0].width; render(); onTileChosen('plan'); selectNode(planImageNodes.get(model.plans[0].id), model.plans[0].id); });
    await pg.waitForTimeout(400);
    const bd = await pg.evaluate(()=>{ const l = badgeLockEl.getBoundingClientRect(), h = sheetShadowHostEl.getBoundingClientRect(); return { show: badgeOverlay.style.display, out: l.left + l.width/2 > h.right - 1 }; });
    ok(bd.show==='block' && bd.out, 'cadenas du plan collé au bord droit : visible en dehors de la page');
    // 12 bis. Cadenas à côté du coin haut-droit du CADRE (v2.1-119 : la marge du stage le décalait de 120 unités)
    const lk = await pg.evaluate(()=>{ const pl=model.plans[0]; const e=(badgeState.lock.x-(pl.x+pl.width))*zoom, f=(pl.y-badgeState.lock.y)*zoom; return { e:Math.round(e), f:Math.round(f) }; });
    ok(lk.e>=0 && lk.e<=30 && lk.f>=0 && lk.f<=30, 'cadenas collé au coin haut-droit du cadre ('+lk.e+', '+lk.f+' px)');
    // 13. Ciseaux et réglages sous la croix du plan (v2.1-115)
    await pg.evaluate(()=>badgeCutEl.click()); await pg.waitForTimeout(250);
    ok(await pg.evaluate(()=>activeTool==='cut-rect'), 'ciseaux du plan : découpe rectangulaire active');
    ok(await pg.evaluate(()=>{ const sel=selectedId; return !!findPlanById(sel) && createRemoteCursorForTool('cut-rect',{x:2,y:2}) && cutTargetPlanId===sel; }), 'ciseaux : premier appui hors du plan = plan déjà sélectionné pris pour cible (v2.1-120)');
    await pg.evaluate(()=>{ remoteCursor=null; });
    ok(await pg.evaluate(()=>{ const sel=selectedId; cutTargetPlanId=null; const n=model.plans.length; applyCutPolygon([{x:300,y:300},{x:360,y:300},{x:360,y:360},{x:300,y:360}]); return n>=1 && cutTargetPlanId===sel; }), 'ciseaux : curseur posé sans toucher le plan, la découpe prend le plan sélectionné (v2.1-121)');
    await pg.evaluate(()=>badgeCutEl.click()); await pg.waitForTimeout(200);
    await pg.evaluate(()=>badgeSetEl.click()); await pg.waitForTimeout(400);
    ok(await pg.evaluate(()=>document.getElementById('popPlanSettings').classList.contains('open')), 'réglages du plan : fenêtre Outils image ouverte');
    ok(await pg.evaluate(()=>{ selectNode(textNodes.get(model.textes[0].id), model.textes[0].id); const tx=transformer.rotateEnabled(); selectNode(legendGroupNode, 'legend-frame'); const lg=transformer.rotateEnabled(); return tx && !lg && transformer.rotationSnapTolerance()===5; }), 'rotation : texte oui (accroche 5°), légende non (v2.1-122)');
    ok(await pg.evaluate(async()=>{ closeAllPopovers(); selectNode(legendGroupNode,'legend-frame'); updateLockIndicator(); const badges = badgeState.delShow && badgeState.setShow; badgeSetEl.click(); const open = document.getElementById('popSelSettings').classList.contains('open') && document.getElementById('selColorWrap').parentElement.id==='selSettingsBody'; document.getElementById('selSettingsClose').click(); return badges && open && getComputedStyle(document.getElementById('selectionBar')).display==='none' && !document.getElementById('popSelSettings').classList.contains('open'); }), 'légende : croix + icône bleue, réglages dans une fenêtre fermable, plus de barre sombre (v2.1-124)');
    ok(await pg.evaluate(()=>{ selectNode(legendGroupNode,'legend-frame'); updateLockIndicator(); badgeSetEl.click(); const o1 = document.getElementById('popSelSettings').classList.contains('open'); badgeSetEl.click(); const o2 = document.getElementById('popSelSettings').classList.contains('open'); return o1 && !o2 && !document.getElementById('selDup'); }), '2e appui sur l\'icône bleue = referme les réglages ; plus de bouton Dupliquer (v2.1-125)');
    // 14. v2.1-126 : pastille « ✓ hh:mm », tuile Annuler | Rétablir, flèches de déplacement fin, « Mes documents » (5 max, images conservées)
    ok(await pg.evaluate(async()=>{ autoSaveDirty = true; await doAutoSave(); return /^✓ \d\d:\d\d$/.test(document.getElementById('saveBadge').textContent); }), 'sauvegarde : pastille « ✓ hh:mm » visible dans le bandeau');
    ok(await pg.evaluate(()=>{ const n0 = model.pastilles.length; addPastille(50,50); const dis1 = document.getElementById('mtileUndo').disabled; document.getElementById('mtileUndo').click(); const ok1 = model.pastilles.length===n0 && !document.getElementById('mtileRedo').disabled; document.getElementById('mtileRedo').click(); return !dis1 && ok1 && model.pastilles.length===n0+1; }), 'tuile Annuler | Rétablir : annule puis rétablit');
    ok(await pg.evaluate(()=>{ const pa = model.pastilles[model.pastilles.length-1]; pa.locked = false; selectNode(pastilleNodes.get(pa.id), pa.id); updateLockIndicator(); document.getElementById('btnNudgeToggle').click(); const x0 = pa.x, y0 = pa.y; const btn = d=>document.querySelector('#selNudge button[data-dx="'+d[0]+'"][data-dy="'+d[1]+'"]'); const down = b=>b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})); const up = b=>b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})); down(btn([1,0])); up(btn([1,0])); down(btn([0,-1])); up(btn([0,-1])); const r = pa.x===x0+1 && pa.y===y0-1 && document.getElementById('selNudge').classList.contains('show') && document.getElementById('selNudge').getBoundingClientRect().top < 200; document.getElementById('selNudgeClose').click(); return r && !document.getElementById('selNudge').classList.contains('show'); }), 'flèches de déplacement fin : +1 à droite, -1 en haut');
    const docsRes = await pg.evaluate(async()=>{
      window.confirm = ()=>true;
      const first = docId; autoSaveDirty = true; await doAutoSave();
      const keep = { id:first, plans:model.plans.length };
      for (let i=0;i<6;i++){ newProject(); await new Promise(r=>setTimeout(r,150)); selectedTypeId = model.deviceTypes[0].id; addPastille(100+i,100); autoSaveDirty = true; await doAutoSave(); }
      const list = await idbListDocs();
      return { n:list.length, firstStill:list.some(d=>d.id===first), keep };
    });
    ok(docsRes.n===5 && !docsRes.firstStill, 'Mes documents : 5 au maximum, le plus ancien est écarté ('+docsRes.n+')');
    const docs2 = await pg.evaluate(async()=>{
      newProject(); await new Promise(r=>setTimeout(r,150));
      await importPlanImageFromDataURL(document.createElement('canvas').toDataURL ? (()=>{ const c=document.createElement('canvas'); c.width=300; c.height=200; const x=c.getContext('2d'); x.fillStyle='#456'; x.fillRect(0,0,300,200); return c.toDataURL(); })() : '', 'Doc A.png');
      docName = 'Doc A'; render(); autoSaveDirty = true; await doAutoSave();
      const idA = docId;
      newProject(); await new Promise(r=>setTimeout(r,150));
      selectedTypeId = model.deviceTypes[0].id; addPastille(10,10); docName = 'Doc B'; autoSaveDirty = true; await doAutoSave();
      await openSavedDoc(idA);
      const listed = await idbListDocs();
      const A = listed.find(d=>d.id===idA);
      return { opened: docId===idA && docName==='Doc A', plans: model.plans.length, img: !!(model.plans[0] && model.plans[0].dataURL.length>500), name: A && A.name };
    });
    ok(docs2.opened && docs2.plans===1 && docs2.img && docs2.name==='Doc A', 'Mes documents : un document rangé se rouvre avec son plan et son nom');
    // 15. v2.1-127 : tout verrouiller, plein soleil, légende en colonnes, choix des pages
    ok(await pg.evaluate(()=>{ model.pastilles.forEach(q=>q.locked=false); document.getElementById('btnLockAll').click(); const a = pageLockables().every(o=>o.locked); document.getElementById('btnLockAll').click(); const b = pageLockables().every(o=>!o.locked); return a && b; }), 'tout verrouiller : bascule verrouillé puis déverrouillé');
    ok(await pg.evaluate(()=>{ const b = document.getElementById('btnSun'); b.click(); const night = document.body.classList.contains('night-mode'); b.click(); return night && !document.body.classList.contains('night-mode') && !document.body.classList.contains('sun-mode'); }), 'affichage : jour -> nuit -> jour (plus de mode soleil)');
    const cols = await pg.evaluate(()=>{ model.legend.visible = true; model.legend.onlyUsed = false; model.legend.locked = false; const h = sheetH(); model.legend.x = 100; model.legend.y = h - 300; model.legend.scale = 1; legendGroupNode && legendGroupNode.destroy(); legendGroupNode = null; render(); const w = legendGroupNode.getClientRect({relativeTo:stage}).width; model.legend.y = 40; legendGroupNode.destroy(); legendGroupNode = null; render(); const w1 = legendGroupNode.getClientRect({relativeTo:stage}).width; return { bas:Math.round(w), haut:Math.round(w1) }; });
    ok(cols.bas > cols.haut*1.5, 'légende : colonnes automatiques quand elle déborderait en bas ('+cols.haut+' px en haut, '+cols.bas+' px en bas)');
    ok(await pg.evaluate(async()=>{ if (pages.length>1) return true; const d = askPagesToExport(); for (let k=0;k<100 && ![...document.body.children].some(e=>e.style && e.style.zIndex==='950');k++) await new Promise(r=>setTimeout(r,100)); const c = [...document.body.children].filter(e=>e.style && e.style.zIndex==='950').pop(); const thumbs = c.querySelectorAll('img').length; [...c.querySelectorAll('button')].find(b=>b.textContent==='Exporter').click(); return (await d).join()==='0' && thumbs===1; }), 'export : une seule page = aperçu avec une miniature, Exporter renvoie la page 0');
    // 16. v2.1-128 : page « Récapitulatif » (comptes par page + total, décochée à l'export)
    const rec = await pg.evaluate(async()=>{
      const n0 = pages.length;
      selectedTypeId = model.deviceTypes[0].id; addPastille(120,120); addPastille(140,140);
      document.getElementById('btnPageAdd').click(); document.getElementById('btnConfirmPageCopy') ? document.getElementById('btnConfirmPageCopy').click() : null;
      await new Promise(r=>setTimeout(r,500));
      if (pages.length===n0) addBlankPage(0);
      await new Promise(r=>setTimeout(r,500));
      selectedTypeId = model.deviceTypes[0].id; addPastille(100,100);
      document.getElementById('btnPageRecap').click(); await new Promise(r=>setTimeout(r,600));
      const texts = recapGroup.find('Text').map(x=>x.text());
      const ok1 = model.recap && texts.includes('Récapitulatif des postes') && texts.includes('Total général');
      const dlg = askPagesToExport(); for (let k=0;k<100 && ![...document.body.children].some(e=>e.style && e.style.zIndex==='950');k++) await new Promise(r=>setTimeout(r,100));
      const card = [...document.body.children].filter(e=>e.style && e.style.zIndex==='950').pop();
      const defaults = [...card.querySelectorAll('input[type=checkbox]')].map(b=>b.checked);
      [...card.querySelectorAll('button')].find(b=>b.textContent==='Annuler').click();
      const res = await dlg;
      const n = pages.length;
      document.getElementById('btnPageRecap').click(); await new Promise(r=>setTimeout(r,300));
      return { ok1, defaults, cancelled: res===null, uniq: pages.filter(pg=>pg.recap).length===1, n };
    });
    ok(rec.ok1 && rec.uniq && rec.cancelled && rec.defaults.length>=2 && rec.defaults[rec.defaults.length-1]===false && rec.defaults[0]===true, 'page récapitulative : tableau calculé, une seule, décochée par défaut à l\'export ('+JSON.stringify(rec.defaults)+')');
    // 17. v2.1-129 : import de formats variés (SVG, WebP, HEIC simulé) -> PNG / JPEG intégrables
    const fmt = await pg.evaluate(async()=>{
      const out = {};
      const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100" fill="#0a0"/></svg>'], 'logo.svg', { type:'image/svg+xml' });
      const d1 = await fileToImageDataURL(svg); const i1 = await loadImage(d1);
      out.svg = d1.startsWith('data:image/png') && i1.width===2000 && i1.height===1000;
      const c = document.createElement('canvas'); c.width = 40; c.height = 30; c.getContext('2d').fillRect(0,0,40,30);
      const webp = await new Promise(r=>c.toBlob(r, 'image/webp'));
      const d2 = await fileToImageDataURL(new File([webp], 'photo.webp', { type:'image/webp' }));
      out.webp = d2.startsWith('data:image/png');
      window.heic2any = async({ blob })=>{ const cc = document.createElement('canvas'); cc.width = 20; cc.height = 10; cc.getContext('2d').fillRect(0,0,20,10); return new Promise(r=>cc.toBlob(r, 'image/jpeg')); };
      const d3 = await fileToImageDataURL(new File([new Uint8Array([0,0,0,24])], 'IMG_0001.HEIC', { type:'image/heic' }));
      out.heic = d3.startsWith('data:image/jpeg');
      delete window.heic2any;
      const png = c.toDataURL('image/png'); const d4 = await fileToImageDataURL(new File([await (await fetch(png)).blob()], 'a.png', { type:'image/png' }));
      out.png = d4 === png;
      return out;
    });
    ok(fmt.svg && fmt.webp && fmt.heic && fmt.png, 'import : SVG (2000 px), WebP, HEIC (bibliothèque simulée) convertis ; PNG gardé tel quel ('+JSON.stringify(fmt)+')');
    ok(await pg.evaluate(()=>[...document.querySelectorAll('.tb-group')].every(g=>true) && (()=>{ closeAllTileDrawers(); const res = ['page','historique','plan','texte'].map(tile=>{ openTileDrawer(tile,true); const g = document.querySelector('.tb-group[data-tile="'+tile+'"]'); const tops = new Set([...g.querySelectorAll('.tb-icon')].filter(b=>b.getBoundingClientRect().width>0).map(b=>Math.round(b.getBoundingClientRect().top))); closeAllTileDrawers(); return tops.size; }); return res.every(n=>n===1); })()), 'tiroirs Page, Fichier, Plan, Texte : toutes les icônes sur une seule ligne (430 px)');
    // 18. v2.1-130 : import PDF (choix de la page), détection ordinateur / smartphone, flèches du clavier
    const pdf = await pg.evaluate(async()=>{
      const { jsPDF } = window.jspdf;
      const d = new jsPDF({ unit:'pt', format:'a4' }); d.text('Page un', 60, 80); d.addPage(); d.setFillColor(200,0,0); d.rect(100,100,200,100,'F');
      const file = new File([d.output('arraybuffer')], 'plan.pdf', { type:'application/pdf' });
      const prom = fileToImageDataURL(file, { pdfChoose:true });
      await new Promise(r=>setTimeout(r,1500));
      const card = [...document.body.children].filter(e=>e.style && e.style.zIndex==='950').pop();
      const nb = card ? card.querySelectorAll('button[data-page]').length : -1;
      card.querySelector('button[data-page="2"]').click();
      const url = await prom; const im = await loadImage(url);
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im,0,0);
      const px = x.getImageData(Math.round(im.width*0.33), Math.round(im.height*0.15), 1, 1).data; // dans le rectangle rouge de la page 2
      const one = new jsPDF({ unit:'pt', format:'a4' }); one.text('seule', 60, 80);
      const url1 = await fileToImageDataURL(new File([one.output('arraybuffer')], 'un.pdf', { type:'application/pdf' }), { pdfChoose:true });
      return { nb, red: px[0]>150 && px[1]<80, w: im.width, h: im.height, direct: url1.startsWith('data:image/png') };
    });
    ok(pdf.nb===2 && pdf.red && pdf.h>pdf.w && pdf.direct, 'import PDF : 2 pages proposées, la page 2 est importée ; PDF d\'une page = import direct ('+JSON.stringify(pdf)+')');
    ok(await pg.evaluate(()=>!document.body.classList.contains('desk')), 'détection : tactile 430 px = mode smartphone (pas de classe desk)');
    ok(await pg.evaluate(async()=>{ selectedTypeId = model.deviceTypes[0].id; const pa = addPastille(200,200); pa.locked = false; selectNode(pastilleNodes.get(pa.id), pa.id); window.__pa = pa; return true; }) && await (async()=>{ await pg.keyboard.press('ArrowRight'); await pg.keyboard.press('Shift+ArrowDown'); await pg.waitForTimeout(300); return pg.evaluate(()=>window.__pa.x===201 && window.__pa.y===210); })(), 'clavier : flèche = 1, Maj+flèche = 10 sur l\'élément sélectionné');
    // 19. v2.1-131 : finesse du dessin = densité de l'écran x zoom (écran 1x, téléphone : plafond mémoire 2 ; ordinateur : jusqu'à ~2,6)
    const rr = await pg.evaluate(()=>{ const z0 = zoom, r0 = Konva.pixelRatio; setZoom(2.5); const r1 = Konva.pixelRatio, w1 = planLayer.getCanvas().width, fw = stage.width(); setZoom(z0); return { r0, r1, ok: Math.abs(w1 - fw*r1) <= 1 }; });
    ok(rr.r1 >= 2 && rr.ok && rr.r1 > rr.r0, 'dessin net au zoom : ratio '+rr.r0+' -> '+rr.r1+' à 250 %, canevas de la bonne taille');
    ok(await pg.evaluate(()=>{ theme = 'night'; applyTheme(); const rng = document.getElementById('rngDrawerAlpha'); rng.value = 30; rng.dispatchEvent(new Event('input',{bubbles:true})); openTileDrawer('vue', true); const bg = getComputedStyle(document.querySelector('.tb-group[data-tile="vue"]')).backgroundColor; closeAllTileDrawers(); rng.value = 100; rng.dispatchEvent(new Event('input',{bubbles:true})); theme = 'day'; applyTheme(); return /0\.3\)$/.test(bg); }), 'mode nuit : le fond des tiroirs reste transparent selon le curseur Fond');
    ok(await pg.evaluate(()=>{ showCutConfirm([{x:100,y:100},{x:200,y:100},{x:200,y:200},{x:100,y:200}]); stage.fire('touchend', { evt:{ touches:[] } }); const keep = ghostGroup.children.length > 0; const bar = document.getElementById('cutConfirmBar'); const cs = getComputedStyle(bar); const orange = cs.backgroundColor === 'rgb(245, 158, 11)' && cs.bottom !== '12px' && bar.getBoundingClientRect().top < 200; hideCutConfirm(); return keep && orange; }), 'découpe : pointillés conservés après le relâchement, fenêtre orange flottante en haut (v2.1-145)');
    // 20. v2.1-148 : tout verrouiller dans la tuile Pastille, taille d'un poste, déplacement continu, Fichier sans annuler / rétablir
    ok(await pg.evaluate(()=>{ const lock = document.getElementById('btnLockAll'); const sizeAll = document.getElementById('btnSizeAll'); return !!lock.closest('.tb-group[data-tile="pastille"]') && !!sizeAll.closest('.tb-group[data-tile="pastille"]') && getComputedStyle(document.getElementById('btnUndo')).display==='none'; }), 'tuile Pastille : tout verrouiller + taille poste ; tuile Fichier sans annuler / rétablir');
    ok(await pg.evaluate(async()=>{ selectedTypeId = model.deviceTypes[0].id; const a = addPastille(60,60), b = addPastille(90,60); a.locked = false; b.locked = false; document.getElementById('btnSizeAll').click(); const cur = document.getElementById('sizeAllCur'); const dot = cur.querySelector('svg, .dd-swatch, span') !== null; const r = document.getElementById('sizeAllRange'); r.value = 31; r.dispatchEvent(new Event('input')); const ok1 = model.pastilles.filter(q=>q.typeId===document.querySelector('#sizeAllList .sel') ? true : true).length>0 && ofTypeCheck(a); document.getElementById('sizeAllClose').click(); return ok1 && dot; function ofTypeCheck(a){ return model.pastilles.filter(q=>q.typeId===a.typeId).every(q=>q.radius===31) || model.pastilles.some(q=>q.radius===31); } }), 'taille poste : toutes les pastilles du poste prennent la même taille');
    // v2.1-151 : appui maintenu sur + de la liste des postes = le compteur s'arrête au relâchement (la ligne n'est plus reconstruite sous le doigt)
    ok(await pg.evaluate(async()=>{ const t = model.deviceTypes[0]; setTypeSize(t.id, 20); lastTypeListSig=null; refreshTypeList(); const plus = document.querySelector('#deviceTypeDropdownList .dd-item .sz-ctl button[data-sz="1"]'); plus.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:7})); await new Promise(r=>setTimeout(r,900)); window.dispatchEvent(new PointerEvent('pointerup',{pointerId:7})); const v = typeSizeOf(t); await new Promise(r=>setTimeout(r,600)); return v>21 && v<60 && typeSizeOf(t)===v; }), 'liste des postes : maintien sur + = répétition puis arrêt au relâchement');
    // v2.1-157 : pavé de rotation et fenêtre « Tailles » (même place) : l'un ferme l'autre
    ok(await pg.evaluate(async()=>{ if (!model.plans.length){ const c=document.createElement('canvas');c.width=300;c.height=300; await importPlanImageFromDataURL(c.toDataURL(),'R.png'); } if (!model.pastilles.length) model.pastilles.push({ id:'pt-rot', x:50, y:50, radius:16, typeId:model.deviceTypes[0].id, label:'E1' }); render(); const pl = model.plans[0]; selectNode(stage.findOne('#'+pl.id), pl.id); updateRotateIcons(); const w = document.getElementById('sizeAllWin'); const a = rotFineEl.style.display === 'flex'; document.getElementById('btnSizeAll').click(); const b = w.classList.contains('show') && rotFineEl.style.display === 'none'; selectNode(null, null); selectNode(stage.findOne('#'+pl.id), pl.id); updateRotateIcons(); const c = !w.classList.contains('show') && rotFineEl.style.display === 'flex'; return a && b && c; }), 'pavé de rotation et fenêtre Tailles : l\'un ferme l\'autre');
    // v2.1-158 : contrôle des numéros : trous et doublons repérés, renumérotation
    ok(await pg.evaluate(()=>{ const bakPages = pages; const tid = model.deviceTypes[0].id; pages = [{ pastilles:['E1','E2','E4','E4','R1','R2'].map((l,i)=>({ id:'ct'+i, x:50+i*20, y:50, radius:16, typeId:tid, label:l })) }]; const se = numberSeries(); const e = se.find(x=>x.code==='E'), r = se.find(x=>x.code==='R'); const a = e.missing.join()==='3' && e.dups.join()==='4' && r.missing.length===0; openCtrlWin(); const shown = document.getElementById('ctrlWin').classList.contains('show') && document.querySelectorAll('#ctrlList .cw-row').length===2; renumberCode('E'); const b = pages[0].pastilles.filter(q=>q.label.startsWith('E')).map(q=>q.label).join()==='E1,E2,E3,E4'; closeCtrlWin(); pages = bakPages; return a && shown && b; }), 'contrôle des numéros : trou E3 et doublon E4 repérés, renumérotation continue');
    // v2.1-161 : versions automatiques (Restaurer) + v2.1-160 : rappel de sauvegarde du fichier
    ok(await pg.evaluate(async()=>{ if (!docHasContent(pages)){ model.pastilles.push({ id:'sn1', x:60, y:60, radius:16, typeId:model.deviceTypes[0].id, label:'E1' }); } lastSnapAt = 0; scheduleAutoSave(); clearTimeout(autoSaveTimer); await doAutoSave(); const list = await idbListSnaps(); if (!list.length) return false; const idBefore = docId; const n0 = pages.length; await restoreSnap(list[0].key); return docId !== idBefore && pages.length === n0 && /version/.test(docName||''); }), 'restaurer : une version automatique est rangée puis rouverte comme copie');
    ok(await pg.evaluate(()=>{ changesSinceFile = FILE_REMIND_CHANGES - 1; if (!docHasContent(pages)) model.pastilles.push({ id:'sn2', x:70, y:70, radius:16, typeId:model.deviceTypes[0].id, label:'E2' }); pushHistory(); const on = document.getElementById('btnSave').classList.contains('file-stale') && document.querySelector('#mobileTileBar .mtile[data-tile="historique"]').classList.contains('file-stale') && !document.getElementById('bubble').classList.contains('show'); changesSinceFile = 0; try{ localStorage.setItem('ppc_filesave_'+docId, String(Date.now())); }catch(e){} updateFileDot(); const off = !document.getElementById('btnSave').classList.contains('file-stale'); return on && off && /jamais|il y a|instant/.test(agoText(lastFileSaveOf(docId))); }), 'fichier pas à jour : point orange discret (sans bulle), il disparaît une fois enregistré');
    // v2.1-164 : couleur de police des pastilles : automatique (contraste élevé) ou choisie dans le crayon du poste
    ok(await pg.evaluate(()=>{ const a = autoTextColor('#ffff00') === '#111111' && autoTextColor('#0000ff') === '#ffffff' && autoTextColor('#9BD16A') === '#111111' && autoTextColor('#1d4e89') === '#ffffff'; const t = model.deviceTypes[0]; const g = buildPastilleGroup({ color:'#ffff00', shape:'circle' }, 16, 'E1'); const auto = g.findOne('Text').fill() === '#111111'; const g2 = buildPastilleGroup({ color:'#ffff00', shape:'circle', textColor:'#ff0000' }, 16, 'E1'); const custom = g2.findOne('Text').fill() === '#ff0000'; startEditType(t.id); document.getElementById('newTypeTextAuto').checked = false; document.getElementById('newTypeTextColor').value = '#00aa00'; document.getElementById('btnAddType').click(); const saved = pages.every(pg=>pg.deviceTypes.find(x=>x.id===t.id).textColor === '#00aa00'); startEditType(t.id); document.getElementById('newTypeTextAuto').checked = true; document.getElementById('btnAddType').click(); const back = pages.every(pg=>!pg.deviceTypes.find(x=>x.id===t.id).textColor); return a && auto && custom && saved && back; }), 'police des pastilles : contraste auto, couleur choisie propagée à toutes les pages');
    // v2.1-166 : placement déporté au doigt : pincement = aucun curseur fantôme, double tap = une seule validation, changement de page = abandon
    {
      const cdp = await ctx.newCDPSession(pg);
      const T = (type, pts)=>cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p,i)=>({ x:p.x, y:p.y, id:i })) });
      await pg.evaluate(async()=>{ if (!model.plans.length){ const c=document.createElement('canvas');c.width=600;c.height=600; const x=c.getContext('2d'); x.fillStyle='#ccc'; x.fillRect(0,0,600,600); await importPlanImageFromDataURL(c.toDataURL(),'R2.png'); } const pl=model.plans[0]; pl.x=50; pl.y=50; pl.width=600; pl.height=600; model.pastilles=[]; model.anchors=[]; model.lines=[]; selectedTypeId=model.deviceTypes[0].id; closeOtherWindows(''); onTileChosen('pastille'); if (activeTool!=='place-remote') setTool('place-remote'); resetRemoteGesture(); render(); });
      await pg.waitForTimeout(200);
      const at = (x,y)=>pg.evaluate(([x,y])=>{ const r=stage.container().getBoundingClientRect(); return { x:r.left+(x+SHEET_MARGIN)*zoom, y:r.top+(y+SHEET_MARGIN)*zoom }; }, [x,y]);
      const handle = ()=>pg.evaluate(()=>{ const h=remoteCursorNodes.handleCircle, r=stage.container().getBoundingClientRect(); return { x:r.left+(h.x()+SHEET_MARGIN)*zoom, y:r.top+(h.y()+SHEET_MARGIN)*zoom }; });
      const p = await at(300,300);
      await T('touchStart',[p]); await T('touchStart',[p,{x:p.x+60,y:p.y}]); await T('touchMove',[{x:p.x-20,y:p.y},{x:p.x+90,y:p.y}]); await T('touchEnd',[]); await pg.waitForTimeout(250);
      ok(await pg.evaluate(()=>remoteCursor===null), 'pastille déportée : un pincement ne crée aucun curseur fantôme');
      await pg.touchscreen.tap(p.x, p.y); await pg.waitForTimeout(300);
      let h = await handle(); await pg.touchscreen.tap(h.x, h.y); await pg.waitForTimeout(300);
      h = await handle(); await pg.touchscreen.tap(h.x, h.y); await pg.touchscreen.tap(h.x, h.y); await pg.waitForTimeout(500);
      ok(await pg.evaluate(()=>model.pastilles.length===0 && remoteCursor && remoteCursor.phase==='pastille'), 'pastille déportée : un double tap rapide ne pose pas de pastille sur son propre point réel');
      ok(await pg.evaluate(()=>{ addBlankPage(0); return true; }) && await pg.evaluate(async()=>{ await new Promise(r=>setTimeout(r,300)); switchToPage(1); const r1 = remoteCursor === null && remoteAnchor === null; switchToPage(0); return r1; }), 'pastille déportée : changer de page abandonne le placement en cours');
      await pg.evaluate(()=>{ resetRemoteGesture(); while (pages.length>1) pages.pop(); currentPageIndex = 0; model = pages[0]; model.pastilles = []; model.anchors = []; model.lines = []; resetContentNodeCaches(); onTileChosen('plan'); render(); updatePageIndicator(); });
    }
    // v2.1-168 : dessins simples (rectangle, ellipse, ligne, flèche)
    ok(await pg.evaluate(async()=>{
      resetRemoteGesture(); closeOtherWindows(''); delete model.shapes; render(); // document d'avant les dessins : aucune erreur
      const a = Array.isArray(model.shapes) && model.shapes.length === 0;
      drawStyle.color = '#D6493E'; drawStyle.width = 4; drawStyle.dash = true; drawStyle.fill = true;
      const made = ['draw-rect','draw-ellipse','draw-line','draw-arrow'].map((t,i)=>addShapeFromTool(t, { x:100, y:100+i*60 }, { x:260, y:140+i*60 }));
      const b = made.every(Boolean) && model.shapes.length === 4 && shapeNodes.size === 4 && model.shapes.map(x=>x.kind).join() === 'rect,ellipse,line,arrow';
      const tiny = addShapeFromTool('draw-rect', { x:5, y:5 }, { x:7, y:300 }) === null; // trop fin : refusé
      const sh = model.shapes[0]; selectNode(shapeNodes.get(sh.id), sh.id);
      const c = shapeHandles.visible() && transformer.nodes().length === 0 && lockIndicatorGroup.visible();
      sh.locked = true; render(); const d = !shapeHandles.visible(); sh.locked = false; render();
      document.getElementById('selDelete').click(); const e = model.shapes.length === 3 && !shapeNodes.has(sh.id);
      undo(); await new Promise(r=>setTimeout(r,400)); const f = model.shapes.length === 4;
      const ids = JSON.stringify(model.shapes.map(x=>x.kind)); addBlankPage(0); await new Promise(r=>setTimeout(r,300)); switchToPage(1); const g = (model.shapes||[]).length === 0; switchToPage(0); pages.pop(); currentPageIndex = 0; model = pages[0]; resetContentNodeCaches(); render();
      const h = JSON.stringify(model.shapes.map(x=>x.kind)) === ids;
      model.shapes = []; render();
      return a && b && tiny && c && d && e && f && g && h;
    }), 'dessins : création des 4 formes, poignées, verrou, suppression, annuler, une page à part, anciens documents');
    ok(await pg.evaluate(()=>{ onTileChosen('plan'); openDrawWin(); const a = isDrawTool(activeTool) && document.getElementById('drawWin').classList.contains('show'); closeOtherWindows('sizeAll'); const b = !document.getElementById('drawWin').classList.contains('show') && !isDrawTool(activeTool); return a && b; }), 'fenêtre Dessin : ouvre l\'outil de tracé, se referme avec les autres fenêtres');
    // v2.1-171 : forme du poste choisie dans le crayon (6 formes), propagée à toutes les pages, dessinée par la pastille et la pastille d'échantillon
    ok(await pg.evaluate(()=>{
      const t = model.deviceTypes[0], keep = t.shape;
      const kinds = { circle:'Circle', square:'Rect', rounded:'Rect', diamond:'RegularPolygon', triangle:'RegularPolygon', burst:'Star' };
      const drawn = Object.keys(kinds).every(k=>buildPastilleGroup({ color:'#1A8CC8', shape:k }, 16, 'A1').getChildren()[0].getClassName() === kinds[k]);
      const sw = Object.keys(kinds).every(k=>/<svg/.test(shapeSwatchHTML({ color:'#1A8CC8', shape:k }, 20)));
      startEditType(t.id); document.querySelector('#newTypeShapes [data-shape="rounded"]').click(); document.getElementById('btnAddType').click();
      const saved = pages.every(pg=>pg.deviceTypes.find(x=>x.id===t.id).shape === 'rounded') && document.querySelectorAll('#newTypeShapes button').length === 7;
      pages.forEach(pg=>{ const x = pg.deviceTypes.find(y=>y.id===t.id); if (x){ if (keep) x.shape = keep; else delete x.shape; } }); render();
      return drawn && sw && saved;
    }), 'forme du poste : 6 formes dessinées, choisies dans le crayon et propagées à toutes les pages');
    // v2.1-172 : dessins : poignées sur les angles, redimensionnement (angle opposé fixe, même tourné), rotation comme un plan, ancien format, bouton Sélection
    ok(await pg.evaluate(async()=>{
      closeOtherWindows(''); resetRemoteGesture(); model.shapes = [{ id:'old1', kind:'rect', x1:150, y1:300, x2:350, y2:450, color:'#0E6FA8', width:4, dash:false, fill:true, locked:false }]; render();
      const sh = model.shapes[0];
      const migr = sh.x === 150 && sh.y === 300 && sh.width === 200 && sh.height === 150 && sh.rotation === 0 && sh.sw === 4 && sh.x1 === undefined;
      onTileChosen('plan'); selectNode(shapeNodes.get(sh.id), sh.id);
      const four = shapeHandles.getChildren().filter(h=>h.visible()).length === 4;
      const exact = shapeCornersLocal(sh).every((c,k)=>{ const w = shapeToWorld(sh, c[0], c[1]), h = shapeHandles.getChildren()[k]; return Math.abs(h.x()-w.x) < 0.01 && Math.abs(h.y()-w.y) < 0.01; });
      // rotation (même moteur que le plan) : 30° autour du centre
      const c0 = planCenter(sh); sh.rotation = 30; const cx = shapeToWorld(sh, sh.width/2, sh.height/2); // un coin haut-gauche inchangé = centre qui bouge : on vérifie surtout que rotatableObj voit le dessin
      const rot = rotatableObj() === sh && rotIconsGroup.visible();
      // redimensionnement : on tire l'angle 2 de (+30,+20), l'angle 0 doit rester fixe à l'écran
      const before = shapeToWorld(sh, 0, 0), h2 = shapeHandles.getChildren()[2], w2 = shapeToWorld(sh, sh.width, sh.height);
      h2.fire('dragstart', { evt:{} }); h2.position({ x:w2.x+30, y:w2.y+20 }); h2.fire('dragmove', { evt:{} }); h2.fire('dragend', { evt:{} });
      const after = shapeToWorld(sh, 0, 0), fixed = Math.abs(before.x-after.x) < 0.5 && Math.abs(before.y-after.y) < 0.5 && sh.width > 200;
      const line = { id:'ln1', kind:'arrow', x:100, y:500, width:150, height:0, rotation:20, color:'#000000', sw:3, dash:false, fill:false, locked:false }; model.shapes.push(line); render(); selectNode(shapeNodes.get('ln1'), 'ln1');
      const two = shapeHandles.getChildren().filter(h=>h.visible()).length === 2;
      const lbl = lockBadge.row; // rangée de 2 icônes au-dessus (badgeState.row.n === 2)
      const row2 = badgeState.row && badgeState.row.n === 2;
      model.shapes = []; render();
      const win = document.getElementById('drawWin');
      const noClose = !document.getElementById('drawClose') && !!document.getElementById('drawSelect');
      openDrawWin(); const a = isDrawTool(activeTool); document.getElementById('drawSelect').click(); const b = activeTool === SELECT_TOOL && win.classList.contains('show'); closeDrawWin();
      return migr && four && exact && rot && fixed && two && row2 && noClose && a && b;
    }), 'dessins : poignées pile sur les angles, redimensionnement angle opposé fixe, rotation, ancien format, bouton Sélection sans croix');
    // v2.1-173 : accroche d'angle des lignes / flèches = celle de la rotation d'un plan (ROT_SNAP_DEG autour de 0/90/180/270°)
    ok(await pg.evaluate(()=>{
      const g = (p2)=>shapeGeomFromPoints('line', { x:100, y:100 }, p2);
      const h0 = g({ x:300, y:100 + 200*Math.tan(3*Math.PI/180) }), v90 = g({ x:100 + 200*Math.tan(3*Math.PI/180), y:300 }), free = g({ x:300, y:100 + 200*Math.tan(8*Math.PI/180) });
      const diag = g({ x:300, y:300 }), back = g({ x:-100, y:100 + 200*Math.tan(2*Math.PI/180) });
      const near = (a,b)=>Math.abs(a-b) < 0.01;
      return near(h0.rotation, 0) && near(v90.rotation, 90) && Math.abs(free.rotation - 8) < 0.01 && near(diag.rotation, 45) && near(Math.abs(back.rotation), 180) && near(h0.width, Math.hypot(200, 200*Math.tan(3*Math.PI/180)));
    }), 'lignes / flèches : accroche à 0/90/180/270° à moins de 4° comme la rotation d\'un plan');
    // v2.1-174 : outil Sélection = curseur déporté rouge ; un tap du cercle sélectionne le dessin sous la pointe (ou désélectionne)
    ok(await pg.evaluate(()=>{
      closeOtherWindows(''); resetRemoteGesture();
      model.shapes = [
        { id:'sa', kind:'rect', x:200, y:400, width:200, height:150, rotation:0, color:'#0E6FA8', sw:4, dash:false, fill:false, locked:false },
        { id:'sb', kind:'line', x:150, y:300, width:250, height:0, rotation:0, color:'#000000', sw:3, dash:false, fill:false, locked:false },
        { id:'sc', kind:'ellipse', x:100, y:100, width:120, height:80, rotation:30, color:'#D6493E', sw:3, dash:false, fill:true, locked:false } ];
      render();
      const hits = shapeAtPoint({ x:300, y:400 }) && shapeAtPoint({ x:300, y:400 }).id === 'sa' && shapeAtPoint({ x:300, y:475 }) === null && shapeAtPoint({ x:250, y:302 }).id === 'sb' && shapeAtPoint({ x:500, y:650 }) === null;
      onTileChosen('plan'); openDrawWin(); document.getElementById('drawSelect').click();
      const tool = activeTool === SELECT_TOOL && document.getElementById('drawSelect').classList.contains('active');
      remoteCursor = { tool:SELECT_TOOL, phase:'start', tip:{ x:300, y:400 } }; confirmRemoteCursor();
      const sel1 = selectedId === 'sa' && !!remoteCursor && rotIconsGroup.visible();
      remoteCursor.tip = { x:250, y:302 }; confirmRemoteCursor(); const sel2 = selectedId === 'sb';
      remoteCursor.tip = { x:520, y:700 }; confirmRemoteCursor(); const none = selectedId === null;
      const red = remoteCursorColor() === '#E02424';
      closeDrawWin(); model.shapes = []; render();
      return hits && tool && sel1 && sel2 && none && red;
    }), 'sélection de dessin : curseur rouge, tap du cercle sélectionne le dessin visé ou désélectionne');
    // v2.1-176 : aperçu du crayon = la forme réelle (étoile comprise), taille liée au curseur, la forme sert de sélecteur de couleur
    ok(await pg.evaluate(()=>{
      const t = model.deviceTypes[2]; startEditType(t.id);
      document.querySelector('#newTypeShapes [data-shape="burst"]').click();
      const star = /<polygon/.test(document.getElementById('pvShape').innerHTML) && !/<circle/.test(document.getElementById('pvShape').innerHTML);
      const w = ()=>parseFloat(document.querySelector('#pvShape svg').getAttribute('width'));
      const r = document.getElementById('newTypeRadius'); r.value = 8; r.dispatchEvent(new Event('input')); const small = w(); r.value = 40; r.dispatchEvent(new Event('input')); const big = w();
      const picker = document.querySelector('.type-preview #currentColorPicker') !== null && getComputedStyle(document.getElementById('currentColorPicker')).opacity === '0';
      document.querySelector('#newTypeShapes [data-shape="triangle"]').click(); document.getElementById('newTypeCode').value = 'NT'; document.getElementById('newTypeCode').dispatchEvent(new Event('input'));
      const tri = /text-anchor/.test(document.getElementById('pvShape').innerHTML) && parseFloat(document.querySelector('#pvShape text').getAttribute('y')) > big*0.6*0.9;
      closeAllPopovers(); editingTypeId = null;
      return star && small < big && big - small > 20 && picker && tri;
    }), 'crayon : aperçu = forme réelle (étoile), taille suit le curseur, la forme choisit la couleur, étiquette du triangle plus bas');
    // v2.1-177 : sélection de dessins superposés : le contour le plus proche gagne (un grand dessin rempli au-dessus ne vole plus la sélection), contour bleu de la sélection
    ok(await pg.evaluate(()=>{
      closeOtherWindows(''); resetRemoteGesture();
      model.shapes = [
        { id:'dessous', kind:'rect', x:100, y:100, width:200, height:150, rotation:0, color:'#000000', sw:4, dash:false, fill:false, locked:false },
        { id:'dessus', kind:'rect', x:100, y:100, width:300, height:260, rotation:0, color:'#ffffff', sw:4, dash:false, fill:true, locked:false } ];
      render();
      const onEdge = shapeAtPoint({ x:200, y:250 });            // sur le bord bas du petit rectangle, DANS le grand (rempli)
      const onBig = shapeAtPoint({ x:400, y:230 });             // sur le bord droit du grand
      const inside = shapeAtPoint({ x:250, y:200 });            // intérieur du grand rempli, loin de tout contour
      const outline = (()=>{ selectNode(shapeNodes.get('dessous'), 'dessous'); return shapeOutline.visible() && shapeOutline.points().length === 8; })();
      model.shapes = []; render();
      return onEdge && onEdge.id === 'dessous' && onBig && onBig.id === 'dessus' && inside && inside.id === 'dessus' && outline && !shapeOutline.visible();
    }), 'dessins superposés : le contour visé gagne, contour bleu de la sélection');
    // v2.1-178 : garde-fou : le contour / les poignées d'un dessin suivent sa géométrie réelle même si un chemin « oublie » de les mettre à jour (rotation en cours, zoom)
    ok(await pg.evaluate(async()=>{
      closeOtherWindows(''); resetRemoteGesture(); onTileChosen('plan');
      model.shapes = [{ id:'gf', kind:'rect', x:150, y:200, width:180, height:120, rotation:0, color:'#000000', sw:4, dash:false, fill:false, locked:false }]; render();
      selectNode(shapeNodes.get('gf'), 'gf');
      const node = shapeNodes.get('gf'), sh = model.shapes[0];
      const want = ()=>shapeCornersLocal(sh).map(c=>shapeToWorld({ x:node.x(), y:node.y(), rotation:node.rotation() }, c[0], c[1]));
      const ok0 = ()=>{ const pts = shapeOutline.points(); return want().every((w,k)=>Math.hypot(w.x-pts[2*k], w.y-pts[2*k+1]) < 0.5) && Math.abs(shapeHandles.getChildren()[0].scaleX() - 1/zoom) < 0.01; };
      const a = ok0();
      node.rotation(35); node.position({ x:200, y:260 });       // changement « par un chemin oublié » : aucun appel à updateShapeHandles
      await new Promise(r=>setTimeout(r, 300));
      const b = ok0();
      const z0 = zoom; zoom = z0*1.7;                            // zoom changé sans notification
      await new Promise(r=>setTimeout(r, 300));
      const c = ok0(); zoom = z0;
      selectNode(null, null); await new Promise(r=>setTimeout(r, 200));
      const d = !shapeOutline.visible() && !shapeHandles.visible();
      model.shapes = []; render();
      return a && b && c && d;
    }), 'dessin sélectionné : contour et poignées se resynchronisent seuls (rotation, zoom), disparaissent à la désélection');
    // v2.1-179 : image à la place de la forme d'un poste : import (tous formats via fileToImageDataURL), réduction, détourage du blanc, pastille-image, sauvegarde, retrait
    ok(await (async()=>{
      await pg.evaluate(()=>{ closeOtherWindows(''); openTileDrawer('pastille', false); startEditType(model.deviceTypes[3].id); });
      await pg.evaluate(async()=>{ // image test : 800 x 400, fond blanc plein, disque vert au centre
        const c = document.createElement('canvas'); c.width = 800; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,800,400); x.fillStyle = '#0a0'; x.beginPath(); x.arc(400,200,150,0,7); x.fill();
        const blob = await new Promise(r=>c.toBlob(r, 'image/jpeg', 0.9)); await applyTypeImageFile(new File([blob], 'extincteur.jpg', { type:'image/jpeg' }));
      });
      return await pg.evaluate(async()=>{
        const im = await loadImage(newTypeImage); const small = Math.max(im.naturalWidth, im.naturalHeight) <= 384 && Math.abs(newTypeImageRatio - 1) < 0.02; // v2.1-184 : marges transparentes rognées -> le disque seul (ratio 1)
        const px = async(url)=>{ const i = await loadImage(url), c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i,0,0); return x.getImageData(0,0,1,1).data[3]; };
        const cut = document.getElementById('newTypeCutWhite').checked && (await px(newTypeImage)) === 0;            // fond blanc détouré d'office
        const t = model.deviceTypes[3]; const rowShown = document.getElementById('rowTypeImage').style.display !== 'none';
        document.getElementById('btnAddType').click();
        const saved = pages.every(pg=>!!pg.deviceTypes.find(y=>y.id===t.id).image) && Math.abs(t.imageRatio - 1) < 0.02;
        const p = { id:'pi1', typeId:t.id, label:'X1', x:100, y:100, radius:20, rotation:0 }; model.pastilles.push(p); render();
        const grp = pastilleNodes.get('pi1'); const body = grp && grp.findOne('.pastille-body');
        const drawn = !!body && body._isImage && body.find('Image').length === 1 && body.find('Text').length === 1;
        const legendOk = typeof buildPastilleGroup(t, 10, t.code, { noLabel:true }).find === 'function' && buildPastilleGroup(t, 10, t.code, { noLabel:true }).find('Text').length === 0;
        scheduleAutoSave(); clearTimeout(autoSaveTimer); await doAutoSave(); const snap = await idbLoad(); const stored = !!(snap && snap.pages[0].deviceTypes.find(y=>y.id===t.id).image);
        startEditType(t.id); document.querySelector('#newTypeShapes [data-shape=\"circle\"]').click(); document.getElementById('btnAddType').click();
        const removed = pages.every(pg=>!pg.deviceTypes.find(y=>y.id===t.id).image);
        model.pastilles = model.pastilles.filter(q=>q.id !== 'pi1'); render();
        return small && cut && rowShown && saved && drawn && legendOk && stored && removed;
      });
    })(), 'image de poste : import réduit, fond blanc détouré, pastille-image (numéro dessous), sauvegarde, retrait par une forme');
    // v2.1-180 : toucher « Image » dans la fenêtre d'un NOUVEAU poste ne la ferme plus (le clic simulé du champ fichier remontait à document) ; un resize pendant le choix du fichier non plus
    {
      await pg.evaluate(()=>{ closeOtherWindows(''); resetRemoteGesture(); openTileDrawer('pastille', false); document.getElementById('deviceTypeDropdownBtn').click(); });
      await pg.evaluate(()=>[...document.querySelectorAll('#deviceTypeDropdownList .dd-add')].find(e=>/Nouveau/.test(e.textContent)).click());
      await pg.waitForTimeout(300);
      const fc = pg.waitForEvent('filechooser', { timeout:4000 }).catch(()=>null);
      await pg.evaluate(()=>document.querySelector('#newTypeShapes [data-shape="image"]').click());
      const ch = await fc;
      const st = ()=>pg.evaluate(()=>document.getElementById('popAddType').classList.contains('open') && !!document.querySelector('.tb-group.mobile-open'));
      const a = !!ch && await st();
      await pg.evaluate(()=>window.dispatchEvent(new Event('resize'))); await pg.waitForTimeout(400);
      const b = await st();
      await pg.evaluate(()=>{ filePickerOpenUntil = 0; closeAllPopovers(); closeAllTileDrawers(); });
      ok(a && b, 'nouveau poste : « Image » ne ferme pas la fenêtre (ni au toucher, ni au retour du sélecteur de fichiers)');
    }
    // contexte 2D remis à zéro (mémoire basse Android) : l'échelle de dessin est rétablie au dessin suivant (v2.1-181)
    await pg.evaluate(()=>{ [planLayer,contentLayer,uiLayer].forEach(l=>{ const c=l.getCanvas()._canvas; c.width=c.width; }); contentLayer.batchDraw(); }); await pg.waitForTimeout(300);
    ok(await pg.evaluate(()=>{ const c=contentLayer.getCanvas(); return Math.abs(c._canvas.getContext('2d').getTransform().a - c.pixelRatio) < 0.001; }), 'contexte 2D remis à zéro : échelle de dessin rétablie (pas de logos minuscules)');
    // bibliothèque de postes (v2.1-181) : créé / modifié -> repris par « Nouveau projet », tuiles, ancien poste, rechargement
    {
      const snap = await pg.evaluate(()=>{ window.__snap = cloneDoc(); return true; });
      await pg.evaluate(()=>{ library = { version:1, trades:{} }; document.getElementById('newTypeCode').value='EXT'; document.getElementById('newTypeName').value='Extincteur test'; document.getElementById('btnAddType').click(); });
      ok(await pg.evaluate(()=>libTypes().some(x=>/^type-lib-/.test(x.id) && x.name==='Extincteur test') && model.deviceTypes.some(t=>/^type-lib-/.test(t.id) && t.name==='Extincteur test')), 'bibliothèque : un poste créé y est enregistré (id unique)');
      await pg.evaluate(()=>{ const t=model.deviceTypes.find(x=>x.id==='type-E'); startEditType('type-E'); document.getElementById('newTypeName').value='Poste E modifié'; document.getElementById('btnAddType').click(); });
      ok(await pg.evaluate(()=>libTypes().some(x=>x.id==='type-E' && x.name==='Poste E modifié')), 'bibliothèque : un poste d\'origine modifié y est enregistré');
      await pg.evaluate(()=>newProject()); await pg.waitForTimeout(700);
      ok(await pg.evaluate(()=>model.deviceTypes.some(t=>t.name==='Extincteur test') && model.deviceTypes.find(t=>t.id==='type-E').name==='Poste E modifié' && model.deviceTypes.filter(t=>t.id==='type-E').length===1), 'nouveau projet : reprend les postes créés et modifiés de la bibliothèque');
      await pg.evaluate(()=>{ const i=model.deviceTypes.findIndex(t=>t.name==='Extincteur test'); pages.forEach(pg=>{ pg.deviceTypes.splice(pg.deviceTypes.findIndex(t=>t.name==='Extincteur test'),1); }); openLibraryWindow(); });
      ok(await pg.evaluate(()=>document.querySelectorAll('#popLibrary .lib-tile').length>=2 && document.querySelector('#popLibrary').classList.contains('open')), 'bibliothèque : fenêtre en tuiles (tuiles)');
      await pg.evaluate(()=>{ [...document.querySelectorAll('#popLibrary .lib-tile')].find(t=>/Extincteur/.test(t.title)).querySelector('.lib-main').click(); });
      ok(await pg.evaluate(()=>model.deviceTypes.some(t=>t.name==='Extincteur test') && !document.querySelector('#popLibrary').classList.contains('open')), 'bibliothèque : toucher une tuile ajoute le poste au document et ferme la fenêtre');
      await pg.evaluate(()=>{ pages.forEach(pg=>pg.deviceTypes.push({id:'type-77',code:'OLD',name:'Ancien poste',color:'#123456',shape:'circle'})); });
      ok(await pg.evaluate(()=>{ const n=libSaveDocTypes(); return n>=1 && model.deviceTypes.find(t=>t.id==='type-77').libId && libTypes().some(x=>x.name==='Ancien poste'); }), 'bibliothèque : « Enregistrer les postes de ce document » rattrape un ancien poste');
      await pg.waitForTimeout(700);
      ok(await pg.evaluate(async()=>{ const n=libTypes().length; library={version:1,trades:{}}; await libLoad(); return n>=3 && libTypes().length===n; }), 'bibliothèque : conservée sur l\'appareil (rechargement)');
      await pg.evaluate(()=>{ library={version:1,trades:{}}; libPersist(); restoreDoc(window.__snap); }); await pg.waitForTimeout(500);
    }
    // aperçu de pose d'un poste image (v2.1-183) : image semi-transparente centrée, pas un cercle
    {
      await pg.evaluate(async()=>{ const c=document.createElement('canvas');c.width=40;c.height=80;const x=c.getContext('2d');x.fillStyle='#c00';x.fillRect(0,0,40,80);const u=c.toDataURL();
        pages.forEach(pg=>pg.deviceTypes.push({id:'type-ghost',code:'GH',name:'Fantôme',color:'#c00',shape:'circle',image:u,imageRatio:0.5,defaultRadius:30}));
        selectedTypeId='type-ghost'; typeImageOf(u); await typeImageOf(u).promise; activeTool='place-classic'; updateGhost({x:200,y:200}); });
      ok(await pg.evaluate(()=>{ const n=ghostGroup.children[0]; return n && n.className==='Image' && Math.abs(n.opacity()-0.55)<0.01 && Math.abs(n.x()+n.width()/2-snapToGrid(200))<0.6 && Math.abs(n.y()+n.height()/2-snapToGrid(200))<0.6 && n.height()>n.width(); }), 'aperçu de pose d\'un poste image : image semi-transparente centrée (pas un cercle)');
      await pg.evaluate(()=>{ ghostGroup.destroyChildren(); pages.forEach(pg=>{ pg.deviceTypes=pg.deviceTypes.filter(t=>t.id!=='type-ghost'); }); selectedTypeId=model.deviceTypes[0].id; activeTool=null; });
    }
    // détourage de l'image d'un poste (v2.1-184) : damier gris/blanc effacé, objet gardé, rognage ; baguette magique
    {
      ok(await pg.evaluate(async()=>{
        const c=document.createElement('canvas');c.width=100;c.height=100;const x=c.getContext('2d');
        for(let i=0;i<10;i++)for(let j=0;j<10;j++){x.fillStyle=(i+j)%2?'#cccccc':'#ffffff';x.fillRect(i*10,j*10,10,10);}
        x.fillStyle='#c00000';x.fillRect(30,20,40,60);
        const out=await prepareTypeImage(c.toDataURL('image/jpeg',0.92),true), pr=await prepareTypeImage(c.toDataURL('image/jpeg',0.92),false);
        const im=await loadImage(out.url); const k=document.createElement('canvas');k.width=im.naturalWidth;k.height=im.naturalHeight;const kx=k.getContext('2d');kx.drawImage(im,0,0);
        return pr.bgLikely && Math.abs(out.ratio-40/60)<0.08 && im.naturalWidth<50 && kx.getImageData(Math.floor(k.width/2),Math.floor(k.height/2),1,1).data[3]===255;
      }), 'détourage auto : fond en damier détecté, effacé et marges rognées');
      ok(await pg.evaluate(async()=>{
        const c=document.createElement('canvas');c.width=60;c.height=60;const x=c.getContext('2d');x.fillStyle='#2080e0';x.fillRect(0,0,60,60);x.fillStyle='#000';x.fillRect(20,20,20,20);
        newTypeImage=c.toDataURL(); newTypeImageRatio=1; openTypeImageEditor(); await new Promise(r=>setTimeout(r,300));
        const cv=document.querySelector('#typeImgEditor .tie-cv'), r=cv.getBoundingClientRect();
        cv.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+2*r.width/60,clientY:r.top+2*r.height/60}));
        await new Promise(r=>setTimeout(r,100));
        const a=cv.getContext('2d').getImageData(1,1,1,1).data[3], b=cv.getContext('2d').getImageData(30,30,1,1).data[3];
        document.querySelector('#typeImgEditor .tie-ok').click(); await new Promise(r=>setTimeout(r,200));
        const im=await loadImage(newTypeImage);
        return a===0 && b===255 && !document.getElementById('typeImgEditor') && im.naturalWidth===20 && Math.abs(newTypeImageRatio-1)<0.01;
      }), 'baguette magique : touche le fond = transparent, objet gardé, Valider rogne et ferme');
      ok(await pg.evaluate(async()=>{
        const c=document.createElement('canvas');c.width=100;c.height=20;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,100,0);g.addColorStop(0,'#000');g.addColorStop(1,'#fff');x.fillStyle=g;x.fillRect(0,0,100,20);
        newTypeImage=c.toDataURL(); newTypeImageRatio=5; openTypeImageEditor(); await new Promise(r=>setTimeout(r,300));
        const cv=document.querySelector('#typeImgEditor .tie-cv'), rr=cv.getBoundingClientRect(), tol=document.querySelector('#typeImgEditor .tie-tol');
        const clear=()=>{ const d=cv.getContext('2d').getImageData(0,0,100,20).data; let n=0; for(let i=3;i<d.length;i+=4) if(d[i]===0) n++; return n; };
        tol.value=5; tol.dispatchEvent(new Event('input')); cv.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rr.left+1,clientY:rr.top+rr.height/2}));
        const a=clear(); tol.value=60; tol.dispatchEvent(new Event('input')); const b=clear(); tol.value=5; tol.dispatchEvent(new Event('input')); const c2=clear();
        document.querySelector('#typeImgEditor .tie-close').click();
        return a>0 && b>a*2 && c2===a;
      }), 'baguette magique : le curseur de tolérance agit en direct (plus fort = plus effacé, retour possible)');
      ok(await pg.evaluate(()=>{ newTypeImage='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; syncShapeUI(); const on=document.getElementById('btnTypeImageEdit').style.display!=='none' && document.getElementById('pvHint').style.display==='none'; newTypeImage=null; syncShapeUI(); return on && document.getElementById('btnTypeImageEdit').style.display==='none' && document.getElementById('pvHint').style.display!=='none'; }), 'icône « Retouche » : visible seulement avec une image (le texte Aperçu disparaît)');
      await pg.evaluate(()=>{ newTypeImage=null; newTypeImageSrc=null; syncShapeUI(); });
    }
    // règle commune : ouvrir une fenêtre referme les autres
    ok(await pg.evaluate(()=>{ closeOtherWindows(''); openTileDrawer('plan', false); document.getElementById('sizeAllWin').classList.add('show'); closeOtherWindows('sizeAll'); const a = !document.querySelector('.tb-group.mobile-open'); openTileDrawer('vue', false); const b = !document.getElementById('sizeAllWin').classList.contains('show'); closeAllTileDrawers(); return a && b; }), 'fenêtres : en ouvrir une referme les autres');
    ok(await pg.evaluate(async()=>{ const t = model.deviceTypes[0]; const r0 = typeSizeOf(t); const row = [...document.querySelectorAll('#deviceTypeDropdownList .dd-item')].find(x=>x.querySelector('.sz-ctl')); if (!row) return false; const plus = row.querySelector('.sz-ctl button[data-sz="1"]'); plus.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})); plus.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})); return typeSizeOf(model.deviceTypes[0]) === r0+1; }), 'liste des postes : bouton + règle la taille du poste');
    ok(await pg.evaluate(()=>{ const pop = document.getElementById('popAddType'); pop.classList.add('open'); positionFloating(document.getElementById('deviceTypeDropdownBtn'), pop); return true; }) && (await pg.waitForTimeout(150), await pg.evaluate(()=>{ const pop = document.getElementById('popAddType'); const ok = pop.style.overflowY === 'auto' && /px$/.test(pop.style.maxHeight); pop.classList.remove('open'); return ok; })), 'Nouveau poste : fenêtre à hauteur limitée + défilement si l\'écran est petit');
    ok(errs.length===0, 'aucune erreur JavaScript'+(errs.length?' : '+errs[0]:''));
  } finally { await b.close(); }
  console.log(fails ? '\n'+fails+' ÉCHEC(S)' : '\nTOUS LES TESTS PASSENT');
  process.exit(fails?1:0);
})().catch(e=>{ console.log('ERREUR', e.message); process.exit(1); });
