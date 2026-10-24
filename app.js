/* No backend, tracking, or external dependency. */
(()=>{'use strict';
const COURSE=window.COURSE||[], SIMULATIONS=window.SIMULATIONS||[], PHRASES=window.PHRASES||[], LAB_NOTES=window.LAB_NOTES||{};
const $=s=>document.querySelector(s), main=$('#view'), bar=$('#bottom');
const KEY='yoru-conversation-progress-v1';
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validRate=v=>Number.isFinite(Number(v))&&Number(v)>=.5&&Number(v)<=1.3?Number(v):.8;
const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY));if(!v||typeof v!=='object')return{};return v;}catch{return {};}};
const saved=load();
const state={passed:saved.passed&&typeof saved.passed==='object'?saved.passed:{},wrong:Array.isArray(saved.wrong)?saved.wrong:[],history:Array.isArray(saved.history)?saved.history:[],rate:validRate(saved.rate)};
const ui={page:'learn',lesson:null,quiz:null,simId:null,sim:null,step:0,simHistory:[],simEnd:null,phraseCat:'すべて',phraseQuery:'',settingsBack:'learn'};
state.simRecords=saved.simRecords&&typeof saved.simRecords==='object'?saved.simRecords:{};
state.simDraft=saved.simDraft&&typeof saved.simDraft==='object'?saved.simDraft:null;
let sounds=[],toastTimer=null;
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch{notify('進捗の保存に失敗しました。プライベートモード等をご確認ください。');}};
function notify(s){const el=$('#toast');el.textContent=s;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3000);}
const up=()=>window.scrollTo({top:0,behavior:'instant'});
const par=s=>escapeHTML(s).replace(/\n/g,'<br>');
function audioButton(s,label='▶ 音声'){let id=sounds.push(s)-1;return `<button class="audio" type="button" data-speak="${id}" aria-label="${escapeHTML(label)}">${escapeHTML(label)}</button>`;}
function speak(text){if(!('speechSynthesis'in window)){notify('このブラウザでは音声再生に対応していません。');return;}
 try{const synth=window.speechSynthesis;synth.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang='ja-JP';utter.rate=state.rate;utter.pitch=1;const vs=synth.getVoices();const jp=vs.find(v=>v.lang.toLowerCase()==='ja-jp')||vs.find(v=>v.lang.startsWith('ja'));if(jp)utter.voice=jp;utter.onerror=ev=>{if(ev.error!=='canceled'&&ev.error!=='interrupted')notify('音声を再生できません。端末の日本語音声設定をご確認ください。');};synth.speak(utter);}catch{notify('音声エンジンが利用できません。');}}
function controls(html){bar.hidden=!html;bar.innerHTML=html||'';}
function go(page,opt){if(page!=='lesson')ui.lesson=null;ui.page=page;if(opt)Object.assign(ui,opt);render();up();}
function hash(s){let x=2166136261;for(const c of s){x^=c.charCodeAt(0);x=Math.imul(x,16777619);}return x>>>0;}
function shuffledChoices(arr,seed){return arr.map((text,index)=>({text,correct:index===0})).sort((a,b)=>hash(seed+a.text)-hash(seed+b.text));}
function buildQuestions(chapter){const result=[];
 chapter.checks.forEach((a,i)=>result.push({id:`${chapter.id}-k${i}`,origin:'講義の理解',question:a[0],choices:shuffledChoices(a.slice(1,4),`${chapter.id}-k${i}`),why:a[4],spoken:a[1]}));
 chapter.scenes.forEach((s,i)=>{
  result.push({id:`${chapter.id}-s${i}`,origin:'会話の実践',question:`【場面】${s[0]}\nどの返し方が最も適切？`,choices:shuffledChoices(s.slice(1,4),`${chapter.id}-s${i}`),why:s[4],spoken:s[1]});
  result.push({id:`${chapter.id}-r${i}`,origin:'理由を説明できる？',question:`【場面】${s[0]}\n「${s[1]}」が適切なのはなぜ？`,choices:shuffledChoices([s[4],'返答を待たずに話を進められるから','相手に断る自由を与えないため'],`${chapter.id}-r${i}`),why:`${s[5]}：${s[4]}`,spoken:s[1]});
 });return result;
}
const allQuestions=()=>COURSE.flatMap(buildQuestions);
function stats(){let n=COURSE.filter(c=>state.passed[c.id]).length;let total=COURSE.length;let solved=state.history.reduce((a,h)=>a+(h.count||0),0);return {n,total,solved};}
function hero(kicker,title,desc){return `<div class="hero"><div class="eyebrow">${escapeHTML(kicker)}</div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(desc)}</p></div>`;}
function render(){sounds=[];document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.tab===ui.page||(ui.page==='lesson'&&b.dataset.tab==='learn')||(ui.page==='quiz'&&b.dataset.tab==='test')));
 if(ui.page==='learn')renderHome();else if(ui.page==='lesson')renderLesson();else if(ui.page==='test')renderTest();else if(ui.page==='quiz')renderQuiz();else if(ui.page==='review')renderReview();else if(ui.page==='phrases')renderPhrases();else if(ui.page==='sim')renderSim();else if(ui.page==='settings')renderSettings();
}
function renderHome(){controls('');const s=stats();main.innerHTML=`${hero('APPLIED JAPANESE · COURSE 01','応用対話演習・夜間課程','デート終盤にホテルへの同行を提案する際の日本語表現を、場面別に学習します。全10章・200問。')}
<div class="mockSeal"><span>実用日本語研究室｜対人場面別会話研究</span><strong>研究対象：宿泊施設への同行を提案する場面の日本語</strong><small>対象：成人同士の自由な意思決定が可能な会話。公的な教育機関・資格制度とは関係ありません。</small></div>
<div class="metrics"><div><b>${s.n}<small> / ${s.total}</small></b><span>履修済み講義</span></div><div><b>${s.solved}</b><span>演習回答数</span></div><div><b>${state.wrong.length}</b><span>再提出</span></div></div>
<div class="noteBox"><span class="noteIcon">◇</span><p>双方が成人で、お互いに自由な意思で話せることが前提です。この教材は相手の気持ちを操作するためではなく、誤解や圧力を避けて会話するための練習です。</p></div>
<div class="sectionHead"><h2>全10講義・履修登録</h2><span class="subText">6場面 ＋ 20問／講義</span></div>
<div class="lessonList">${COURSE.map((c,i)=>`<button class="lessonTile" data-open-lesson="${c.id}"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="flex"><span class="tag">${escapeHTML(c.tag)}</span><strong>${escapeHTML(c.title)}</strong><small>${escapeHTML(c.subtitle)}</small></span><span class="finish">${state.passed[c.id]?'✓ 修了':'›'}</span></button>`).join('')}</div><div class="footNote">※本教材の学習結果は現実の対人関係における成果を保証しません。記録は端末内に保存されます。</div>`;}
function renderLesson(){const c=COURSE.find(v=>v.id===ui.lesson);if(!c)return go('learn');controls(`<button class="cta" data-start-quiz="${c.id}">この章の20問テストへ →</button>`);
main.innerHTML=`<button class="back" data-page="learn">← 章一覧に戻る</button>${hero('LECTURE '+c.id+' / '+escapeHTML(c.tag),c.title,c.goal)}
${LAB_NOTES[c.id]?`<aside class="labNote"><div class="labLabel">補足資料 / ${c.id}</div><strong>${escapeHTML(LAB_NOTES[c.id].heading)}</strong><p class="labFormula">${escapeHTML(LAB_NOTES[c.id].formula)}</p><p>${escapeHTML(LAB_NOTES[c.id].comment)}</p></aside>`:''}
<div class="subNav"><a href="#lecture">01 理論講義</a><a href="#examples">02 実地例文</a><a href="#practice">03 確認テスト</a></div>
<section id="lecture"><div class="sectionHead"><h2>理論編：学習事項</h2><span class="subText">${c.lecture.length}つの観点</span></div><div class="reading">${c.lecture.map((entry,i)=>`<article class="readingCard"><span class="step">POINT ${String(i+1).padStart(2,'0')}</span><h3>${escapeHTML(entry[0])}</h3><p>${par(entry[1])}</p></article>`).join('')}</div></section>
<section id="examples"><div class="sectionHead"><h2>実践編：場面別の会話例</h2><span class="subText">${c.scenes.length}つの会話</span></div><div class="sceneList">${c.scenes.map((s,i)=>`<article class="scene"><div class="sceneTop"><span>CASE ${i+1}</span><strong>${escapeHTML(s[0])}</strong></div><div class="goodLine"><span class="lineLabel">模範解答</span><p>「${escapeHTML(s[1])}」</p>${audioButton(s[1])}</div><details><summary>比較例と解説</summary><div class="badLines"><p>× ${escapeHTML(s[2])}</p><p>× ${escapeHTML(s[3])}</p><div>${escapeHTML(s[4])}</div></div></details></article>`).join('')}</div></section>
<section id="practice" class="practiceBanner"><div><strong>章末確認テスト：全20問</strong><p>知識8問＋場面判断12問。16問以上で章の修了とします。</p></div><button class="cta" data-start-quiz="${c.id}">テスト開始 →</button></section>`;
}
function renderTest(){controls('');main.innerHTML=`${hero('ASSESSMENT · PRACTICE','応用対話・修了確認試験','全10講義・200問。状況の違いを読み取り、適切な応答を選んでください。各問に解説があります。')}
<div class="testBox"><div class="testBadge">おすすめ</div><h2>総合模擬試験（全範囲）</h2><p>学んだ場面を混ぜて確認します。いつでもやり直せます。</p><button class="cta" data-start-quiz="all">総合テストを開始 →</button></div>
<div class="sectionHead"><h2>章ごとに練習</h2><span class="subText">出題範囲：200問</span></div><div class="listRows">${COURSE.map(c=>`<button class="testRow" data-start-quiz="${c.id}"><span class="tag">第${Number(c.id)}章</span><strong>${escapeHTML(c.title)}</strong><span class="chevron">20問 ›</span></button>`).join('')}</div>`;}
function sampleQs(mode){if(mode==='all'){const pool=allQuestions().map(q=>({q,chapter:q.id.slice(0,2)}));for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,20);}
 if(mode==='wrong'){const keyset=new Set(state.wrong);return allQuestions().filter(q=>keyset.has(q.id)).map(q=>({q,chapter:q.id.slice(0,2)})).slice(0,20);}
 const chapter=COURSE.find(c=>c.id===mode);return chapter?buildQuestions(chapter).map(q=>({q,chapter:mode})):[];
}
function startQuiz(mode){const qs=sampleQs(mode);if(!qs.length){notify('復習する問題はまだありません。');return;}ui.quiz={mode,list:qs,n:0,answers:[],selected:null};ui.page='quiz';render();up();}
function answerQuiz(option){const z=ui.quiz;if(!z||z.selected!==null)return;const item=z.list[z.n];const choice=item.q.choices[option];if(!choice)return;z.selected=option;z.answers.push({id:item.q.id,correct:choice.correct});
 if(choice.correct)state.wrong=state.wrong.filter(id=>id!==item.q.id);else if(!state.wrong.includes(item.q.id))state.wrong.push(item.q.id);store();render();}
function moveQuiz(){const z=ui.quiz;if(!z||z.selected===null)return;z.n++;z.selected=null;render();up();}
function renderQuiz(){const z=ui.quiz;if(!z)return go('test');const current=z.list[z.n];if(!current)return renderQuizResult();const q=current.q, chosen=z.selected;const done=chosen!==null;const correct=done&&q.choices[chosen].correct;
 const chapter=COURSE.find(c=>c.id===current.chapter);
 controls(done?`<button class="cta" data-next-quiz>${z.n===z.list.length-1?'採点結果を見る':'次の問題へ →'}</button>`:'');
 main.innerHTML=`<button class="back" data-page="${z.mode==='wrong'?'review':'test'}">← テスト選択に戻る</button><div class="quizHead"><div class="between"><span class="eyebrow">${escapeHTML(chapter?.title||'総合テスト')}</span><strong>${z.n+1} / ${z.list.length}</strong></div><div class="track"><i style="width:${(z.n/z.list.length)*100}%"></i></div></div>
<div class="questionCard"><span class="tag">${escapeHTML(q.origin)}</span><h1>${par(q.question)}</h1><p class="hint">※この試験の採点基準は「雰囲気」ではなく「相手の意思」です。</p><div class="options">${q.choices.map((x,i)=>`<button type="button" data-answer="${i}" class="option ${done?(x.correct?'correct':i===chosen?'incorrect':'mutedChoice'):''}" ${done?'disabled':''}><span class="optionIndex">${String.fromCharCode(65+i)}</span><span>${escapeHTML(x.text)}</span>${done&&x.correct?'<span class="checkMark">✓</span>':''}</button>`).join('')}</div>
${done?`<div class="explain ${correct?'right':'wrong'}"><div class="explainTitle">${correct?'✓ 正解':'✕ 不正解'}</div><p>${escapeHTML(q.why)}</p><div class="sampleReply"><span>正答：${escapeHTML(q.choices.find(x=>x.correct).text)}</span>${audioButton(q.spoken,'▶ 正しい表現を聞く')}</div></div>`:''}</div><p class="footNote">正解・不正解は端末内に記録されます。途中で戻っても次回は初めからやり直せます。</p>`;}
function renderQuizResult(){const z=ui.quiz;const count=z.answers.filter(x=>x.correct).length, rate=Math.round(count/z.list.length*100),passed=rate>=80;if(z.mode!=='wrong'){state.history.unshift({mode:z.mode,count:z.list.length,correct:count,date:Date.now()});state.history=state.history.slice(0,40);}if(passed&&COURSE.some(c=>c.id===z.mode))state.passed[z.mode]=true;store();controls(`<button class="cta" data-retry>もう一度 ${z.list.length} 問に挑戦 →</button>`);
main.innerHTML=`<button class="back" data-page="test">← テスト一覧</button>${hero('EXAMINATION RESULT','到達度の確認','解答を確認し、必要に応じて誤答を復習してください。')}
<div class="resultPanel"><span class="tag">${passed?'修了基準を達成':'再学習を推奨'}</span><div class="bigScore">${count}<small> / ${z.list.length}</small></div><div class="scoreText">正答率 ${rate}%</div><div class="track"><i style="width:${rate}%"></i></div><p>${passed?'章の修了基準に達しました。異なる場面でも同じ原則を適用できるか確認しましょう。':'誤答した論点を確認してください。場面ごとの条件の違いが判断の要点です。'}</p></div>
<div class="summaryActions"><button class="softBtn" data-page="review">間違えた問題を復習</button><button class="softBtn" data-page="learn">章一覧へ</button></div>`;z.n=z.list.length;}
function renderReview(){controls('');const wrongQ=allQuestions().filter(q=>state.wrong.includes(q.id));main.innerHTML=`${hero('RETAKE EXAM','追試・再履修センター','「うーん」をYESと誤訳したら、ここで補講です。正解すると追試リストから消えます。')}
<div class="metrics metrics2"><div><b>${wrongQ.length}</b><span>復習待ち</span></div><div><b>${state.history.length}</b><span>完了したテスト</span></div></div>
<button class="cta wide" data-start-quiz="wrong" ${wrongQ.length?'':'disabled'}>間違えた問題をまとめて練習 →</button>
<div class="sectionHead"><h2>追試リスト</h2><span class="subText">${wrongQ.length}問</span></div>${wrongQ.length?`<div class="listRows">${wrongQ.slice(0,60).map(q=>`<div class="reviewRow"><span class="tag">第${Number(q.id.slice(0,2))}章</span><strong>${escapeHTML(q.question.replace(/\n/g,' ').slice(0,100))}</strong></div>`).join('')}</div>`:'<div class="empty"><div class="emptyIcon">✓</div><h3>復習待ちはありません</h3><p>テストを解くと間違えた問題がここに集まります。</p></div>'}
<div class="sectionHead"><h2>最近の記録</h2></div>${state.history.length?`<div class="listRows">${state.history.slice(0,10).map(v=>`<div class="reviewRow"><strong>${escapeHTML(v.mode==='all'?'総合テスト':v.mode==='wrong'?'復習テスト':'第'+Number(v.mode)+'章')}</strong><span>${v.correct}/${v.count} 問 正解 · ${new Date(v.date).toLocaleDateString('ja-JP')}</span></div>`).join('')}</div>`:'<p class="subText">まだ記録はありません。</p>'}`;}
function phraseItems(){return PHRASES.filter(p=>(ui.phraseCat==='すべて'||p[0]===ui.phraseCat)&&(!ui.phraseQuery||p.join(' ').includes(ui.phraseQuery)));}
function phraseHTML(){return phraseItems().map(p=>`<article class="phrase"><span class="tag">${escapeHTML(p[0])}</span><p>${escapeHTML(p[1])}</p><div class="phraseFoot"><small>${escapeHTML(p[2])}</small><div class="phraseBtns">${audioButton(p[1],'▶ 聞く')}<button class="copy" data-copy="${escapeHTML(p[1])}">コピー</button></div></div></article>`).join('')||'<div class="empty"><p>一致するフレーズがありません。</p></div>';}
function renderPhrases(){controls('');const cats=['すべて',...new Set(PHRASES.map(p=>p[0]))];main.innerHTML=`${hero('FIELD REFERENCE','実地で使う日本語・資料集','場面に応じて使える表現例です。実際には自分の話し方と関係性に合わせて調整してください。')}
<div class="phraseSearch"><input id="phraseSearch" type="search" autocomplete="off" placeholder="例：ホテル / 帰る / ありがとう" value="${escapeHTML(ui.phraseQuery)}" aria-label="フレーズを検索"><div class="filterChips">${cats.map(c=>`<button class="filter ${ui.phraseCat===c?'active':''}" data-filter="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('')}</div></div><div id="phraseResults" class="phraseGrid">${phraseHTML()}</div>`;}
const SIM_AXES=['相手の意思','意図の明確さ','状況判断','会話の自然さ','断りへの対応'];
 function simAxis(index){return SIM_AXES[index%SIM_AXES.length];}
 function simNew(id){
   const s=SIMULATIONS.find(v=>v.id===id);
   if(!s)return null;
   return {id,index:0,repair:false,repairFrom:null,history:[],total:0,axes:Object.fromEntries(SIM_AXES.map(k=>[k,{earned:0,max:0}])),errors:0,repairs:0,streak:0,ending:null,started:new Date().toISOString()};
 }
 function simLoadDraft(){
   const d=state.simDraft;
   if(!d||!SIMULATIONS.some(s=>s.id===d.id)||!Array.isArray(d.history)||!Number.isInteger(d.index)||d.index<0||d.index>20||!d.axes||typeof d.axes!=='object'||d.ending)return null;
   return d;
 }
 function simSave(){
   state.simDraft=ui.sim&&!ui.sim.ending?ui.sim:null;
   store();
 }
 function simSelect(id,resume=false){
   ui.sim=resume&&simLoadDraft()&&state.simDraft.id===id?JSON.parse(JSON.stringify(state.simDraft)):simNew(id);
   if(!ui.sim){notify('演習データが見つかりません。');return;}
   ui.simId=id;ui.page='sim';render();up();simSave();
 }
 function simRepairProfile(z){
   const last=[...z.history].reverse().find(h=>!h.isRepair);
   const said=last?.say||'';
   if(/既読|返事|返信|連絡|土曜|予定|空けて/.test(said))return {prompt:'「返事や予定は私にも都合があるんだけど」',good:'急かしたり、勝手に予定を決めたりしてごめん。返事は自分のペースで大丈夫。',reply:'「そうしてくれると助かる」'};
   if(/評価|仕事|先輩|上司|残業|職場/.test(said))return {prompt:'「仕事の関係とは切り離して話してほしい」',good:'ごめん。仕事上の立場を使うような言い方だった。私的な話を無理に進めないよ。',reply:'「その方が安心します」'};
   if(/電車|終電|バス|駅|帰|乗り場|降りて/.test(said))return {prompt:'「帰りたいっていう気持ち、伝わってる？」',good:'ごめん。帰る予定を邪魔するような言い方だった。帰れるようにしよう。',reply:'「ありがとう。そうしてほしい」'};
   if(/ホテル|泊ま|部屋|予約|ここまで来た|流れ/.test(said))return {prompt:'「私はまだそれを決めたわけじゃないよ」',good:'ごめん。勝手に決まったことにするべきじゃなかった。君がどうしたいか聞かせて。',reply:'「うん、ちゃんと聞いてほしい」'};
   if(/お礼|見返り|払う|頑張った|埋め合わせ/.test(said))return {prompt:'「それ、交換条件みたいに聞こえるけど」',good:'ごめん。見返りを求める言い方だった。そんな約束はいらないよ。',reply:'「それならよかった」'};
   return {prompt:'「今の言い方、ちょっと困った。どういう意味？」',good:'ごめん。決めつけた言い方になってた。君の考えも聞かせて。',reply:'「そうしてもらえるとうれしい」'};
 }
 function simRepairOptions(z){
   const p=simRepairProfile(z);
   return [
     [p.good,p.reply,'前の発言を修正し、相手が自分の意思で判断できる状態に戻しました。',1],
     ['言い方がよくなかった。いったん話を戻してもいい？','「分かった。でも少し気になったよ」','言い直す姿勢はありますが、相手が何に困ったのかも確認しましょう。',0],
     ['そういう意味じゃないから、気にしないで。','「気になったから言ったんだけど……」','自分の意図だけではなく、相手がどう受け取ったかも重要です。',-1]
   ];
 }
 function simChoice(choiceIndex){
   const z=ui.sim,s=SIMULATIONS.find(v=>v.id===ui.simId);
   if(!z||!s||z.ending)return;
   const isRepair=z.repair;
   const beat=s.messages[z.index];
   if(!beat)return;
   const options=isRepair?simRepairOptions(z):beat.options;
   const op=options[choiceIndex];if(!op)return;
   const axis=simAxis(z.index);
   const prompt=isRepair?simRepairProfile(z).prompt:beat.partner;
   let rating=op[3];
   let points=0;
   if(isRepair){
     if(rating===1){z.repairs++;z.streak=0;z.total+=1;z.axes[axis].earned+=1;points=1;}
     else if(rating===0){z.streak=0;}
     else{z.streak++;}
     z.repair=false;
     z.index++;
     if(z.streak>=6)z.ending='withdrawn';
   }else{
     points=rating===3?3:rating===1?1:0;
     z.total+=points;
     z.axes[axis].earned+=points;
     z.axes[axis].max+=3;
     if(rating===0){z.errors++;z.streak++;z.repair=true;z.repairFrom=z.index;}
     else {z.streak=0;z.index++;}
   }
   z.history.push({partner:prompt,say:op[0],response:op[1],feedback:op[2],rating,isRepair,axis,points});
   if(!z.repair&&(z.index>=s.messages.length||z.ending))z.ending=z.ending||'finished';
   if(z.ending){
     state.simDraft=null;
     state.simRecords=state.simRecords||{};
     const score=simScore(z),prev=state.simRecords[z.id]||{};
     state.simRecords[z.id]={last:score,best:Math.max(score,prev.best||0),attempts:(prev.attempts||0)+1,date:new Date().toISOString()};
   }
   simSave();
   simAppendLatest(z.history[z.history.length-1]);
   simPaintStage();
   simPosition();
 }
 function simScore(z){
   const s=SIMULATIONS.find(v=>v.id===z.id);
   return Math.min(100,Math.max(0,Math.round(100*z.total/(s.messages.length*3))));
 }
 function simAppendLatest(h){
   const thread=document.querySelector('#simThread');if(!thread)return;
   const safe=escapeHTML;
   const classification=h.isRepair?(h.rating===1?'修正できた返答':'再説明の余地あり'):(h.rating===3?'場面に適した返答':h.rating===1?'改善できる返答':'相手の反応を確認');
   const frag=document.createElement('div');
   frag.className='simExchange';
   frag.innerHTML='<div class="chat partner"><span>相手</span><p>'+safe(h.partner)+'</p></div>'+
     '<div class="chat self"><span>あなた</span><p>「'+safe(h.say)+'」</p></div>'+
     '<div class="chat partner"><span>相手</span><p>'+safe(h.response)+'</p></div>'+
     '<div class="coach '+((h.rating===0||h.rating===-1)?'attention':'')+'"><strong>'+classification+'</strong><p>'+safe(h.feedback)+'</p></div>';
   thread.appendChild(frag);
 }
 function simPosition(){
   const stage=document.querySelector('#simStage')||document.querySelector('#simResult');
   if(!stage)return;
   const focused=document.activeElement;
   if(focused&&focused instanceof HTMLElement&&focused.tagName==='BUTTON')focused.blur();
   requestAnimationFrame(()=>{
     const target=stage.getBoundingClientRect();
     const top=Math.max(0,window.scrollY+target.top-94);
     window.scrollTo({top,behavior:'smooth'});
   });
 }
 function simPaintStage(){
   const z=ui.sim,s=SIMULATIONS.find(v=>v.id===ui.simId);
   const stage=document.querySelector('#simStage'),meter=document.querySelector('#simMeter');
   if(!stage||!s||!z)return;
   const total=s.messages.length,answered=z.history.filter(h=>!h.isRepair).length;
   if(meter)meter.innerHTML='<div class="between"><span>進行 '+Math.min(answered,total)+' / '+total+'</span><span>選択 '+z.history.length+' 回</span></div><div class="track"><i style="width:'+(100*answered/total)+'%"></i></div>';
   if(z.ending){
     const score=simScore(z),level=score>=85?'優良':score>=70?'良好':score>=50?'要改善':'再履修推奨';
     const cls=z.ending==='withdrawn'?'対話が途中で終了しました':'演習修了';
     const breakdown=SIM_AXES.map(axis=>{
       const a=z.axes[axis]||{earned:0,max:0},n=a.max?Math.round(100*a.earned/a.max):0;
       return '<div class="simAxis"><div class="between"><strong>'+axis+'</strong><span>'+n+'点</span></div><div class="track"><i style="width:'+n+'%"></i></div></div>';
     }).join('');
     stage.innerHTML='<section id="simResult" class="simResult"><div class="eyebrow">FIELD REPORT / '+s.id.toUpperCase()+'</div><h2>'+cls+'</h2><div class="simGrade"><strong>'+score+'</strong><span> / 100点</span></div><div class="simLevel">'+level+'</div><p class="simResultText">'+(z.ending==='withdrawn'?'言葉の選択が重なり、相手は会話を終える判断をしました。ここで引き止めず終了します。':'相手がホテルへ同行したかどうかではなく、提案の明確さと相手の意思への配慮を評価しました。')+'</p><div class="simAxisList">'+breakdown+'</div><div class="simResultStats"><span>本編回答 <b>'+answered+'</b> 件</span><span>不適切な返答 <b>'+z.errors+'</b> 件</span><span>言い直し成功 <b>'+z.repairs+'</b> 件</span></div><div class="simAdvice"><strong>振り返り</strong><p>'+(z.errors===0?'状況を丁寧に読み取れています。今度は別の場面も試してください。':z.repairs?'言い直しができたのは重要です。最初の返答で相手に負担をかけない方法も見直しましょう。':'相手の返答が曖昧な場面では、結論を急がず希望を聞くことが重要です。')+'</p></div><div class="endButtons"><button class="cta" data-sim-retry>このケースを再演習</button><button class="softBtn" data-sim-back>ケース一覧に戻る</button></div></section>';
     return;
   }
   const repair=z.repair,beat=s.messages[z.index],options=repair?simRepairOptions(z):beat.options;
   const question=repair?simRepairProfile(z).prompt:beat.partner;
   stage.innerHTML='<div class="simCurrent"><div class="chat partner"><span>相手'+(repair?' · 確認':'')+'</span><p>'+escapeHTML(question)+'</p></div><div class="choicePanel"><div class="eyebrow">'+(repair?'REPAIR / 言い直し':'YOUR RESPONSE / '+String(z.index+1).padStart(2,'0'))+'</div><h2>'+(repair?'どう言い直しますか？':'どう返しますか？')+'</h2><div class="options">'+options.map((op,i)=>'<button class="option" data-sim-choice="'+i+'"><span class="optionIndex">'+String.fromCharCode(65+i)+'</span><span>'+escapeHTML(op[0])+'</span></button>').join('')+'</div></div></div>';
 }
 function renderSim(){
   controls('');
   if(!ui.simId||!ui.sim){
     const d=simLoadDraft(),records=state.simRecords||{};
     main.innerHTML=hero('FIELD PRACTICE','実地演習','会話の経過に応じて返答を選びます。間違えた場合も、言い直して関係を立て直す練習ができます。')+
       '<div class="noteBox"><span class="noteIcon">◉</span><p>各ケース10場面、全16ケースで160の判断場面。結果は承諾の獲得ではなく、会話の明確さと意思の尊重により100点満点で評価します。</p></div>'+
       (d?'<button class="resumeCard" data-sim-resume="'+escapeHTML(d.id)+'"><strong>前回の演習を続ける</strong><small>'+escapeHTML(SIMULATIONS.find(s=>s.id===d.id).title)+' · '+d.index+' / 10</small><span>再開 →</span></button>':'')+
       '<div class="sectionHead"><h2>ケース別実地研修</h2><span class="subText">'+SIMULATIONS.length+'ケース・'+SIMULATIONS.reduce((n,s)=>n+s.messages.length,0)+'場面</span></div><div class="lessonList">'+SIMULATIONS.map((s,i)=>{
         const r=records[s.id];return '<button class="lessonTile" data-sim="'+escapeHTML(s.id)+'"><span class="num">'+String(i+1).padStart(2,'0')+'</span><span class="flex"><strong>'+escapeHTML(s.title)+'</strong><small>'+escapeHTML(s.desc)+'</small><small class="simBest">'+(r?'自己最高 '+r.best+'点 · '+r.attempts+'回受講':'未受講')+'</small></span><span class="finish">›</span></button>';
       }).join('')+'</div>';
     return;
   }
   const s=SIMULATIONS.find(v=>v.id===ui.simId);
   if(!s)return go('sim',{simId:null,sim:null});
   main.innerHTML='<button class="back" data-sim-back>← ケース一覧</button>'+hero('FIELD PRACTICE / '+s.id.toUpperCase(),s.title,s.desc)+'<div id="simMeter" class="simMeter" aria-label="演習進捗"></div><div id="simThread" class="conversation" aria-label="会話履歴"></div><div id="simStage" tabindex="-1"></div>';
   for(const h of ui.sim.history)simAppendLatest(h);
   simPaintStage();
 }
function renderSettings(){controls('');main.innerHTML=`<button class="back" data-page="${escapeHTML(ui.settingsBack)}">← 戻る</button>${hero('AUDIO SETTINGS','読み上げ設定','例文の読み上げ速度を変更できます。日本語音声の品質は端末の読み上げエンジンに依存します。')}
<div class="readingCard"><h3>読み上げ速度</h3><p class="subText">低い数値ほどゆっくりです。音の自然さは端末によって変わります。</p><div class="rateControls">${[.6,.7,.8,.9,1,1.1].map(r=>`<button data-rate="${r}" class="rate ${state.rate===r?'active':''}">${r.toFixed(1)}×</button>`).join('')}</div><div style="margin-top:20px">${audioButton('今日は一緒にいられて楽しかった。よかったら、もう少し話さない？','▶ 試聴する')}</div></div><div class="noteBox"><span class="noteIcon">♫</span><p>一部端末では日本語の音声がインストールされていないと再生されません。端末の読み上げ設定で日本語音声を有効にしてください。音声データはサーバーへ送信しません。</p></div>`;}
main.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;
 if(el.hasAttribute('data-page')){go(el.dataset.page);return;}
 if(el.hasAttribute('data-open-lesson')){go('lesson',{lesson:el.dataset.openLesson});return;}
 if(el.hasAttribute('data-start-quiz')){startQuiz(el.dataset.startQuiz);return;}
 if(el.hasAttribute('data-answer')){answerQuiz(Number(el.dataset.answer));return;}
 if(el.hasAttribute('data-next-quiz')){moveQuiz();return;}
 if(el.hasAttribute('data-retry')){startQuiz(ui.quiz?.mode||'all');return;}
 if(el.hasAttribute('data-speak')){const txt=sounds[Number(el.dataset.speak)];if(txt)speak(txt);return;}
 if(el.hasAttribute('data-rate')){state.rate=Number(el.dataset.rate);store();render();return;}
 if(el.hasAttribute('data-copy')){const txt=el.dataset.copy;if(navigator.clipboard?.writeText)navigator.clipboard.writeText(txt).then(()=>notify('コピーしました')).catch(()=>notify('コピーできませんでした'));else{notify('この端末ではコピーできません。長押しで選択してください。');}return;}
 if(el.hasAttribute('data-filter')){ui.phraseCat=el.dataset.filter;renderPhrases();return;}
 if(el.hasAttribute('data-sim')){simSelect(el.dataset.sim);return;}
 if(el.hasAttribute('data-sim-resume')){simSelect(el.dataset.simResume,true);return;}
 if(el.hasAttribute('data-sim-choice')){simChoice(Number(el.dataset.simChoice));return;}
 if(el.hasAttribute('data-sim-retry')){simSelect(ui.simId);return;}
 if(el.hasAttribute('data-sim-back')){ui.simId=null;ui.sim=null;render();up();return;}
});
main.addEventListener('input',e=>{if(e.target.id==='phraseSearch'){ui.phraseQuery=e.target.value;const list=$('#phraseResults');if(list){sounds=[];list.innerHTML=phraseHTML();}}});
bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.startQuiz)startQuiz(b.dataset.startQuiz);else if(b.hasAttribute('data-next-quiz'))moveQuiz();else if(b.hasAttribute('data-retry'))startQuiz(ui.quiz?.mode||'all');});
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const page=b.dataset.tab;ui.quiz=null;ui.simId=null;ui.sim=null;go(page);});
$('#voiceSettings').addEventListener('click',()=>{ui.settingsBack=ui.page==='lesson'?'learn':ui.page==='quiz'?'test':ui.page;go('settings');});
// Safety guard: expected authoring structure and question counts.
if(COURSE.some(c=>c.checks.length!==8||c.scenes.length!==6||buildQuestions(c).length!==20))notify('教材データの読み込みに問題があります。');
render();
if('serviceWorker'in navigator && location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
