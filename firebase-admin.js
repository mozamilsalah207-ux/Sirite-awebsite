import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,getDocs,query,orderBy,updateDoc,setDoc,serverTimestamp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
let requestDocs=[];
$('adminLogout')?.addEventListener('click',async()=>{await signOut(auth);location.href='index.html';});
onAuthStateChanged(auth,async user=>{
 if(!user){$('adminMessage').textContent='يجب تسجيل الدخول أولاً من الصفحة الرئيسية.';return;}
 try{
  const u=await getDoc(doc(db,'users',user.uid));
  if(!u.exists()||u.data().role!=='admin'){$('adminMessage').textContent='ليس لديك صلاحية الوصول إلى لوحة الإدارة.';return;}
  $('adminMessage').hidden=true;$('adminContent').hidden=false;
  await refresh();
 }catch(e){$('adminMessage').textContent='تعذر تحميل لوحة الإدارة. تحقق من قواعد Firestore والاتصال. '+e.message;}
});
async function refresh(){
 const [reqs,users,resumes]=await Promise.all([
  getDocs(query(collection(db,'subscriptionRequests'),orderBy('createdAt','desc'))),
  getDocs(collection(db,'users')),getDocs(collection(db,'resumes'))
 ]);
 requestDocs=reqs.docs;
 $('requestCount').textContent=reqs.size;$('userCount').textContent=users.size;$('resumeCount').textContent=resumes.size;
 $('requestsArea').innerHTML=!reqs.size?'لا توجد طلبات اشتراك حالياً.':
 '<div class="table-wrap"><table class="admin-table"><thead><tr><th>البريد</th><th>الخطة</th><th>الحالة</th><th>التاريخ</th><th>الإجراء</th></tr></thead><tbody>'+
 reqs.docs.map(d=>{const x=d.data();return `<tr><td>${esc(x.email||'')}</td><td>${esc(x.plan||'')}</td><td>${statusLabel(x.status)}</td><td>${dateLabel(x.createdAt)}</td><td>${x.status==='pending'?`<button data-id="${d.id}" data-status="approved">موافقة وتفعيل</button> <button data-id="${d.id}" data-status="rejected">رفض</button>`:'—'}</td></tr>`}).join('')+'</tbody></table></div>';
 document.querySelectorAll('#requestsArea button[data-id]').forEach(b=>b.addEventListener('click',()=>decide(b)));
}
async function decide(button){
 const id=button.dataset.id,status=button.dataset.status,req=requestDocs.find(d=>d.id===id)?.data();
 if(!req)return;
 button.disabled=true;
 try{
  await updateDoc(doc(db,'subscriptionRequests',id),{status,reviewedAt:serverTimestamp(),reviewedBy:auth.currentUser.uid});
  if(status==='approved'){
   const plan=['pro','business'].includes(req.plan)?req.plan:'free';
   await updateDoc(doc(db,'users',req.uid),{plan,planActivatedAt:serverTimestamp()});
  }
  await refresh();
 }catch(e){alert('تعذر تنفيذ الإجراء: '+e.message);button.disabled=false;}
}
function statusLabel(s){return s==='approved'?'مقبول':s==='rejected'?'مرفوض':'قيد المراجعة';}
function dateLabel(t){try{return t?.toDate?t.toDate().toLocaleDateString('ar'): '—';}catch{return '—';}}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
