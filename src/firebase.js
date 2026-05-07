// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";

import { showToast, showList, renderDetail } from "./main";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const studentsCollection = collection(db, "students");

export async function getFiles() {
  try {
    const snapshot = await getDocs(studentsCollection);

    const data = snapshot.docs.map((docItem) => ({
      firebaseId: docItem.id,
      ...docItem.data(),
    }));
    console.log(data);

    return data;
  } catch (error) {
    console.error("Get students error:", error);
    showToast("Gagal mengambil data", "error");
    return [];
  }
}

export async function putFile(studentId, updatedStudent) {
  try {
    const students = await getFiles();
    const student = students.find((s) => s.firebaseId === studentId);

    if (!student?.firebaseId) {
      throw new Error("firebaseId tidak ditemukan");
    }

    const docRef = doc(db, "students", student.firebaseId);

    await updateDoc(docRef, updatedStudent);

    return true;
  } catch (error) {
    console.error("Update error:", error);
    showToast("Gagal update data", "error");
    return false;
  }
}

export async function deleteStudent(id) {
  try {
    await deleteDoc(doc(db, "students", id));

    showToast("Mahasiswa berhasil dihapus", "success");

    await showList();
  } catch (error) {
    console.error("Delete student error:", error);

    showToast("Gagal menghapus mahasiswa", "error");
  }
}

export async function PostMahasiswa(params) {
  try {
    await addDoc(studentsCollection, params);
  } catch (error) {
    console.error(error);
    showToast("Gagal menghapus mahasiswa", "error");
  }
}
export async function deleteCourse(studentId, courseIndex) {
  try {
    courseIndex = Number(courseIndex);

    const students = await getFiles();

    const student = students.find((m) => m.firebaseId === studentId);

    if (!student) {
      showToast("Mahasiswa tidak ditemukan", "error");
      return;
    }

    const course = student.matakuliahs?.[courseIndex];

    if (!course) {
      showToast("Matakuliah tidak ditemukan", "error");
      return;
    }

    const updatedCourses = student.matakuliahs.filter(
      (_, idx) => idx !== courseIndex,
    );

    await putFile(studentId, {
      matakuliahs: updatedCourses,
    });

    await renderDetail(studentId);

    showToast(`Matakuliah "${course.nama}" dihapus`, "success");
  } catch (error) {
    console.error("Delete course error:", error);

    showToast("Gagal menghapus matakuliah", "error");
  }
}
