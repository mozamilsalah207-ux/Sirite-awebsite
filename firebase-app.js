// Firebase Authentication + Cloud Firestore integration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=id=>document.getElementById(id);
let mode='login',userNow=null;
const modal=$('accountModal');
function notify(msg){const t=$('toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>t.classList.remove('show'),2800);}
function openModal(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');}
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
$('accountBtn')?.addEventListener('click',openModal);$('closeAccount')?.addEventListener('click',closeModal);
modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
document.querySelectorAll('.auth-tab').forEach(b=>b.addEventListener('click',()=>{
 mode=b.dataset.auth;
 document.querySelectorAll('.auth-tab').forEach(x=>x.classList.toggle('active',x===b));
 $('authSubmit').textContent=mode==='login'?'دخول':'إنشاء الحساب';
 $('accountStatus').textContent=mode==='login'?'أدخل بيانات حسابك.':'أنشئ حساباً باستخدام بريد إلكتروني وكلمة مرور لا تقل عن 6 أحرف.';
}));
$('authForm')?.addEventListener('submit',async e=>{
 e.preventDefault();const email=$('authEmail').value.trim(),password=$('authPassword').value;
 $('authSubmit').disabled=true;$('accountStatus').textContent='جارٍ تنفيذ الطلب...';
 try{
  if(mode==='signup'){
   const cred=await createUserWithEmailAndPassword(auth,email,password);
   await setDoc(doc(db,'users',cred.user.uid),{email,role:'user',plan:'free',createdAt:serverTimestamp()});
   notify('تم إنشاء حسابك بنجاح');
  }else{await signInWithEmailAndPassword(auth,email,password);notify('تم تسجيل الدخول');}
 }catch(err){$('accountStatus').textContent=authError(err.code);}
 finally{$('authSubmit').disabled=false;}
});
$('forgotPassword')?.addEventListener('click',async()=>{
 const email=$('authEmail').value.trim();
 if(!email){$('accountStatus').textContent='اكتب بريدك الإلكتروني أولاً ثم اضغط نسيت كلمة المرور.';return;}
 try{await sendPasswordResetEmail(auth,email);$('accountStatus').textContent='أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.';}
 catch(e){$('accountStatus').textContent=authError(e.code);}
});
function authError(code){const m={'auth/email-already-in-use':'هذا البريد مسجل مسبقاً.','auth/invalid-email':'صيغة البريد الإلكتروني غير صحيحة.','auth/weak-password':'كلمة المرور ضعيفة؛ استخدم 6 أحرف على الأقل.','auth/invalid-credential':'البريد أو كلمة المرور غير صحيحة.','auth/network-request-failed':'تعذر الاتصال. تحقق من الإنترنت.','auth/too-many-requests':'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.'};return m[code]||'حدث خطأ أثناء العملية: '+code;}
function currentCV(){try{return JSON.parse(localStorage.getItem('sirti-pro-cv')||'{}');}catch{return {};}}
function applyCV(data){
 if(!data)return;
 const form=document.getElementById('cvForm');
 Object.keys(data).forEach(k=>{if(form.elements[k]&&typeof data[k]==='string')form.elements[k].value=data[k];});
 localStorage.setItem('sirti-pro-cv',JSON.stringify(data));
 // Reinitialize dynamic sections and preview without a reload.
 window.dispatchEvent(new CustomEvent('sirti:load-cv',{detail:data}));
}
onAuthStateChanged(auth,async user=>{
 userNow=user;$('authForm').hidden=!!user;$('loggedIn').hidden=!user;
 if(!user){$('accountStatus').textContent='يمكنك استخدام المنشئ دون حساب. الحساب مطلوب للحفظ السحابي.';$('accountBtn').textContent='دخول / حسابي';$('adminLink').hidden=true;return;}
 $('userEmail').textContent=user.email;$('accountBtn').textContent='حسابي';
 try{const snap=await getDoc(doc(db,'users',user.uid));$('adminLink').hidden=!(snap.exists()&&snap.data().role==='admin');}
 catch(e){$('accountStatus').textContent='تم تسجيل الدخول، لكن تعذرت قراءة بيانات الحساب.';}
});
$('cloudSave')?.addEventListener('click',async()=>{
 if(!userNow){notify('سجّل الدخول أولاً.');return;}
 try{await setDoc(doc(db,'resumes',userNow.uid),{ownerUid:userNow.uid,email:userNow.email,data:currentCV(),updatedAt:serverTimestamp()});notify('تم حفظ سيرتك في حسابك سحابياً.');}
 catch(e){notify('تعذر الحفظ. تحقق من إعدادات Firebase وقواعد Firestore.');}
});
$('cloudLoad')?.addEventListener('click',async()=>{
 if(!userNow){notify('سجّل الدخول أولاً.');return;}
 try{const snap=await getDoc(doc(db,'resumes',userNow.uid));if(!snap.exists()){notify('لا توجد سيرة محفوظة لهذا الحساب.');return;}applyCV(snap.data().data);notify('تم استرجاع سيرتك بنجاح.');}
 catch(e){notify('تعذر استرجاع السيرة. تحقق من إعدادات Firebase.');}
});
$('logoutBtn')?.addEventListener('click',async()=>{await signOut(auth);notify('تم تسجيل الخروج');closeModal();});
document.querySelectorAll('.plan-button').forEach(btn=>btn.addEventListener('click',async()=>{
 const plan=btn.dataset.plan;if(plan==='free'){notify('أنت تستخدم الخطة المجانية.');return;}
 if(!userNow){openModal();notify('سجّل الدخول أولاً لطلب الاشتراك.');return;}
 try{await addDoc(collection(db,'subscriptionRequests'),{uid:userNow.uid,email:userNow.email,plan,status:'pending',createdAt:serverTimestamp()});notify('تم إرسال طلب الاشتراك. ستراجعه الإدارة.');}
 catch(e){notify('تعذر إرسال الطلب. تحقق من إعدادات Firebase.');}
}));
