// 1. استيراد دوال Firebase من السحابة مباشرة
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. إعدادات مشروعك (استبدلها ببياناتك من Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAPNykm9QYcsvBABw1jeXcvL4btAA0oXBc",
  authDomain: "phdai-480fa.firebaseapp.com",
  projectId: "phdai-480fa",
  storageBucket: "phdai-480fa.firebasestorage.app",
  messagingSenderId: "629988212333",
  appId: "1:629988212333:web:41f63034a717aa4d920964"
  measurementId: "G-H9Z1HRZH0Q"
};

// 3. تهيئة الاتصال بقاعدة البيانات
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersCollection = collection(db, "users"); // اسم الجدول (Collection) هو users

// عناصر الصفحة
const userForm = document.getElementById("userForm");
const usersList = document.getElementById("usersList");

// 4. إضافة مستخدم جديد عند إرسال النموذج
userForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // منع إعادة تحميل الصفحة

  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();

  try {
    // إرسال البيانات إلى Firestore
    await addDoc(usersCollection, {
      name: name,
      email: email,
      createdAt: serverTimestamp() // حفظ وقت الإضافة للترتيب
    });

    userForm.reset(); // تفريغ الحقول بعد النجاح
  } catch (error) {
    console.error("حدث خطأ أثناء الإضافة:", error);
    alert("تعذر إضافة المستخدم، راجع وحدة التحكم (Console).");
  }
});

// 5. جلب المستخدمين وعرضهم لحظياً (Real-time) في أي متصفح
const q = query(usersCollection, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  usersList.innerHTML = ""; // مسح القائمة القديمة قبل إعادة الرسم

  snapshot.forEach((doc) => {
    const user = doc.data();
    const li = document.createElement("li");
    li.textContent = `${user.name} - (${user.email})`;
    usersList.appendChild(li);
  });
});
