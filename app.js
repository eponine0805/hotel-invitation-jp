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
const ui={page:'learn',lesson:null,quiz:null,simId:null,step:0,simHistory:[],simEnd:null,phraseCat:'すべて',phraseQuery:'',settingsBack:'learn'};
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
function simSelect(id){ui.simId=id;ui.step=0;ui.simHistory=[];ui.simEnd=null;render();up();}
function simChoice(i){const sim=SIMULATIONS.find(s=>s.id===ui.simId),turn=sim?.messages[ui.step],opt=turn?.options[i];if(!opt)return;
ui.simHistory.push({partner:turn.partner,say:opt[0],response:opt[1],feedback:opt[2],correct:opt[3]!==-1});
if(opt[3]===-1)ui.simEnd='stop';else if(opt[3]===2||ui.step===sim.messages.length-1)ui.simEnd='complete';else ui.step++;
render();up();}
function renderSim(){controls('');if(!ui.simId){main.innerHTML=`${hero('FIELD EXPERIMENT','会話シミュレーション','会話の展開に応じて選択肢を選びます。評価対象は承諾の獲得ではなく、意思確認と状況に合った応答です。')}
<div class="noteBox"><span class="noteIcon">◉</span><p>架空の状況を用いた演習です。実際の返答は人や関係性によって異なります。</p></div><div class="sectionHead"><h2>6つの練習場面</h2></div><div class="lessonList">${SIMULATIONS.map((s,i)=>`<button class="lessonTile" data-sim="${s.id}"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="flex"><strong>${escapeHTML(s.title)}</strong><small>${escapeHTML(s.desc)}</small></span><span class="finish">›</span></button>`).join('')}</div>`;return;}
 const sim=SIMULATIONS.find(s=>s.id===ui.simId);if(!sim)return go('sim',{simId:null});let h=`<button class="back" data-sim-back>← シナリオ一覧</button>${hero('DIALOGUE PRACTICE',sim.title,sim.desc)}<div class="conversation">`;
 for(const item of ui.simHistory)h+=`<div class="chat partner"><span>相手</span><p>${escapeHTML(item.partner)}</p></div><div class="chat self"><span>あなた</span><p>「${escapeHTML(item.say)}」</p></div><div class="chat partner"><span>相手</span><p>${escapeHTML(item.response)}</p></div><div class="coach ${item.correct?'':'attention'}"><strong>${item.correct?'解説：適切な応答':'解説：再検討が必要'}</strong><p>${escapeHTML(item.feedback)}</p>${audioButton(item.say,'▶ 自分の返答を聞く')}</div>`;
 if(ui.simEnd){h+=`</div><div class="endBanner"><h2>${ui.simEnd==='complete'?'演習終了':'演習を終了しました'}</h2><p>${ui.simEnd==='complete'?'会話の流れに沿った判断ができました。現実には相手の反応を都度確かめてください。':'相手が自由に選べる条件を確認し、別の返答を検討してください。'}</p><div class="endButtons"><button class="cta" data-sim-retry>最初からやり直す</button><button class="softBtn" data-sim-back>他のシナリオ</button></div></div>`;}
 else {let msg=sim.messages[ui.step];h+=`<div class="chat partner"><span>相手</span><p>${escapeHTML(msg.partner)}</p></div></div><div class="choicePanel"><div class="eyebrow">YOU SAY</div><h2>どう返しますか？</h2><div class="options">${msg.options.map((opt,i)=>`<button class="option" data-sim-choice="${i}"><span class="optionIndex">${String.fromCharCode(65+i)}</span><span>${escapeHTML(opt[0])}</span></button>`).join('')}</div></div>`;}
 main.innerHTML=h;
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
 if(el.hasAttribute('data-sim-choice')){simChoice(Number(el.dataset.simChoice));return;}
 if(el.hasAttribute('data-sim-retry')){simSelect(ui.simId);return;}
 if(el.hasAttribute('data-sim-back')){ui.simId=null;render();up();return;}
});
main.addEventListener('input',e=>{if(e.target.id==='phraseSearch'){ui.phraseQuery=e.target.value;const list=$('#phraseResults');if(list){sounds=[];list.innerHTML=phraseHTML();}}});
bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.startQuiz)startQuiz(b.dataset.startQuiz);else if(b.hasAttribute('data-next-quiz'))moveQuiz();else if(b.hasAttribute('data-retry'))startQuiz(ui.quiz?.mode||'all');});
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const page=b.dataset.tab;ui.quiz=null;ui.simId=null;go(page);});
$('#voiceSettings').addEventListener('click',()=>{ui.settingsBack=ui.page==='lesson'?'learn':ui.page==='quiz'?'test':ui.page;go('settings');});
// Safety guard: expected authoring structure and question counts.
if(COURSE.some(c=>c.checks.length!==8||c.scenes.length!==6||buildQuestions(c).length!==20))notify('教材データの読み込みに問題があります。');
render();
if('serviceWorker'in navigator && location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
