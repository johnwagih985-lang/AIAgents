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

// 1. إعدادات مشروعك في Firebase
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

window.cloudUsers = [];

// 2. إضافة مستخدم جديد إلى السحابة
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
    if (typeof showToast === "function") showToast("الرجاء إدخال اسم المستخدم وكلمة المرور!", "error");
    else alert("يرجى إدخال اسم المستخدم وكلمة المرور");
    return;
  }

  if (window.cloudUsers.some(u => u.username === username)) {
    if (typeof showToast === "function") showToast("اسم المستخدم موجود مسبقاً!", "error");
    else alert("اسم المستخدم موجود بالفعل!");
    return;
  }

  try {
    await addDoc(usersCollection, {
      username: username,
      password: password,
      agents: agents,
      createdAt: serverTimestamp()
    });

    usernameInput.value = "";
    passwordInput.value = "";
    if (typeof showToast === "function") showToast("تم إضافة المستخدم بنجاح!", "success");
  } catch (error) {
    console.error("خطأ في الحفظ:", error);
    alert("حدث خطأ أثناء الحفظ: " + error.message);
  }
};

// 3. حذف مستخدم من السحابة
window.deleteCloudUser = async function(docId) {
  if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
    try {
      await deleteDoc(doc(db, "users", docId));
      if (typeof showToast === "function") showToast("تم حذف المستخدم بنجاح!", "success");
    } catch (error) {
      console.error("خطأ في الحذف:", error);
    }
  }
};

// 4. جلب المستخدمين وعرضهم لحظياً في لوحة الإدارة
const q = query(usersCollection, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  const usersContainer = document.getElementById("users-container");
  window.cloudUsers = [];
  
  if (!usersContainer) return;
  usersContainer.innerHTML = "";

  if (snapshot.empty) {
    usersContainer.innerHTML = '<p class="no-users">لا يوجد مستخدمون مسجلون</p>';
    return;
  }

  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const id = docSnap.id;
    window.cloudUsers.push({ id, ...user });

    const agentsList = [];
    if (user.agents?.problem) agentsList.push('وكيل حل المشكلات');
    if (user.agents?.code) agentsList.push('الوكيل البرمجي');
    if (user.agents?.assistant) agentsList.push('مساعد الذكاء الاصطناعي');

    const userCard = document.createElement("div");
    userCard.className = "user-card";
    userCard.innerHTML = `
      <div class="user-info">
        <h4>${user.username}</h4>
        <p class="user-agents">
          <i class="fas fa-robot"></i>
          ${agentsList.length > 0 ? agentsList.join(' | ') : 'لا يوجد وكلاء مفعلون'}
        </p>
      </div>
      <div class="user-actions">
        <button class="btn-delete" onclick="deleteCloudUser('${id}')">
          <i class="fas fa-trash"></i> حذف
        </button>
      </div>
    `;
    usersContainer.appendChild(userCard);
  });
});

// 5. تسجيل الدخول المتوافق كلياً مع script.js و content.html
const originalDoLogin = window.doLogin;
window.doLogin = function() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  // البحث أولاً في مستخدمي Firebase السحابيين
  const foundUser = window.cloudUsers.find(u => u.username === username && u.password === password);
  
  if (foundUser) {
    const userObj = {
      id: foundUser.id,
      username: foundUser.username,
      isAdmin: false,
      agents: foundUser.agents || { problem: true, code: true, assistant: true }
    };

    // التخزين في localStorage بالمفاتيح الدقيقة التي يقرأها script.js في كل الصفحات
    localStorage.setItem("pythonPlatformLoggedIn", "true");
    localStorage.setItem("pythonPlatformCurrentUser", JSON.stringify(userObj));

    if (typeof showToast === "function") {
      showToast(`مرحباً ${userObj.username}! تم تسجيل الدخول بنجاح.`, "success");
    }
    if (typeof hideLoginModal === "function") {
      hideLoginModal();
    }
    return;
  }

  // إذا كان المدير (admin)، ننفذ دالة script.js الأصلية مع تثبيت الجلسة في localStorage
  if (typeof originalDoLogin === "function") {
    originalDoLogin();
    if (sessionStorage.getItem("pythonPlatformLoggedIn") === "true") {
      localStorage.setItem("pythonPlatformLoggedIn", "true");
      localStorage.setItem("pythonPlatformCurrentUser", sessionStorage.getItem("pythonPlatformCurrentUser"));
    }
  }
};
