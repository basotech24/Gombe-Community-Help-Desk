/* Gombe Community Helpdesk — offline-first learning project */
const DB_KEY = "gch_offline_data_v1";
const THEME_KEY = "gch_offline_theme_v1";
const USERS_KEY = "gch_local_users_v1";
const SESSION_KEY = "gch_local_session_v1";
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const categories = ["Roads & transport","Water supply","Waste & sanitation","Electricity & streetlights","Public facilities","Safety concern","Other"];
const priorities = ["Low","Medium","High"];
const reportStatuses = ["Open","In progress","Resolved"];
const taskStatuses = ["Not started","In progress","Completed"];
const emptyData = () => ({reports:[],tasks:[],contacts:[],resources:[],settings:{workspaceName:"Gombe Community Helpdesk",defaultArea:"",language:"English",darkMode:false}});
let data = loadData();
let modalType = null;
let toastTimer = null;

function id(prefix){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
function loadData(){
  try{
    const raw=localStorage.getItem(DB_KEY);
    if(raw){const parsed=JSON.parse(raw);return {...emptyData(),...parsed,settings:{...emptyData().settings,...(parsed.settings||{})}};}
  }catch(error){console.warn("Local data could not be read",error);}
  const fresh=emptyData();
  fresh.reports=[
    {id:"sample-r1",title:"Streetlight not working",category:"Electricity & streetlights",area:"Pantami",priority:"High",description:"The streetlight near the junction has not been working for several nights.",reporter:"Community member",status:"Open",createdAt:"2026-09-28T09:00:00.000Z"},
    {id:"sample-r2",title:"Blocked drainage after rainfall",category:"Waste & sanitation",area:"Bolari",priority:"Medium",description:"Leaves and rubbish are blocking the drainage beside the main walkway.",reporter:"Amina",status:"In progress",createdAt:"2026-09-26T12:00:00.000Z"},
    {id:"sample-r3",title:"Public water point repaired",category:"Water supply",area:"Dukku Road",priority:"Low",description:"The public water point was reported earlier and has now been repaired.",reporter:"Local volunteer",status:"Resolved",createdAt:"2026-09-20T08:30:00.000Z"}
  ];
  fresh.tasks=[
    {id:"sample-t1",title:"Follow up on streetlight report",description:"Check whether the issue has been referred to the relevant service provider.",owner:"Community volunteer",dueDate:"",status:"In progress",relatedReport:"sample-r1",createdAt:new Date().toISOString()},
    {id:"sample-t2",title:"Organize drainage clean-up",description:"Coordinate a small volunteer team and record the outcome.",owner:"Ward volunteer",dueDate:"",status:"Not started",relatedReport:"sample-r2",createdAt:new Date().toISOString()}
  ];
  return fresh;
}
function saveData(){try{localStorage.setItem(DB_KEY,JSON.stringify(data));return true;}catch(e){showToast("Storage is full or unavailable. Export a backup.");return false;}}
function esc(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function dateLabel(value){if(!value)return "No date";const d=new Date(value);return Number.isNaN(d.getTime())?"Invalid date":new Intl.DateTimeFormat("en-NG",{day:"numeric",month:"short",year:"numeric"}).format(d);}
function statusClass(s){return String(s).toLowerCase().replace(/\s+/g,"-");}
function badge(status){return `<span class="status status-${statusClass(status)}">${esc(status)}</span>`;}
function showToast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
function setView(view){
  $$(".view").forEach(el=>el.classList.toggle("active",el.id===`view-${view}`));
  $$(".nav-link").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
  const active=$(`.nav-link[data-view="${view}"]`);
  $("#page-crumb").textContent=active?active.textContent.trim().replace(/\s+\d+$/,""):view;
  $("#sidebar").classList.remove("open");
  if(view==="dashboard")renderDashboard();
  if(view==="reports")renderReports();
  if(view==="tasks")renderTasks();
  if(view==="directory")renderContacts();
  if(view==="resources")renderResources();
  if(view==="analytics")renderAnalytics();
  if(view==="backup")renderStorage();
  if(view==="settings")fillSettings();
}
function reportTitle(reportId){return data.reports.find(r=>r.id===reportId)?.title||"General follow-up";}
function renderDashboard(){
  const reports=data.reports, tasks=data.tasks;
  $("#stat-total").textContent=reports.length;
  $("#stat-open").textContent=reports.filter(r=>r.status!=="Resolved").length;
  $("#stat-resolved").textContent=reports.filter(r=>r.status==="Resolved").length;
  $("#stat-tasks").textContent=tasks.filter(t=>t.status!=="Completed").length;
  $("#nav-report-count").textContent=reports.length;
  const recent=[...reports].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  $("#dashboard-reports").innerHTML=recent.length?recent.map(r=>`<div class="compact-row"><div class="issue-dot">▤</div><div class="compact-main"><strong>${esc(r.title)}</strong><small>${esc(r.area)} · ${esc(dateLabel(r.createdAt))}</small></div>${badge(r.status)}</div>`).join(""):`<div class="empty-state"><strong>No reports yet</strong><p>Create your first community report.</p></div>`;
  const statuses=[["Open",reports.filter(r=>r.status==="Open").length,"open"],["In progress",reports.filter(r=>r.status==="In progress").length,"progress"],["Resolved",reports.filter(r=>r.status==="Resolved").length,"resolved"]];
  $("#status-overview").innerHTML=statuses.map(([name,count,cls])=>`<div class="bar-row"><span>${name}</span><div class="bar-track"><div class="bar-fill ${cls}" style="width:${reports.length?count/reports.length*100:0}%"></div></div><strong>${count}</strong></div>`).join("");
}
function renderReports(){
  const q=($("#report-search")?.value||"").trim().toLowerCase(), sf=$("#report-status-filter")?.value||"All", cf=$("#report-category-filter")?.value||"All";
  const rows=data.reports.filter(r=>[r.title,r.area,r.category,r.description,r.reporter].join(" ").toLowerCase().includes(q)&&(sf==="All"||r.status===sf)&&(cf==="All"||r.category===cf)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  $("#reports-table").innerHTML=rows.map(r=>`<tr><td><strong>${esc(r.title)}</strong><small>${esc(r.description.slice(0,76))}${r.description.length>76?"…":""}</small></td><td>${esc(r.area)}</td><td>${esc(r.category)}</td><td><span class="priority priority-${r.priority.toLowerCase()}">${esc(r.priority)}</span></td><td><select class="inline-status" data-report-status="${esc(r.id)}" aria-label="Status for ${esc(r.title)}">${reportStatuses.map(s=>`<option ${s===r.status?"selected":""}>${s}</option>`).join("")}</select></td><td>${esc(dateLabel(r.createdAt))}</td><td><div class="table-actions"><button class="small-btn" data-edit-report="${esc(r.id)}">Edit</button><button class="small-btn delete" data-delete-report="${esc(r.id)}">Delete</button></div></td></tr>`).join("");
  $("#report-result-count").textContent=`${rows.length} ${rows.length===1?"report":"reports"}`;
  $("#reports-empty").hidden=rows.length>0;
  $("#nav-report-count").textContent=data.reports.length;
}
function renderTasks(){
  const q=($("#task-search")?.value||"").toLowerCase(), sf=$("#task-filter")?.value||"All";
  const tasks=data.tasks.filter(t=>[t.title,t.description,t.owner,reportTitle(t.relatedReport)].join(" ").toLowerCase().includes(q)&&(sf==="All"||t.status===sf));
  $("#tasks-grid").innerHTML=tasks.map(t=>`<article class="task-card"><div class="card-top"><div class="card-symbol">✓</div>${badge(t.status)}</div><h3>${esc(t.title)}</h3><p>${esc(t.description||"No description provided.")}</p><div class="card-meta"><span>Owner: ${esc(t.owner||"Unassigned")}</span><span>Due: ${esc(dateLabel(t.dueDate))}</span></div><p>Related report: ${esc(reportTitle(t.relatedReport))}</p><div class="card-controls"><select data-task-status="${esc(t.id)}" aria-label="Task status">${taskStatuses.map(s=>`<option ${s===t.status?"selected":""}>${s}</option>`).join("")}</select><button data-delete-task="${esc(t.id)}">Delete</button></div></article>`).join("");
  $("#tasks-empty").hidden=tasks.length>0;
}
function renderContacts(){
  const q=($("#contact-search")?.value||"").toLowerCase(), role=$("#contact-role-filter")?.value||"All";
  const rows=data.contacts.filter(c=>[c.name,c.role,c.area,c.phone,c.notes].join(" ").toLowerCase().includes(q)&&(role==="All"||c.role===role));
  $("#contacts-grid").innerHTML=rows.map(c=>`<article class="contact-card"><div class="card-top"><div class="card-symbol">♙</div><span class="storage-badge">${esc(c.role)}</span></div><h3>${esc(c.name)}</h3><p>${esc(c.notes||"No additional notes.")}</p><div class="card-meta"><span>${esc(c.area||"Area not set")}</span><span>${esc(c.phone||"No phone saved")}</span></div><div class="card-controls"><button class="secondary-btn" data-edit-contact="${esc(c.id)}">Edit</button><button data-delete-contact="${esc(c.id)}">Delete</button></div></article>`).join("");
  $("#contacts-empty").hidden=rows.length>0;
}
function renderResources(){
  const q=($("#resource-search")?.value||"").toLowerCase(), cf=$("#resource-condition-filter")?.value||"All";
  const rows=data.resources.filter(r=>[r.name,r.location,r.category,r.notes].join(" ").toLowerCase().includes(q)&&(cf==="All"||r.condition===cf));
  $("#resources-grid").innerHTML=rows.map(r=>`<article class="resource-card"><div class="card-top"><div class="card-symbol">▣</div><span class="storage-badge">${esc(r.condition)}</span></div><h3>${esc(r.name)}</h3><p>${esc(r.notes||"No notes recorded.")}</p><div class="card-meta"><span>${esc(r.category)}</span><span>Qty: ${esc(r.quantity)}</span></div><div class="card-meta"><span>Location</span><strong>${esc(r.location||"Not specified")}</strong></div><div class="card-controls"><button class="secondary-btn" data-edit-resource="${esc(r.id)}">Edit</button><button data-delete-resource="${esc(r.id)}">Delete</button></div></article>`).join("");
  $("#resources-empty").hidden=rows.length>0;
}
function chartRows(entries,total){
  return entries.map(([label,count])=>`<div class="chart-line"><span>${esc(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${total?count/total*100:0}%"></div></div><strong>${count}</strong></div>`).join("");
}
function renderAnalytics(){
  const reports=data.reports;
  const statusCounts=reportStatuses.map(s=>[s,reports.filter(r=>r.status===s).length]);
  const catCounts=[...new Set([...categories,...reports.map(r=>r.category)])].map(c=>[c,reports.filter(r=>r.category===c).length]).filter(x=>x[1]>0);
  $("#analytics-status").innerHTML=`<div class="chart-list">${chartRows(statusCounts,reports.length)}</div>`;
  $("#analytics-category").innerHTML=catCounts.length?`<div class="chart-list">${chartRows(catCounts,reports.length)}</div>`:`<p class="tiny-note">Category statistics will appear after reports are added.</p>`;
  $("#summary-text").innerHTML=`<div class="summary-item"><strong>${reports.length}</strong><span>Total issue reports</span></div><div class="summary-item"><strong>${data.tasks.length}</strong><span>Action tasks</span></div><div class="summary-item"><strong>${data.contacts.length+data.resources.length}</strong><span>Contacts and resources</span></div>`;
}
function renderStorage(){
  const rows=[["Issue reports",data.reports.length],["Action tasks",data.tasks.length],["Community contacts",data.contacts.length],["Resources",data.resources.length],["Workspace settings","Saved locally"]];
  $("#storage-details").innerHTML=rows.map(([label,value])=>`<div class="storage-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
}
function fillSettings(){
  const f=$("#settings-form");f.elements.workspaceName.value=data.settings.workspaceName||"Gombe Community Helpdesk";f.elements.defaultArea.value=data.settings.defaultArea||"";f.elements.language.value=data.settings.language||"English";f.elements.darkMode.checked=!!data.settings.darkMode;
}
function applyTheme(dark){document.body.classList.toggle("dark",!!dark);}
const field=(name,label,type="text",opts={})=>({name,label,type,...opts});
const definitions={
 report:{title:"Add community issue report",button:"Save report",fields:[
  field("title","Issue title","text",{required:true,placeholder:"e.g. Broken streetlight",full:true}),
  field("category","Category","select",{required:true,options:categories}),
  field("area","Area / ward","text",{required:true,placeholder:"e.g. Pantami",value:()=>data.settings.defaultArea||""}),
  field("priority","Priority","select",{required:true,options:priorities,value:"Medium"}),
  field("status","Status","select",{required:true,options:reportStatuses,value:"Open"}),
  field("reporter","Reported by (optional)","text",{placeholder:"Community member",full:true}),
  field("description","Description","textarea",{required:true,placeholder:"Describe the issue and its location...",full:true})
 ]},
 task:{title:"Create action task",button:"Save task",fields:[
  field("title","Task title","text",{required:true,placeholder:"e.g. Follow up with service provider",full:true}),
  field("owner","Task owner","text",{placeholder:"Person or team"}),
  field("dueDate","Due date","date",{}),
  field("status","Status","select",{options:taskStatuses,value:"Not started"}),
  field("relatedReport","Related issue report","select",{options:[],value:"",full:true}),
  field("description","Task details","textarea",{placeholder:"What needs to happen next?",full:true})
 ]},
 contact:{title:"Add community contact",button:"Save contact",fields:[
  field("name","Full name or organization","text",{required:true,placeholder:"Contact name",full:true}),
  field("role","Role","select",{required:true,options:["Community volunteer","Ward representative","Service provider","Other"]}),
  field("area","Area / ward","text",{placeholder:"Area"}),
  field("phone","Phone (optional)","tel",{placeholder:"Phone number"}),
  field("notes","Notes","textarea",{placeholder:"Useful non-sensitive information",full:true})
 ]},
 resource:{title:"Add community resource",button:"Save resource",fields:[
  field("name","Resource name","text",{required:true,placeholder:"e.g. Community clean-up tools",full:true}),
  field("category","Resource type","select",{options:["Equipment","Tools","Supplies","Public facility","Other"]}),
  field("quantity","Quantity","number",{required:true,value:"1",min:"0"}),
  field("condition","Condition","select",{options:["Good","Needs repair","Unavailable"],value:"Good"}),
  field("location","Storage / location","text",{placeholder:"Where is it kept?",full:true}),
  field("notes","Notes","textarea",{placeholder:"Additional details",full:true})
 ]}
};
function openModal(type,editId=null){
  modalType=type;const def=definitions[type];if(!def)return;
  const existing=editId?data[{report:"reports",task:"tasks",contact:"contacts",resource:"resources"}[type]].find(x=>x.id===editId):null;
  $("#modal-title").textContent=existing?`Edit ${type}`:def.title;$("#modal-form").dataset.editId=editId||"";
  $("#modal-fields").innerHTML=def.fields.map(f=>{
    let value=existing?existing[f.name]:(typeof f.value==="function"?f.value():(f.value??""));
    if(f.name==="relatedReport"){
      f.options=data.reports.map(r=>({value:r.id,label:r.title}));
    }
    const cls=f.full?"full":"";
    let control="";
    if(f.type==="select"){
      const opts=(f.options||[]).map(o=>typeof o==="string"?{value:o,label:o}:o);
      control=`<select name="${f.name}" ${f.required?"required":""}>${f.name==="relatedReport"?'<option value="">No linked report</option>':""}${opts.map(o=>`<option value="${esc(o.value)}" ${String(value)===String(o.value)?"selected":""}>${esc(o.label)}</option>`).join("")}</select>`;
    }else if(f.type==="textarea"){
      control=`<textarea name="${f.name}" placeholder="${esc(f.placeholder||"")}" ${f.required?"required":""} maxlength="1500">${esc(value||"")}</textarea>`;
    }else{
      control=`<input name="${f.name}" type="${f.type}" value="${esc(value??"")}" placeholder="${esc(f.placeholder||"")}" ${f.required?"required":""} ${f.min!==undefined?`min="${f.min}"`:""} ${f.type==="number"?'step="1"':""} maxlength="${f.type==="number"||f.type==="date"?"" : "120"}">`;
    }
    return `<label class="${cls}">${f.label}${f.required?' <span style="color:#c04d42">*</span>':""}${control}</label>`;
  }).join("");
  $("#modal-backdrop").hidden=false;
  const first=$("#modal-fields input, #modal-fields select, #modal-fields textarea");if(first)first.focus();
}
function closeModal(){$("#modal-backdrop").hidden=true;$("#modal-form").reset();modalType=null;}
function collectForm(form){const obj={};new FormData(form).forEach((v,k)=>obj[k]=String(v).trim());return obj;}
function submitModal(event){
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const values=collectForm(form), editId=form.dataset.editId;
  const map={report:"reports",task:"tasks",contact:"contacts",resource:"resources"},collection=map[modalType];
  if(modalType==="report"&&!values.area)values.area=data.settings.defaultArea||"";
  if(modalType==="task"&&values.relatedReport==="")values.relatedReport="";
  if(modalType==="resource")values.quantity=Math.max(0,Number(values.quantity)||0);
  if(editId){
    const i=data[collection].findIndex(x=>x.id===editId);if(i>=0)data[collection][i]={...data[collection][i],...values,updatedAt:new Date().toISOString()};
  }else{
    data[collection].unshift({id:id(modalType),...values,createdAt:new Date().toISOString()});
  }
  if(saveData()){closeModal();refreshAll();showToast(editId?"Changes saved.":"Item added to this device.");}
}
function deleteItem(collection,itemId,label){
  const item=data[collection].find(x=>x.id===itemId);if(!item)return;
  if(!confirm(`Delete "${item.title||item.name}"? This cannot be undone unless you have a backup.`))return;
  data[collection]=data[collection].filter(x=>x.id!==itemId);saveData();refreshAll();showToast(`${label} deleted.`);
}
function csvEscape(value){const s=String(value??"");return `"${s.replace(/"/g,'""')}"`;}
function downloadBlob(content,type,filename){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportJSON(){const backup={app:"Gombe Community Helpdesk",schemaVersion:1,exportedAt:new Date().toISOString(),data};downloadBlob(JSON.stringify(backup,null,2),"application/json",`gombe-helpdesk-backup-${new Date().toISOString().slice(0,10)}.json`);showToast("Backup downloaded.");}
function exportCSV(){
  const headers=["Title","Category","Area","Priority","Status","Description","Reporter","Created At"];
  const lines=data.reports.map(r=>[r.title,r.category,r.area,r.priority,r.status,r.description,r.reporter,r.createdAt].map(csvEscape).join(","));
  downloadBlob([headers.map(csvEscape).join(","),...lines].join("\r\n"),"text/csv;charset=utf-8",`gombe-issue-reports-${new Date().toISOString().slice(0,10)}.csv`);showToast("CSV file downloaded.");
}
function refreshAll(){renderDashboard();renderReports();renderTasks();renderContacts();renderResources();renderAnalytics();renderStorage();}
function wireEvents(){
  $$(".nav-link").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  $$("[data-go]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.go)));
  $$("[data-modal]").forEach(b=>b.addEventListener("click",()=>openModal(b.dataset.modal)));
  $("#quick-add").addEventListener("click",()=>openModal("report"));
  $("#menu-toggle").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#modal-close").addEventListener("click",closeModal);$("#modal-cancel").addEventListener("click",closeModal);
  $("#modal-backdrop").addEventListener("click",e=>{if(e.target===$("#modal-backdrop"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal-backdrop").hidden)closeModal();});
  $("#modal-form").addEventListener("submit",submitModal);
  ["#report-search","#report-status-filter","#report-category-filter"].forEach(s=>$(s).addEventListener(s.includes("search")?"input":"change",renderReports));
  $("#clear-report-filters").addEventListener("click",()=>{$("#report-search").value="";$("#report-status-filter").value="All";$("#report-category-filter").value="All";renderReports();});
  ["#task-search","#task-filter"].forEach(s=>$(s).addEventListener(s.includes("search")?"input":"change",renderTasks));
  ["#contact-search","#contact-role-filter"].forEach(s=>$(s).addEventListener(s.includes("search")?"input":"change",renderContacts));
  ["#resource-search","#resource-condition-filter"].forEach(s=>$(s).addEventListener(s.includes("search")?"input":"change",renderResources));
  document.body.addEventListener("change",e=>{
    const t=e.target;
    if(t.matches("[data-report-status]")){const r=data.reports.find(x=>x.id===t.dataset.reportStatus);if(r){r.status=t.value;saveData();refreshAll();showToast("Report status updated.");}}
    if(t.matches("[data-task-status]")){const task=data.tasks.find(x=>x.id===t.dataset.taskStatus);if(task){task.status=t.value;saveData();refreshAll();showToast("Task status updated.");}}
  });
  document.body.addEventListener("click",e=>{
    const b=e.target.closest("button");if(!b)return;
    if(b.dataset.editReport)openModal("report",b.dataset.editReport);
    if(b.dataset.deleteReport)deleteItem("reports",b.dataset.deleteReport,"Report");
    if(b.dataset.deleteTask)deleteItem("tasks",b.dataset.deleteTask,"Task");
    if(b.dataset.editContact)openModal("contact",b.dataset.editContact);
    if(b.dataset.deleteContact)deleteItem("contacts",b.dataset.deleteContact,"Contact");
    if(b.dataset.editResource)openModal("resource",b.dataset.editResource);
    if(b.dataset.deleteResource)deleteItem("resources",b.dataset.deleteResource,"Resource");
  });
  $("#export-json").addEventListener("click",exportJSON);$("#export-csv").addEventListener("click",exportCSV);$("#export-csv-backup").addEventListener("click",exportCSV);
  $("#import-json").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());const imported=parsed.data||parsed;
      if(!imported||!Array.isArray(imported.reports)||!Array.isArray(imported.tasks)||!Array.isArray(imported.contacts)||!Array.isArray(imported.resources))throw new Error("This file does not look like a Helpdesk backup.");
      if(!confirm("Replace the current local workspace with data from this backup? Export your current data first if you need to keep it.")){e.target.value="";return;}
      data={...emptyData(),...imported,settings:{...emptyData().settings,...(imported.settings||{})}};
      if(saveData()){refreshAll();applyTheme(data.settings.darkMode);showToast("Backup restored successfully.");}
    }catch(err){alert(`Could not restore backup: ${err.message}`);}
    e.target.value="";
  });
  $("#clear-all-data").addEventListener("click",()=>{
    if(!confirm("Permanently clear all reports, tasks, contacts, resources, and settings stored for this app in this browser? Export a backup first if needed."))return;
    data=emptyData();saveData();refreshAll();fillSettings();applyTheme(false);showToast("Local workspace cleared.");
  });
  $("#settings-form").addEventListener("submit",e=>{e.preventDefault();const f=e.currentTarget;data.settings={workspaceName:f.elements.workspaceName.value.trim()||"Gombe Community Helpdesk",defaultArea:f.elements.defaultArea.value.trim(),language:f.elements.language.value,darkMode:f.elements.darkMode.checked};saveData();applyTheme(data.settings.darkMode);showToast("Settings saved on this device.");});
  $("#settings-form").elements.darkMode.addEventListener("change",e=>applyTheme(e.target.checked));
}
function getUsers(){try{return JSON.parse(localStorage.getItem(USERS_KEY)||"[]");}catch{return [];}}
function setAuthMessage(message){const el=$("#auth-message");el.textContent=message;el.hidden=!message;}
function showAuthTab(tab){
  $$("[data-auth-tab]").forEach(b=>b.classList.toggle("active",b.dataset.authTab===tab));
  $("#login-form").hidden=tab!=="login";$("#register-form").hidden=tab!=="register";setAuthMessage("");
}
function enterWorkspace(user){sessionStorage.setItem(SESSION_KEY,JSON.stringify({name:user.name,email:user.email}));$("#auth-screen").hidden=true;$("#app-shell").hidden=false;const name=user.name||"Workspace user";const side=$(".sidebar-bottom");side.querySelector("strong").textContent=name;side.querySelector("small").textContent=user.email||"Local account";side.querySelector(".avatar").textContent=name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();}
function leaveWorkspace(){sessionStorage.removeItem(SESSION_KEY);$("#app-shell").hidden=true;$("#auth-screen").hidden=false;$("#login-form").reset();showAuthTab("login");}
function setupAuth(){
  $$ ("[data-auth-tab]").forEach(b=>b.addEventListener("click",()=>showAuthTab(b.dataset.authTab)));
  $("#register-form").addEventListener("submit",e=>{e.preventDefault();const f=e.currentTarget;const name=f.elements.name.value.trim();const email=f.elements.email.value.trim().toLowerCase();const password=f.elements.password.value;const confirm=f.elements.confirm.value;const users=getUsers();if(password!==confirm){setAuthMessage("Your passwords do not match.");return;}if(users.some(u=>u.email===email)){setAuthMessage("An account with this email already exists. Please sign in.");return;}const user={name,email,password,createdAt:new Date().toISOString()};users.push(user);localStorage.setItem(USERS_KEY,JSON.stringify(users));f.reset();enterWorkspace(user);showToast("Account created. Welcome!");});
  $("#login-form").addEventListener("submit",e=>{e.preventDefault();const f=e.currentTarget;const email=f.elements.email.value.trim().toLowerCase();const password=f.elements.password.value;const user=getUsers().find(u=>u.email===email&&u.password===password);if(!user){setAuthMessage("Email or password is incorrect. If this is your first time, create an account.");return;}enterWorkspace(user);showToast("Signed in successfully.");});
  $("#logout-btn").addEventListener("click",leaveWorkspace);
  try{const session=JSON.parse(sessionStorage.getItem(SESSION_KEY)||"null");const user=session&&getUsers().find(u=>u.email===session.email);if(user)enterWorkspace(user);else leaveWorkspace();}catch{leaveWorkspace();}
}
function init(){
  setupAuth();
  const now=new Date();$("#today-label").textContent=new Intl.DateTimeFormat("en-NG",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(now);$("#date-chip").textContent=dateLabel(now.toISOString());
  applyTheme(data.settings.darkMode);wireEvents();refreshAll();
  if("serviceWorker" in navigator && location.protocol!=="file:"){navigator.serviceWorker.register("./sw.js").catch(err=>console.info("Offline caching unavailable in this context",err));}
}
init();
