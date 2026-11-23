import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc,
  doc,
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// إعدادات مشروعك في Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAPNykm9QYcsvBABw1jeXcvL4btAA0oXBc",
  authDomain: "phdai-480fa.firebaseapp.com",
  projectId: "phdai-480fa",
  storageBucket: "phdai-480fa.firebasestorage.app",
  messagingSenderId: "629988212333",
  appId: "1:629988212333:web:41f63034a717aa4d920964"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersCollection = collection(db, "users");

// مصفوفة لتخزين المستخدمين المجلوبين من السحابة لاستخدامهم في تسجيل الدخول والبحث
window.cloudUsers = [];

// 1. دالة إضافة مستخدم جديد (تستبدل الدالة القديمة في script.js)
window.addUser = async function() {
  const usernameInput = document.getElementById("new-username");
  const passwordInput = document.getElementById("new-password");
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  const agents = {
    problem: document.getElementById("agent-problem").checked,
    code: document.getElementById("agent-code").checked,
    assistant: document.getElementById("agent-assistant").checked
  };

  if (!username || !password) {
    alert("يرجى إدخال اسم المستخدم وكلمة المرور");
    return;
  }

  // التأكد من عدم تكرار اسم المستخدم
  if (window.cloudUsers.some(u => u.username === username)) {
    alert("اسم المستخدم موجود بالفعل!");
    return;
  }

  try {
    await addDoc(usersCollection, {
      username: username,
      password: password,
      agents: agents,
      createdAt: serverTimestamp()
    });

    // تفريغ الحقول بعد الإضافة
    usernameInput.value = "";
    passwordInput.value = "";
    alert("تمت إضافة المستخدم بنجاح إلى قاعدة البيانات السحابية!");
  } catch (error) {
    console.error("خطأ في الحفظ:", error);
    alert("حدث خطأ أثناء الحفظ: " + error.message);
  }
};

// 2. دالة حذف مستخدم من السحابة
window.deleteCloudUser = async function(docId) {
  if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
    try {
      await deleteDoc(doc(db, "users", docId));
    } catch (error) {
      console.error("خطأ في الحذف:", error);
    }
  }
};

// 3. جلب المستخدمين وعرضهم لحظياً في لوحة الإدارة
const q = query(usersCollection, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const usersContainer = document.getElementById("users-container");
  window.cloudUsers = [];
  
  if (!usersContainer) return;
  usersContainer.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const id = docSnap.id;
    window.cloudUsers.push({ id, ...user });

    const userCard = document.createElement("div");
    userCard.className = "user-item";
    userCard.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee;";
    
    userCard.innerHTML = `
      <div>
        <strong><i class="fas fa-user"></i> ${user.username}</strong>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">
          الصلاحيات: 
          ${user.agents?.problem ? "✅ حل المشكلات " : ""}
          ${user.agents?.code ? "✅ البرمجي " : ""}
          ${user.agents?.assistant ? "✅ المساعد الذكي" : ""}
        </div>
      </div>
      <button class="btn btn-danger" onclick="deleteCloudUser('${id}')" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer;">
        <i class="fas fa-trash"></i> حذف
      </button>
    `;
    usersContainer.appendChild(userCard);
  });
});

// دالة تطبيق صلاحيات الوكلاء على الصفحة الرئيسية
function applyUserPermissions(user) {
  if (!user || !user.agents) return;

  // 1. بطاقة وكيل حل المشكلات
  const problemCard = document.querySelector(".ai-problem-card");
  if (problemCard) {
    problemCard.style.display = user.agents.problem ? "" : "none";
  }

  // 2. بطاقة الوكيل البرمجي
  const codeCard = document.getElementById("agent-code-card");
  if (codeCard) {
    codeCard.style.display = user.agents.code ? "" : "none";
  }

  // 3. بطاقة مساعد الذكاء الاصطناعي
  const assistantCard = document.getElementById("agent-assistant-card");
  if (assistantCard) {
    assistantCard.style.display = user.agents.assistant ? "" : "none";
  }
}

// 4. تحديث دالة تسجيل الدخول لتقرأ من السحابة وتطبق الصلاحيات
const originalDoLogin = window.doLogin;
window.doLogin = function() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  // التحقق من المستخدمين في Firebase
  const foundUser = window.cloudUsers.find(u => u.username === username && u.password === password);
  
  if (foundUser) {
    document.getElementById("login-modal").classList.remove("active");
    const welcomeEl = document.getElementById("user-welcome");
    const loggedNameEl = document.getElementById("logged-username");
    if (welcomeEl && loggedNameEl) {
      loggedNameEl.textContent = foundUser.username;
      welcomeEl.style.display = "inline-flex";
    }
    
    // حفظ الجلسة وتطبيق إخفاء/إظهار الوكلاء
    localStorage.setItem("currentUser", JSON.stringify(foundUser));
    applyUserPermissions(foundUser);
    return;
  }

  // إذا كان المدير (admin) الافتراضي، تأكد من إظهار جميع الوكلاء له
  if (typeof originalDoLogin === "function") {
    originalDoLogin();
    applyUserPermissions({ agents: { problem: true, code: true, assistant: true } });
  }
};

// 5. إعادة تطبيق الصلاحيات تلقائياً إذا قام المستخدم بعمل تحديث (Refresh) للصفحة
window.addEventListener("DOMContentLoaded", () => {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
      applyUserPermissions(parsedUser);
    } catch (e) {
      console.error(e);
    }
  }
});
