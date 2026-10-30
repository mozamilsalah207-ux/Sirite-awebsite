const form=document.getElementById('cvForm');
const fields=['name','job','email','phone','location','linkedin','website','summary','skills','languages','certificates','projects','volunteer'];
const tabs=[...document.querySelectorAll('.step')],panels=[...document.querySelectorAll('.tab-panel')];
let current=0,experience=[],education=[],photoData='';
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const val=k=>form.elements[k]?.value.trim()||'';
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2400);}
function go(i){current=Math.max(0,Math.min(i,tabs.length-1));tabs.forEach((t,n)=>t.classList.toggle('active',n===current));panels.forEach((p,n)=>p.classList.toggle('active',n===current));}
tabs.forEach((t,i)=>t.addEventListener('click',()=>go(i)));
document.querySelectorAll('.next').forEach(b=>b.addEventListener('click',()=>go(current+1)));
document.querySelectorAll('.prev').forEach(b=>b.addEventListener('click',()=>go(current-1)));
function card(type,item={},i=0){
 const exp=type==='experience';
 const defs=exp?[['role','المسمى الوظيفي','مثال: مسؤول مبيعات'],['company','اسم الشركة','اسم جهة العمل'],['period','الفترة','2021 — 2024'],['description','المهام والإنجازات','اكتب مسؤولياتك وأهم النتائج']]:[['degree','المؤهل أو التخصص','بكالوريوس محاسبة'],['school','المؤسسة التعليمية','اسم الجامعة أو المعهد'],['period','الفترة','2019 — 2023'],['description','تفاصيل إضافية','التقدير أو مواد ذات صلة (اختياري)']];
 return `<div class="entry-card" data-type="${type}" data-index="${i}"><div class="entry-title"><span>${exp?'خبرة':'مؤهل'} رقم ${i+1}</span><button type="button" class="remove-entry">حذف</button></div><div class="entry-grid">${defs.map(([k,l,p])=>`<label class="field ${k==='description'?'wide':''}">${l}${k==='description'?`<textarea data-key="${k}" rows="2" placeholder="${p}">${safe(item[k]||'')}</textarea>`:`<input data-key="${k}" placeholder="${p}" value="${safe(item[k]||'')}">`}</label>`).join('')}</div></div>`;
}
function renderLists(){
 $('experienceList').innerHTML=experience.map((x,i)=>card('experience',x,i)).join('');
 $('educationList').innerHTML=education.map((x,i)=>card('education',x,i)).join('');
 document.querySelectorAll('.entry-card input,.entry-card textarea').forEach(el=>el.addEventListener('input',()=>{const c=el.closest('.entry-card'),arr=c.dataset.type==='experience'?experience:education;arr[+c.dataset.index][el.dataset.key]=el.value;renderPreview();save();}));
 document.querySelectorAll('.remove-entry').forEach(b=>b.addEventListener('click',()=>{const c=b.closest('.entry-card'),arr=c.dataset.type==='experience'?experience:education;arr.splice(+c.dataset.index,1);renderLists();renderPreview();save();}));
}
$('addExperience').addEventListener('click',()=>{experience.push({});renderLists();save();});
$('addEducation').addEventListener('click',()=>{education.push({});renderLists();save();});
function renderEntries(items,target,type){
 const el=$(target);if(!items.length){el.className='empty-state';el.textContent=type==='experience'?'ستظهر خبراتك هنا.':'ستظهر مؤهلاتك هنا.';return;}
 el.className='';el.innerHTML=items.map(x=>{const title=x.role||x.degree||'',sub=x.company||x.school||'';return `<div class="resume-entry"><div class="resume-entry-head"><span>${safe(title)}</span><small>${safe(x.period||'')}</small></div><small>${safe(sub)}</small>${x.description?`<p>${safe(x.description)}</p>`:''}</div>`}).join('');
}
function renderPreview(){
 $('pName').textContent=val('name')||'اسمك الكامل';$('pJob').textContent=val('job')||'المسمى الوظيفي';
 const contacts=[val('email'),val('phone'),val('location'),val('linkedin'),val('website')].filter(Boolean);
 $('pContact').textContent=contacts.join('　•　')||'البريد الإلكتروني　•　رقم الهاتف　•　المدينة';
 $('pSummary').textContent=val('summary')||'أضف نبذة مهنية قصيرة لتظهر هنا.';
 renderEntries(experience,'pExperience','experience');renderEntries(education,'pEducation','education');
 const skills=val('skills').split(/[,،\n]/).map(x=>x.trim()).filter(Boolean);
 $('pSkills').innerHTML=skills.length?skills.map(x=>`<span>${safe(x)}</span>`).join(''):'<span>مهاراتك</span>';
 [['languages','pLanguages','languagesSection'],['certificates','pCertificates','certificatesSection'],['projects','pProjects','projectsSection'],['volunteer','pVolunteer','volunteerSection']].forEach(([f,id,section])=>{$(id).textContent=val(f);$(section).style.display=val(f)?'':'none';});
 $('summarySection').style.display=val('summary')?'':'none';$('experienceSection').style.display=experience.length?'':'none';$('educationSection').style.display=education.length?'':'none';$('skillsSection').style.display=skills.length?'':'none';
 const score=['name','job','email','phone','summary','skills'].filter(k=>val(k)).length+(experience.length?1:0)+(education.length?1:0);
 const pct=Math.round(score/8*100);$('progressText').textContent=pct+'%';$('progressBar').style.width=pct+'%';
 if(photoData){$('pPhoto').src=photoData;$('pPhoto').hidden=false;}else{$('pPhoto').hidden=true;}
}
function save(){
 const d={};fields.forEach(k=>d[k]=val(k));d.experience=experience;d.education=education;d.photo=photoData;
 try{localStorage.setItem('sirti-pro-cv',JSON.stringify(d));$('saveStatus').textContent='تم حفظ التعديلات على جهازك';}catch(e){$('saveStatus').textContent='مساحة التخزين غير كافية لحفظ الصورة';}
}
function load(){
 try{const d=JSON.parse(localStorage.getItem('sirti-pro-cv')||'null');if(!d)return;fields.forEach(k=>{if(form.elements[k])form.elements[k].value=d[k]||''});experience=d.experience||[];education=d.education||[];photoData=d.photo||'';if(photoData){$('photoPreview').style.backgroundImage=`url("${photoData}")`;$('photoPreview').textContent='';}}catch(e){}
}
form.addEventListener('input',()=>{renderPreview();save();});
$('photoInput').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;if(file.size>2*1024*1024){toast('حجم الصورة يجب ألا يتجاوز 2 ميجابايت');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>{photoData=reader.result;$('photoPreview').style.backgroundImage=`url("${photoData}")`;$('photoPreview').textContent='';renderPreview();save();};reader.readAsDataURL(file);});
$('removePhoto').addEventListener('click',()=>{photoData='';$('photoInput').value='';$('photoPreview').style.backgroundImage='';$('photoPreview').textContent='+';renderPreview();save();});
function chooseTemplate(t){$('templateSelect').value=t;localStorage.setItem('sirti-template',t);const p=$('resumePreview');p.classList.remove('template-modern','template-minimal');if(t!=='classic')p.classList.add('template-'+t);document.querySelectorAll('.template-card').forEach(c=>c.classList.toggle('selected',c.dataset.template===t));}
$('templateSelect').addEventListener('change',e=>chooseTemplate(e.target.value));
document.querySelectorAll('.template-card').forEach(c=>c.addEventListener('click',()=>{chooseTemplate(c.dataset.template);document.getElementById('builder').scrollIntoView({behavior:'smooth'});}));
$('printBtn').addEventListener('click',()=>{renderPreview();window.print();});
$('reviewBtn').addEventListener('click',()=>{go(0);document.getElementById('builder').scrollIntoView({behavior:'smooth'});toast('سيرتك جاهزة للمراجعة والطباعة');});
function reset(){if(!confirm('هل تريد مسح جميع بيانات السيرة والبدء من جديد؟'))return;form.reset();experience=[];education=[];photoData='';localStorage.removeItem('sirti-pro-cv');$('photoPreview').style.backgroundImage='';$('photoPreview').textContent='+';renderLists();renderPreview();go(0);toast('تم إنشاء سيرة جديدة');}
$('resetForm').addEventListener('click',reset);$('clearAll').addEventListener('click',reset);
$('mobileMenu').addEventListener('click',()=>document.querySelector('.main-nav').classList.toggle('open'));
document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.main-nav').classList.remove('open')));
window.addEventListener('sirti:load-cv',e=>{
 const d=e.detail||{};experience=Array.isArray(d.experience)?d.experience:[];education=Array.isArray(d.education)?d.education:[];
 photoData=d.photo||'';
 if(photoData){$('photoPreview').style.backgroundImage=`url("${photoData}")`;$('photoPreview').textContent='+';}else{$('photoPreview').style.backgroundImage='';$('photoPreview').textContent='+';}
 renderLists();renderPreview();
});
load();renderLists();renderPreview();chooseTemplate(localStorage.getItem('sirti-template')||'classic');
