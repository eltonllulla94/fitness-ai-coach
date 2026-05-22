const PROFILE_KEY="gemini_fitness_profile",LOG_KEY="gemini_fitness_logs",CHAT_KEY="gemini_fitness_chat";
let profile=JSON.parse(localStorage.getItem(PROFILE_KEY)||"{}");
let logs=JSON.parse(localStorage.getItem(LOG_KEY)||"[]");
let chat=JSON.parse(localStorage.getItem(CHAT_KEY)||"[]");

function today(){return new Date().toISOString().slice(0,10)}
function saveProfile(){
 const bodyWeight=Number(document.getElementById("bodyWeight").value);
 const height=Number(document.getElementById("height").value);
 const age=Number(document.getElementById("age").value);
 const gender=document.getElementById("gender").value;
 const bmr=gender==="male"?10*bodyWeight+6.25*height-5*age+5:10*bodyWeight+6.25*height-5*age-161;
 profile={bodyWeight,height,age,gender,bmr:Math.round(bmr),tdee:Math.round(bmr*1.45)};
 localStorage.setItem(PROFILE_KEY,JSON.stringify(profile)); renderProfile();
}
function loadProfile(){
 if(profile.bodyWeight)document.getElementById("bodyWeight").value=profile.bodyWeight;
 if(profile.height)document.getElementById("height").value=profile.height;
 if(profile.age)document.getElementById("age").value=profile.age;
 if(profile.gender)document.getElementById("gender").value=profile.gender;
 saveProfile();
}
function renderProfile(){
 document.getElementById("bmr").textContent=(profile.bmr||"-")+" kcal";
 document.getElementById("tdee").textContent=(profile.tdee||"-")+" kcal";
}
function saveData(){localStorage.setItem(LOG_KEY,JSON.stringify(logs));localStorage.setItem(CHAT_KEY,JSON.stringify(chat.slice(-80)))}
function renderChat(){
 const el=document.getElementById("chat"); el.innerHTML="";
 if(chat.length===0){chat.push({role:"ai",text:"Çkemi 👋 Jam coach-i yt me Gemini. Shkruaj lirshëm: ushqim, stërvitje, pyetje, plan, progres."})}
 chat.forEach(msg=>{const div=document.createElement("div");div.className="bubble "+(msg.role==="user"?"user":"ai");div.textContent=msg.text;el.appendChild(div)});
 el.scrollTop=el.scrollHeight;
}
function addChat(role,text){chat.push({role,text,time:Date.now()});saveData();renderChat()}
function exampleFood(){document.getElementById("chatInput").value="kam ngrënë 5 qofte me pilaf"}
function exampleWorkout(){document.getElementById("chatInput").value="kam bërë bench press 3 sete me 87.5kg nga 10 përsëritje"}
async function sendMessage(){
 const input=document.getElementById("chatInput"); const message=input.value.trim(); if(!message)return;
 input.value=""; addChat("user",message); const typingId=addTyping();
 try{
  const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,profile,recentLogs:logs.slice(-20),chatHistory:chat.slice(-12)})});
  const data=await res.json(); removeTyping(typingId);
  if(!res.ok){addChat("ai","Gabim: "+(data.error||"Nuk u lidh dot me Gemini."));return}
  const foods=Array.isArray(data.foods)?data.foods:[], workouts=Array.isArray(data.workouts)?data.workouts:[];
  if(foods.length||workouts.length){
    logs.push({id:crypto.randomUUID(),date:today(),message,foods,workouts,totalFoodKcal:foods.reduce((s,x)=>s+Number(x.kcal||0),0),totalProtein:foods.reduce((s,x)=>s+Number(x.protein||0),0),totalBurn:workouts.reduce((s,x)=>s+Number(x.burnKcal||0),0),totalVolume:workouts.reduce((s,x)=>s+Number(x.volume||0),0)});
  }
  addChat("ai",data.reply||"E mora."); saveData(); renderAll();
 }catch(err){removeTyping(typingId);addChat("ai","Nuk u lidh dot me backend/Gemini. Sigurohu që serveri po punon me npm start.")}
}
function addTyping(){const id="typing-"+Date.now(),el=document.getElementById("chat"),div=document.createElement("div");div.id=id;div.className="bubble ai";div.textContent="Gemini po mendon...";el.appendChild(div);el.scrollTop=el.scrollHeight;return id}
function removeTyping(id){const el=document.getElementById(id);if(el)el.remove()}
function renderTotals(){
 const todayLogs=logs.filter(l=>l.date===today());
 const food=todayLogs.reduce((s,l)=>s+Number(l.totalFoodKcal||0),0),protein=todayLogs.reduce((s,l)=>s+Number(l.totalProtein||0),0),burn=todayLogs.reduce((s,l)=>s+Number(l.totalBurn||0),0),volume=todayLogs.reduce((s,l)=>s+Number(l.totalVolume||0),0);
 document.getElementById("todayFood").textContent=food+" kcal";document.getElementById("todayProtein").textContent=protein+"g proteinë";document.getElementById("todayBurn").textContent=burn+" kcal";
 document.getElementById("dailySummary").innerHTML=`<div><span>Ushqim</span><strong>${food} kcal</strong></div><div><span>Proteinë</span><strong>${protein}g</strong></div><div><span>Djegie</span><strong>${burn} kcal</strong></div><div><span>Volume</span><strong>${volume} kg</strong></div>`;
}
function renderLog(){
 const el=document.getElementById("log"),todayLogs=logs.filter(l=>l.date===today());
 if(!todayLogs.length){el.className="log empty";el.textContent="Ende nuk ka log.";return}
 el.className="log";el.innerHTML=todayLogs.slice().reverse().map(l=>`<div class="log-item"><div><strong>${l.message}</strong><p class="muted">${l.date}</p>${(l.foods||[]).map(f=>`<span class="tag">${f.name} · ${f.kcal||0} kcal · ${f.protein||0}g proteinë</span>`).join("")}${(l.workouts||[]).map(w=>`<span class="tag">${w.name} · ${w.burnKcal||0} kcal · volume ${w.volume||0}kg</span>`).join("")}</div><div><div class="food">+${l.totalFoodKcal||0}</div><div class="kcal">-${l.totalBurn||0}</div></div></div>`).join("");
}
function clearToday(){logs=logs.filter(l=>l.date!==today());saveData();renderAll()}
async function generateReport() {
  const reportBox = document.getElementById("reportBox");

  if (!logs.length) {
    reportBox.textContent = "Nuk ka ende mjaftueshëm të dhëna për raport.";
    return;
  }

  reportBox.textContent = "AI po analizon progresin tënd...";

  try {
    const res = await fetch("/api/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        profile,
        logs
      })
    });

    const data = await res.json();

    if (!res.ok) {
      reportBox.textContent = "Gabim: " + (data.error || "Raporti nuk u gjenerua.");
      return;
    }

    reportBox.textContent = data.report || "Raporti nuk u gjenerua.";
  } catch (err) {
    reportBox.textContent = "Nuk u lidh dot me AI për raportin.";
  }
}
function renderAll(){renderChat();renderTotals();renderLog()}
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey))sendMessage()});
loadProfile();renderAll();
