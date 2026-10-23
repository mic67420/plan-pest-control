// Tests automatiques de non-régression (v2.1-102) — à lancer avant chaque grosse modification :
//   LIBS=/chemin/vers/node_modules PLAYWRIGHT=/chemin/vers/playwright CHROME=/chemin/vers/chrome node tests/smoke.js
// LIBS doit contenir konva, jspdf, pptxgenjs, jszip (mêmes versions que le CDN). Aucun réseau n'est utilisé.
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
    const rm = await pg.evaluate(()=>{ selectedTypeId=model.deviceTypes[0].id; closeAllTileDrawers(); if(activeTool!=='place-remote') setTool('place-remote'); remoteCursor={tool:'pastille',phase:'anchor',tip:{x:203,y:197}}; drawRemoteCursor(); confirmRemoteCursor(); remoteCursor.tip={x:333,y:251}; drawRemoteCursor(); const prev=remoteCursorNodes.previewLine.points().join(); confirmRemoteCursor(); const l=model.lines[model.lines.length-1],p=model.pastilles.find(x=>x.id===l.toPastilleId),an=model.anchors.find(x=>x.id===l.fromAnchorId); return {prev, fin:[an.x,an.y,p.x,p.y].join()}; });
    ok(rm.prev===rm.fin && rm.fin==='200,200,330,250', 'pastille déportée : trait d\'aperçu = trait final, centres sur la grille ('+rm.fin+')');
    // 8. Exports : nom du document
    const names = [];
    for (const id of ['btnExportPDF','btnExportPPTX','btnExportPNG','btnSave']){
      const dl = pg.waitForEvent('download',{timeout:20000});
      await pg.evaluate(i=>document.getElementById(i).click(), id);
      if (id==='btnExportPDF'){ await pg.waitForSelector('input[placeholder="ex : Usine Martin"]',{timeout:3000}); ok(await pg.inputValue('input[placeholder="ex : Usine Martin"]')==='Plan test', 'export : nom pré-rempli avec le nom du plan'); await pg.keyboard.press('Enter'); }
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
    const rb = await pg.evaluate(()=>{ document.getElementById('rngPastilleSize').value = 30; const h = ()=>document.getElementById('rngPastilleSize').closest('.rngB').querySelector('.rngB-fill').style.width; const a = h(); const b = document.getElementById('btnPastilleSizePlus'); b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1})); b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1})); return { n:document.querySelectorAll('.rngB').length, a, b:h(), taille:currentPastilleRadius }; });
    ok(rb.n===10 && rb.a && rb.b && rb.a!==rb.b && rb.taille===31, 'réglages modèle E : '+rb.n+' barres, le remplissage suit la valeur (30 puis 31 avec le bouton +)');
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
    ok(await pg.evaluate(()=>{ const pa = model.pastilles[model.pastilles.length-1]; pa.locked = false; selectNode(pastilleNodes.get(pa.id), pa.id); updateLockIndicator(); openSelectionSettings(); const x0 = pa.x, y0 = pa.y; const btn = d=>document.querySelector('#selNudge button[data-dx="'+d[0]+'"][data-dy="'+d[1]+'"]'); const down = b=>b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})); const up = b=>b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})); down(btn([1,0])); up(btn([1,0])); down(btn([0,-1])); up(btn([0,-1])); const r = pa.x===x0+1 && pa.y===y0-1 && document.getElementById('selNudge').classList.contains('show'); closeSelectionSettings(); return r; }), 'flèches de déplacement fin : +1 à droite, -1 en haut');
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
    ok(await pg.evaluate(()=>{ document.getElementById('btnSun').click(); const on = document.body.classList.contains('sun-mode'); document.getElementById('btnSun').click(); return on && !document.body.classList.contains('sun-mode'); }), 'plein soleil : activé puis désactivé');
    const cols = await pg.evaluate(()=>{ model.legend.visible = true; model.legend.onlyUsed = false; model.legend.locked = false; const h = sheetH(); model.legend.x = 100; model.legend.y = h - 300; model.legend.scale = 1; legendGroupNode && legendGroupNode.destroy(); legendGroupNode = null; render(); const w = legendGroupNode.getClientRect({relativeTo:stage}).width; model.legend.y = 40; legendGroupNode.destroy(); legendGroupNode = null; render(); const w1 = legendGroupNode.getClientRect({relativeTo:stage}).width; return { bas:Math.round(w), haut:Math.round(w1) }; });
    ok(cols.bas > cols.haut*1.5, 'légende : colonnes automatiques quand elle déborderait en bas ('+cols.haut+' px en haut, '+cols.bas+' px en bas)');
    ok(await pg.evaluate(async()=>(await askPagesToExport()).join()==='0' || pages.length>1), 'export : une seule page = aucune question');
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
      const dlg = askPagesToExport(); await new Promise(r=>setTimeout(r,100));
      const card = [...document.body.children].filter(e=>e.style && e.style.zIndex==='950').pop();
      const defaults = [...card.querySelectorAll('input[type=checkbox]')].map(b=>b.checked);
      [...card.querySelectorAll('button')].find(b=>b.textContent==='Annuler').click();
      const res = await dlg;
      const n = pages.length;
      document.getElementById('btnPageRecap').click(); await new Promise(r=>setTimeout(r,300));
      return { ok1, defaults, cancelled: res===null, uniq: pages.filter(pg=>pg.recap).length===1, n };
    });
    ok(rec.ok1 && rec.uniq && rec.cancelled && rec.defaults.length>=2 && rec.defaults[rec.defaults.length-1]===false && rec.defaults[0]===true, 'page récapitulative : tableau calculé, une seule, décochée par défaut à l\'export ('+JSON.stringify(rec.defaults)+')');
    ok(errs.length===0, 'aucune erreur JavaScript'+(errs.length?' : '+errs[0]:''));
  } finally { await b.close(); }
  console.log(fails ? '\n'+fails+' ÉCHEC(S)' : '\nTOUS LES TESTS PASSENT');
  process.exit(fails?1:0);
})().catch(e=>{ console.log('ERREUR', e.message); process.exit(1); });
